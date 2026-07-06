import { useEffect, useMemo, useState } from 'react'
import { useParams, useOutletContext, useSearchParams } from 'react-router-dom'
import { doc, getDoc, collection, setDoc, getDocs, query, where } from 'firebase/firestore'
import {
  BookOpen,
  Calendar,
  Clapperboard,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  Mic,
  Plus,
  Settings,
  Trash2,
  Users,
  Video,
  Loader2,
} from 'lucide-react'
import { db } from '../../config/firebase'
import { useAuth } from '../../context/AuthContext'
import {
  archiveClass,
  createNotification,
  endLiveMeeting,
  deleteClass,
  removeMemberFromClass,
  startLiveMeeting,
  subscribeToClassMeetings,
  subscribeToClassMaterials,
  subscribeToClassMembers,
  subscribeToLiveMeetings,
  subscribeToScheduledMeetings,
  subscribeToMeetingAttendance,
  subscribeToMeetingSummaries,
  updateClass,
  uploadClassMaterial,
  deleteClassMaterial,
  type LiveMeetingInvite,
  type MeetingAttendance,
  type MeetingSummary,
  type RecordingRecord,
  updateMeetingSummary,
  deleteMeetingSummary,
  saveRecording,
  deleteRecording,
  renameRecording,
  toggleRecordingDownloadPermission,
  subscribeToClassRecordings,
  uploadFileToStorage,
} from '../../services/db'
import type { WorkspaceMaterial, WorkspaceMeeting, WorkspaceMember } from './types'
import MeetingRoom from '../../pages/MeetingRoom'

const classTabs = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-4 h-4" /> },
  { id: 'scheduledMeetings', label: 'Scheduled Meetings', icon: <Calendar className="w-4 h-4" /> },
  { id: 'attendance', label: 'Attendance', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'materials', label: 'Materials', icon: <FileText className="w-4 h-4" /> },
  { id: 'recordings', label: 'Recordings', icon: <Clapperboard className="w-4 h-4" /> },
  { id: 'summaries', label: 'Meeting Summaries', icon: <Download className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
] as const

type TabId = (typeof classTabs)[number]['id']

interface ClassRecord {
  id: string
  name: string
  subject: string
  description?: string
  status?: 'active' | 'archived'
  classCode?: string
  inviteLink?: string
  facultyName?: string
  facultyId?: string
  createdAt?: string
}

const emptyMeetingForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  duration: '60',
}

export default function ClassWorkspace() {
  const { classId } = useParams<{ classId: string }>()
  const { currentUser } = useAuth()
  const { addToast } = useOutletContext<any>()
  const [searchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [classRecord, setClassRecord] = useState<ClassRecord | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [materials, setMaterials] = useState<WorkspaceMaterial[]>([])
  const [meetings, setMeetings] = useState<WorkspaceMeeting[]>([])
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([])
  const [summaries, setSummaries] = useState<MeetingSummary[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<MeetingAttendance[]>([])
  const [recordings, setRecordings] = useState<RecordingRecord[]>([])
  const [liveMeeting, setLiveMeeting] = useState<LiveMeetingInvite | null>(null)
  const [scheduleForm, setScheduleForm] = useState(emptyMeetingForm)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialFile, setMaterialFile] = useState<File | null>(null)
  const [materialFileUrl, setMaterialFileUrl] = useState('')
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false)
  const [editClassName, setEditClassName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [attendanceSearch, setAttendanceSearch] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All')
  const [attendanceViewType, setAttendanceViewType] = useState<'student' | 'session'>('student')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [editingSummaryId, setEditingSummaryId] = useState<string | null>(null)
  const [editSummaryForm, setEditSummaryForm] = useState({
    title: '',
    summary: '',
    topicsCovered: '',
    homework: '',
    announcements: '',
    notes: '',
    recordingUrl: '',
  })
  const [summarySearch, setSummarySearch] = useState('')
  const [recordingTitle, setRecordingTitle] = useState('')
  const [recordingFile, setRecordingFile] = useState<File | null>(null)
  const [recordingFileUrl, setRecordingFileUrl] = useState('')
  const [recordingDuration, setRecordingDuration] = useState('60 mins')
  const [isUploadingRecording, setIsUploadingRecording] = useState(false)
  const [renamingRecordingId, setRenamingRecordingId] = useState<string | null>(null)
  const [newRecordingName, setNewRecordingName] = useState('')
  const [loading, setLoading] = useState(true)
  const [inCall, setInCall] = useState(false)

  const isFaculty = currentUser?.role === 'faculty'

  const visibleTabs = useMemo(() => {
    if (isFaculty) {
      return classTabs
    } else {
      return classTabs.filter((tab) => ['overview', 'meetings', 'attendance', 'materials', 'recordings', 'summaries'].includes(tab.id))
    }
  }, [isFaculty])

  useEffect(() => {
    if (searchParams.get('join') === 'true' && liveMeeting) {
      setInCall(true)
    }
  }, [searchParams, liveMeeting])

  useEffect(() => {
    if (!classId) return

    let cancelled = false

    const loadClass = async () => {
      try {
        const snap = await getDoc(doc(db, 'classes', classId))
        if (!cancelled) {
          const record = snap.exists() ? ({ id: snap.id, ...snap.data() } as ClassRecord) : null
          setClassRecord(record)
          setEditClassName(record?.name || '')
          setEditSubject(record?.subject || '')
          setEditDescription(record?.description || '')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadClass()

    const unsubMembers = subscribeToClassMembers(classId, (list) => setMembers(list as WorkspaceMember[]))
    const unsubMaterials = subscribeToClassMaterials(classId, (list) => setMaterials(list as WorkspaceMaterial[]))
    const unsubMeetings = subscribeToClassMeetings(classId, (list) => setMeetings(list as WorkspaceMeeting[]))
    const unsubSummaries = subscribeToMeetingSummaries(classId, (list) => setSummaries(list))
    const unsubAttendance = subscribeToMeetingAttendance(classId, (list) => setAttendanceRecords(list))
    const unsubRecordings = subscribeToClassRecordings(classId, (list) => setRecordings(list))
    const unsubScheduled = subscribeToScheduledMeetings((list) => {
      setScheduledMeetings(list.filter((meeting: any) => meeting.classId === classId || meeting.className === classRecord?.name))
    })
    const unsubLive = subscribeToLiveMeetings((list) => {
      setLiveMeeting(list.find((meeting) => meeting.classId === classId) || null)
    })

    return () => {
      cancelled = true
      unsubMembers()
      unsubMaterials()
      unsubMeetings()
      unsubSummaries()
      unsubAttendance()
      unsubRecordings()
      unsubScheduled()
      unsubLive()
    }
  }, [classId, classRecord?.name])

  const recordingMeetings = useMemo(
    () => recordings as any[],
    [recordings],
  )

  const meetingCount = meetings.length + scheduledMeetings.length

  const classAnalytics = useMemo(() => {
    const totalMeetings = meetings.length;
    const totalStudents = members.length;
    
    const meetingIds = Array.from(new Set(attendanceRecords.map((r) => r.meetingId)));
    let avgAttendance = 100;
    if (meetingIds.length > 0 && totalStudents > 0) {
      const sumPcts = meetingIds.reduce((sum, mId) => {
        const meetingAtts = attendanceRecords.filter((r) => r.meetingId === mId);
        const attendedCount = meetingAtts.filter((r) => r.status === 'Present' || r.status === 'Late').length;
        return sum + (attendedCount / totalStudents) * 100;
      }, 0);
      avgAttendance = Math.round(sumPcts / meetingIds.length);
    }

    const totalRecordings = recordings.length;

    const lastMeeting = meetings.length > 0 
      ? [...meetings].sort((a, b) => {
          const timeA = new Date(a.startedAt || a.scheduledAt || 0).getTime();
          const timeB = new Date(b.startedAt || b.scheduledAt || 0).getTime();
          return timeB - timeA;
        })[0]
      : null;
    const lastMeetingDateStr = lastMeeting 
      ? new Date(lastMeeting.startedAt || lastMeeting.scheduledAt || 0).toLocaleDateString() 
      : 'N/A';

    const totalMaterials = materials.length;
    const isActiveLive = !!liveMeeting;

    return {
      totalMeetings,
      totalStudents,
      avgAttendance,
      totalRecordings,
      lastMeetingDateStr,
      totalMaterials,
      isActiveLive,
    };
  }, [meetings, members, attendanceRecords, recordings, liveMeeting]);

  const meetingSessionsList = useMemo(() => Array.from(new Set(attendanceRecords.map((r) => r.meetingId))), [attendanceRecords])

  const studentAttendanceStats = useMemo(() => {
    const stats: Record<string, {
      studentId: string;
      studentName: string;
      presentCount: number;
      lateCount: number;
      absentCount: number;
      totalCount: number;
      attendancePct: number;
      history: typeof attendanceRecords;
    }> = {};

    members.forEach((m) => {
      stats[m.id] = {
        studentId: m.id,
        studentName: m.name,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalCount: 0,
        attendancePct: 100,
        history: [],
      };
    });

    attendanceRecords.forEach((r) => {
      const studentId = r.studentId;
      if (!stats[studentId]) {
        stats[studentId] = {
          studentId: r.studentId,
          studentName: r.studentName || 'Student',
          presentCount: 0,
          lateCount: 0,
          absentCount: 0,
          totalCount: 0,
          attendancePct: 100,
          history: [],
        };
      }
      const s = stats[studentId];
      s.history.push(r);
      s.totalCount++;
      if (r.status === 'Present') s.presentCount++;
      else if (r.status === 'Late') s.lateCount++;
      else if (r.status === 'Absent') s.absentCount++;
    });

    Object.values(stats).forEach((s) => {
      const total = meetingSessionsList.length || s.totalCount;
      const attended = s.presentCount + s.lateCount;
      s.attendancePct = total > 0 ? Math.round((attended / total) * 100) : 100;
    });

    return Object.values(stats);
  }, [members, attendanceRecords, meetingSessionsList]);

  const studentPersonalStats = useMemo(() => {
    if (isFaculty || !currentUser) return null;
    const personalRecords = attendanceRecords.filter((r) => r.studentId === currentUser.id);
    const presentCount = personalRecords.filter((r) => r.status === 'Present').length;
    const lateCount = personalRecords.filter((r) => r.status === 'Late').length;
    const absentCount = personalRecords.filter((r) => r.status === 'Absent').length;
    const totalClasses = meetingSessionsList.length;
    const attendedCount = presentCount + lateCount;
    const attendancePct = totalClasses > 0 ? Math.round((attendedCount / totalClasses) * 100) : 100;

    return {
      presentCount,
      lateCount,
      absentCount,
      totalClasses,
      attendedCount,
      attendancePct,
      history: personalRecords,
    };
  }, [attendanceRecords, isFaculty, currentUser, meetingSessionsList]);

  const handleExportAttendanceLogs = () => {
    if (attendanceRecords.length === 0) {
      addToast('No attendance records to export', 'warning');
      return;
    }
    let csvContent = "Student ID,Student Name,Status,Join Time,Leave Time,Duration (Mins)\n";
    attendanceRecords.forEach((r) => {
      const joinTimeStr = r.joinTime ? new Date(r.joinTime).toLocaleString() : 'N/A';
      const leaveTimeStr = r.leaveTime ? new Date(r.leaveTime).toLocaleString() : 'N/A';
      const durationMins = r.duration ? Math.round(r.duration / 60) : 0;
      csvContent += `"${r.studentId}","${r.studentName}","${r.status}","${joinTimeStr}","${leaveTimeStr}",${durationMins}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${classRecord?.name || 'Class'}_Attendance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Attendance report exported as CSV successfully!', 'success');
  };

  const handleStartEditSummary = (summary: MeetingSummary) => {
    setEditingSummaryId(summary.id)
    setEditSummaryForm({
      title: summary.title || '',
      summary: summary.summary || '',
      topicsCovered: summary.topicsCovered ? summary.topicsCovered.join(', ') : '',
      homework: summary.homework || '',
      announcements: summary.announcements || '',
      notes: summary.notes || '',
      recordingUrl: summary.recordingUrl || '',
    })
  }

  const handleUpdateSummary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSummaryId) return
    try {
      const topics = editSummaryForm.topicsCovered
        ? editSummaryForm.topicsCovered.split(',').map((t) => t.trim()).filter(Boolean)
        : []
      await updateMeetingSummary(editingSummaryId, {
        title: editSummaryForm.title,
        summary: editSummaryForm.summary,
        topicsCovered: topics,
        homework: editSummaryForm.homework,
        announcements: editSummaryForm.announcements,
        notes: editSummaryForm.notes,
        recordingUrl: editSummaryForm.recordingUrl,
      })
      setEditingSummaryId(null)
      addToast('Meeting summary updated successfully!', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to update meeting summary.', 'error')
    }
  }

  const handleDeleteSummary = async (summaryId: string) => {
    if (!window.confirm('Are you sure you want to delete this meeting summary? This cannot be undone.')) return
    try {
      await deleteMeetingSummary(summaryId)
      addToast('Meeting summary deleted.', 'info')
    } catch (err) {
      console.error(err)
      addToast('Failed to delete meeting summary.', 'error')
    }
  }

  const handleUploadRecording = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId) return
    if (!recordingTitle) {
      addToast('Please enter a recording title', 'warning')
      return
    }
    if (!recordingFile && !recordingFileUrl) {
      addToast('Please select a file or provide an external video link', 'warning')
      return
    }

    setIsUploadingRecording(true)
    try {
      let finalUrl = recordingFileUrl
      let fileSizeStr = 'External Link'

      if (recordingFile) {
        const result = await uploadFileToStorage(recordingFile)
        finalUrl = result.url
        fileSizeStr = `${(recordingFile.size / (1024 * 1024)).toFixed(1)} MB`
      }

      await saveRecording({
        classId,
        meetingId: `meeting-${Date.now()}`,
        facultyId: currentUser?.id || '',
        recordingName: recordingTitle,
        recordingUrl: finalUrl,
        duration: recordingDuration || 'N/A',
        size: fileSizeStr,
        allowDownload: true,
      })

      setRecordingTitle('')
      setRecordingFile(null)
      setRecordingFileUrl('')
      setRecordingDuration('60 mins')
      addToast('Recording uploaded successfully!', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to upload recording.', 'error')
    } finally {
      setIsUploadingRecording(false)
    }
  }

  const handleRenameRecording = async (recordingId: string) => {
    if (!newRecordingName) {
      addToast('Recording name cannot be empty', 'warning')
      return
    }
    try {
      await renameRecording(recordingId, newRecordingName)
      setRenamingRecordingId(null)
      setNewRecordingName('')
      addToast('Recording renamed successfully', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to rename recording', 'error')
    }
  }

  const handleDeleteRecording = async (recordingId: string) => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return
    try {
      await deleteRecording(recordingId)
      addToast('Recording deleted.', 'info')
    } catch (err) {
      console.error(err)
      addToast('Failed to delete recording.', 'error')
    }
  }

  const handleShareRecording = async (recording: RecordingRecord) => {
    try {
      await navigator.clipboard.writeText(recording.recordingUrl)
      addToast('Recording link copied to clipboard!', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to copy link.', 'error')
    }
  }

  const handleToggleDownloadPermission = async (recordingId: string, currentVal: boolean) => {
    try {
      await toggleRecordingDownloadPermission(recordingId, !currentVal)
      addToast(`Download permission ${!currentVal ? 'enabled' : 'disabled'} for students.`, 'info')
    } catch (err) {
      console.error(err)
      addToast('Failed to update download permission.', 'error')
    }
  }

  const copyInvite = async () => {
    if (!classRecord?.classCode) return
    const link = `${window.location.origin}/join/${classRecord.classCode}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    addToast('Invite link copied to clipboard.', 'info')
    window.setTimeout(() => setCopied(false), 1800)
  }

  const startClassSession = async () => {
    if (!classId || !classRecord) return

    try {
      const channelName = classId
      await startLiveMeeting(channelName, {
        id: channelName,
        title: `${classRecord.subject} Live Session`,
        sectionName: classRecord.name,
        host: currentUser?.name || 'Faculty',
        invitedStudents: members.map((member) => member.id),
        classId,
        facultyId: currentUser?.id,
        subject: classRecord.subject,
      })

      const membersSnap = await getDocs(query(collection(db, 'class_members'), where('classId', '==', classId)))
      await Promise.all(
        membersSnap.docs.map((memberDoc) => {
          const member = memberDoc.data()
          return createNotification({
            userId: member.studentId,
            title: `${classRecord.name} is live`,
            description: `${currentUser?.name || 'Faculty'} started ${classRecord.subject}. Join now with ${classRecord.classCode || 'your class code'}.`,
            type: 'info',
            priority: 'high',
            classId,
            meetingId: channelName,
          })
        }),
      )

      addToast('Live class session started.', 'success')
      setInCall(true)
    } catch (error: any) {
      console.error('Failed to start live session:', error)
      addToast(`Failed to start session: ${error.message}`, 'error')
    }
  }

  const endClassSession = async () => {
    if (!classId) return
    await endLiveMeeting(classId)
    addToast('Live class session ended.', 'info')
  }

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !classRecord || !scheduleForm.title.trim() || !scheduleForm.date || !scheduleForm.time) {
      addToast('Fill out the meeting title, date, and time.', 'warning')
      return
    }

    const meetingId = `meeting-${Date.now()}`
    const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`)
    const endTime = new Date(scheduledAt.getTime() + Number(scheduleForm.duration) * 60000)

    await setDoc(doc(collection(db, 'scheduled_meetings'), meetingId), {
      id: meetingId,
      meetingId,
      classId,
      className: classRecord.name,
      title: scheduleForm.title.trim(),
      description: scheduleForm.description.trim(),
      facultyId: currentUser?.id || classRecord.facultyId || '',
      facultyName: currentUser?.name || classRecord.facultyName || 'Faculty',
      scheduledDate: scheduledAt.toISOString(),
      startTime: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      invitedStudents: members.map((member) => member.id),
      status: 'scheduled',
      duration: Number(scheduleForm.duration),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    setScheduleForm(emptyMeetingForm)
    addToast('Meeting scheduled successfully.', 'success')
  }

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !materialTitle.trim() || (!materialFile && !materialFileUrl.trim())) {
      addToast('Add a title and either select a file or provide a link.', 'warning')
      return
    }

    if (materialFile && materialFile.size > 50 * 1024 * 1024) {
      addToast('File must be smaller than 50MB.', 'error')
      return
    }

    setIsUploadingMaterial(true)
    try {
      await uploadClassMaterial(
        classId,
        materialTitle.trim(),
        materialFile,
        materialFileUrl.trim(),
        currentUser?.name || 'Faculty',
      )

      setMaterialTitle('')
      setMaterialFile(null)
      setMaterialFileUrl('')
      addToast('Material uploaded successfully.', 'success')
    } catch (err: any) {
      console.error('Material upload error:', err)
      addToast(`Upload failed: ${(err as Error)?.message || 'Unknown error'}`, 'error')
    } finally {
      setIsUploadingMaterial(false)
    }
  }

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !editClassName.trim() || !editSubject.trim()) {
      addToast('Class name and subject are required.', 'warning')
      return
    }

    await updateClass(classId, {
      name: editClassName.trim(),
      subject: editSubject.trim(),
      description: editDescription.trim(),
    })

    addToast('Class updated successfully.', 'success')
  }

  const handleArchiveClass = async () => {
    if (!classId) return
    await archiveClass(classId)
    addToast('Class archived.', 'info')
  }

  const handleDeleteClass = async () => {
    if (!classId) return
    await deleteClass(classId)
    addToast('Class deleted.', 'info')
  }

  const handleJoinCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classId || !joinCode.trim()) return
    addToast(`Joining class ${classRecord?.name || classId} with code ${joinCode.trim().toUpperCase()}.`, 'info')
    setJoinCode('')
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!classId) return
    await removeMemberFromClass(classId, memberId)
    addToast('Member removed from class.', 'info')
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-300">
        Loading class workspace...
      </div>
    )
  }

  if (!classRecord) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-slate-300">
        Class not found.
      </div>
    )
  }

  if (inCall) {
    return (
      <MeetingRoom
        meetingId={classId!}
        meetingSessionId={liveMeeting?.meetingSessionId || `meeting-${classId}`}
        meetingStartedAt={liveMeeting?.startedAt}
        meetingTitle={`${classRecord.subject} Live Session`}
        selectedStudents={members.map((m) => ({ id: m.id, name: m.name, email: m.email }))}
        currentUser={{
          id: currentUser?.id || '',
          name: currentUser?.name || '',
          email: currentUser?.email || '',
          role: currentUser?.role || 'student',
        }}
        onEndMeeting={() => {
          setInCall(false)
          if (isFaculty) {
            endClassSession()
          }
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-slate-950/20">
        {liveMeeting && (
          <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-bold">Live session active: </span>
              {liveMeeting.title}
            </div>
            {!isFaculty && (
              <button
                onClick={() => setInCall(true)}
                className="rounded-xl bg-emerald-400 text-slate-950 font-bold px-4 py-2 hover:bg-emerald-350 transition flex-shrink-0 text-center text-xs"
              >
                Join Live Class
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5" />
              Class hub
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{classRecord.name}</h1>
              <p className="mt-2 text-slate-300 text-sm md:text-base max-w-2xl">
                {classRecord.subject}
                {classRecord.description ? ` · ${classRecord.description}` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
            {isFaculty && (
              <button
                type="button"
                onClick={copyInvite}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition hover:border-cyan-400/30"
              >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                <LinkIcon className="h-3.5 w-3.5" />
                Invite link
              </div>
              <div className="mt-2 text-sm font-semibold text-white break-all">{classRecord.classCode ? `${window.location.origin}/join/${classRecord.classCode}` : 'Not configured'}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy class invite'}
                </div>
            </button>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Class code</div>
              <div className="mt-2 text-2xl font-black text-cyan-300">{classRecord.classCode || 'N/A'}</div>
              <div className="mt-2 text-xs text-slate-500">{classRecord.facultyName || 'Faculty'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Students</div>
            <div className="mt-2 text-3xl font-black text-white">{classAnalytics.totalStudents}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Conducted Meetings</div>
            <div className="mt-2 text-3xl font-black text-white">{classAnalytics.totalMeetings}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Average Attendance</div>
            <div className="mt-2 text-3xl font-black text-cyan-300">{classAnalytics.avgAttendance}%</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Live Class</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-black text-white">{classAnalytics.isActiveLive ? 'Yes' : 'No'}</span>
              {classAnalytics.isActiveLive && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Recordings</div>
            <div className="mt-2 text-3xl font-black text-white">{classAnalytics.totalRecordings}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Study Materials</div>
            <div className="mt-2 text-3xl font-black text-white">{classAnalytics.totalMaterials}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:bg-slate-900/50 transition sm:col-span-2">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Last Meeting Date</div>
            <div className="mt-2 text-3xl font-black text-white">{classAnalytics.lastMeetingDateStr}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isFaculty && (
            <>
              {liveMeeting ? (
                <button onClick={() => setInCall(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                  <Mic className="h-4 w-4" />
                  Join active class session
                </button>
              ) : (
                <button onClick={startClassSession} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">
                  <Mic className="h-4 w-4" />
                  Start live class
                </button>
              )}
              {liveMeeting && (
                <button onClick={endClassSession} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
                  <Trash2 className="h-4 w-4" />
                  End live class
                </button>
              )}
            </>
          )}

          {isFaculty && classRecord.classCode && (
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my class "${classRecord.name}" on Video Pro using link: ${classRecord.inviteLink || `${window.location.origin}/join/${classRecord.classCode}`} or Class Code: ${classRecord.classCode}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Share via WhatsApp
            </a>
          )}

          <button type="button" onClick={() => setActiveTab('meetings')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
            <Calendar className="h-4 w-4" />
            Meetings
          </button>
          <button type="button" onClick={() => setActiveTab('materials')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-900">
            <FileText className="h-4 w-4" />
            Study Materials
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-3 backdrop-blur-xl">
          <div className="space-y-2">
            {visibleTabs.map((tab) => {
              const label = tab.id === 'materials' ? 'Study Materials' : tab.label
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100' : 'border-transparent bg-slate-950/30 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'}`}
                >
                  {tab.icon}
                  {label}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 md:p-6 backdrop-blur-xl">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Owner</div>
                  <div className="mt-2 text-white font-semibold">{classRecord.facultyName || 'Faculty'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Subject</div>
                  <div className="mt-2 text-white font-semibold">{classRecord.subject}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Created</div>
                  <div className="mt-2 text-white font-semibold">{classRecord.createdAt ? new Date(classRecord.createdAt).toLocaleDateString() : 'Today'}</div>
                </div>
              </div>

              <form onSubmit={handleJoinCode} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Users className="h-4 w-4 text-cyan-300" />
                  Join class by code
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/40"
                  />
                  <button className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950">Join</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-3">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                  No students enrolled yet.
                </div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-white font-semibold">{member.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{member.email}</div>
                    </div>
                    {isFaculty && (
                      <button onClick={() => handleRemoveMember(member.id)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-200">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="space-y-6">
              {isFaculty && (
                <form onSubmit={handleScheduleMeeting} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Calendar className="h-4 w-4 text-fuchsia-300" />
                    Schedule a meeting
                  </div>
                  <input
                    value={scheduleForm.title}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Meeting title"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                  <textarea
                    value={scheduleForm.description}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none min-h-[84px]"
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none"
                    />
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, time: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none"
                    />
                    <select
                      value={scheduleForm.duration}
                      onChange={(e) => setScheduleForm((prev) => ({ ...prev, duration: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:outline-none"
                    >
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white">
                    <Plus className="h-4 w-4" />
                    Schedule
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {scheduledMeetings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                    No scheduled meetings yet.
                  </div>
                ) : (
                  scheduledMeetings.map((meeting: any) => (
                    <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-white font-semibold">{meeting.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{meeting.description || 'Scheduled class session'}</div>
                          <div className="mt-2 text-xs text-slate-500">
                            {new Date(meeting.scheduledDate).toLocaleString()} · {meeting.duration || 60} mins
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                          {meeting.status || 'scheduled'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                {meetings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                    No class meetings recorded yet.
                  </div>
                ) : (
                  meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-white font-semibold">{meeting.title}</div>
                        <div className="mt-1 text-sm text-slate-400">{meeting.description || 'Recorded class session'}</div>
                      </div>
                      {meeting.recordingUrl || (meeting as any).recording ? (
                        <a href={meeting.recordingUrl || (meeting as any).recording} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white">
                          <Download className="h-4 w-4" />
                          Recording
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">No recording yet</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'scheduledMeetings' && (
            <div className="space-y-3">
              {scheduledMeetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                  No scheduled meetings yet.
                </div>
              ) : (
                scheduledMeetings.map((meeting: any) => (
                  <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-white font-semibold">{meeting.title}</div>
                        <div className="mt-1 text-sm text-slate-400">{meeting.description || 'Scheduled class session'}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          {new Date(meeting.scheduledDate).toLocaleString()} · {meeting.duration || 60} mins
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        {meeting.status || 'scheduled'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {isFaculty ? (
                <>
                  {/* Faculty Overview Stats */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Avg Class Attendance</div>
                      <div className="mt-2 text-2xl font-bold text-cyan-300">{classAnalytics.avgAttendance}%</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Sessions</div>
                      <div className="mt-2 text-2xl font-bold text-white">{meetingSessionsList.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Students Enrolled</div>
                      <div className="mt-2 text-2xl font-bold text-white">{members.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex items-center justify-center">
                      <button
                        onClick={handleExportAttendanceLogs}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-4 py-2.5 text-sm font-bold text-slate-950 transition"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  {/* Filter & View Controls */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setAttendanceViewType('student')}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${attendanceViewType === 'student' ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      >
                        View by Student
                      </button>
                      <button
                        onClick={() => {
                          setAttendanceViewType('session');
                          if (meetingSessionsList.length > 0 && !selectedSessionId) {
                            setSelectedSessionId(meetingSessionsList[0]);
                          }
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-bold transition ${attendanceViewType === 'session' ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      >
                        View by Session
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none w-44"
                      />
                      <select
                        value={attendanceFilter}
                        onChange={(e: any) => setAttendanceFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Present">Present</option>
                        <option value="Late">Late</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>
                  </div>

                  {/* Content Panels */}
                  {attendanceViewType === 'student' ? (
                    <div className="space-y-3">
                      {studentAttendanceStats
                        .filter((stat) => {
                          const matchesSearch = stat.studentName.toLowerCase().includes(attendanceSearch.toLowerCase());
                          if (attendanceFilter === 'All') return matchesSearch;
                          return matchesSearch && stat.history.some((h) => h.status === attendanceFilter);
                        })
                        .map((stat) => (
                          <div key={stat.studentId} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white text-lg">{stat.studentName}</div>
                                <div className="text-xs text-slate-500 mt-0.5">ID: {stat.studentId}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-black text-cyan-300">{stat.attendancePct}%</div>
                                <div className="text-xs text-slate-500 mt-0.5">Attendance Rate</div>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                              <div className="rounded-xl bg-slate-950/40 p-2">
                                <div className="text-slate-500">Present</div>
                                <div className="mt-1 font-bold text-emerald-400">{stat.presentCount}</div>
                              </div>
                              <div className="rounded-xl bg-slate-950/40 p-2">
                                <div className="text-slate-500">Late</div>
                                <div className="mt-1 font-bold text-amber-400">{stat.lateCount}</div>
                              </div>
                              <div className="rounded-xl bg-slate-950/40 p-2">
                                <div className="text-slate-500">Absent</div>
                                <div className="mt-1 font-bold text-rose-400">{stat.absentCount}</div>
                              </div>
                              <div className="rounded-xl bg-slate-950/40 p-2">
                                <div className="text-slate-500">Total Classes</div>
                                <div className="mt-1 font-bold text-white">{meetingSessionsList.length}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meetingSessionsList.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                          No sessions conducted yet.
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-semibold uppercase">Select Session:</span>
                            <select
                              value={selectedSessionId}
                              onChange={(e) => setSelectedSessionId(e.target.value)}
                              className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                            >
                              {meetingSessionsList.map((mId) => (
                                <option key={mId} value={mId}>
                                  Session {mId.replace('meeting-', '')}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            {attendanceRecords
                              .filter((r) => r.meetingId === selectedSessionId)
                              .filter((r) => {
                                const matchesSearch = r.studentName.toLowerCase().includes(attendanceSearch.toLowerCase());
                                if (attendanceFilter === 'All') return matchesSearch;
                                return matchesSearch && r.status === attendanceFilter;
                              })
                              .map((entry) => (
                                <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-white font-semibold">{entry.studentName}</div>
                                    <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-4">
                                      <span>Join: {entry.joinTime ? new Date(entry.joinTime).toLocaleTimeString() : 'N/A'}</span>
                                      <span>Leave: {entry.leaveTime ? new Date(entry.leaveTime).toLocaleTimeString() : 'N/A'}</span>
                                      <span>Duration: {entry.duration ? `${Math.round(entry.duration / 60)} mins` : '0 mins'}</span>
                                    </div>
                                  </div>
                                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.status === 'Present' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : entry.status === 'Late' ? 'border-amber-400/20 bg-amber-500/10 text-amber-300' : 'border-rose-400/20 bg-rose-500/10 text-rose-300'}`}>
                                    {entry.status}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Student View Stats */}
                  {studentPersonalStats && (
                    <div className="space-y-6">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your Attendance Rate</div>
                          <div className="mt-2 text-2xl font-bold text-cyan-300">{studentPersonalStats.attendancePct}%</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Present</div>
                          <div className="mt-2 text-2xl font-bold text-emerald-400">{studentPersonalStats.presentCount}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Late</div>
                          <div className="mt-2 text-2xl font-bold text-amber-400">{studentPersonalStats.lateCount}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Absent</div>
                          <div className="mt-2 text-2xl font-bold text-rose-400">{studentPersonalStats.absentCount}</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-white font-bold text-lg">Chronological History</div>
                        {studentPersonalStats.history.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                            No attendance history captured yet.
                          </div>
                        ) : (
                          studentPersonalStats.history
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((entry) => (
                              <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-white font-semibold">Session {entry.meetingId.replace('meeting-', '')}</div>
                                  <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-x-4">
                                    <span>Date: {new Date(entry.createdAt).toLocaleDateString()}</span>
                                    <span>Join: {entry.joinTime ? new Date(entry.joinTime).toLocaleTimeString() : 'N/A'}</span>
                                    <span>Duration: {entry.duration ? `${Math.round(entry.duration / 60)} mins` : '0 mins'}</span>
                                  </div>
                                </div>
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.status === 'Present' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : entry.status === 'Late' ? 'border-amber-400/20 bg-amber-500/10 text-amber-300' : 'border-rose-400/20 bg-rose-500/10 text-rose-300'}`}>
                                  {entry.status}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              {isFaculty && (
                <form onSubmit={handleUploadMaterial} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <FileText className="h-4 w-4 text-cyan-300" />
                    Upload a resource
                  </div>
                  <input value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Material title" className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" />
                  
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input 
                      type="file" 
                      onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} 
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 focus:outline-none" 
                    />
                    <div className="flex items-center justify-center text-slate-500 text-xs font-semibold px-2">OR</div>
                    <input value={materialFileUrl} onChange={(e) => setMaterialFileUrl(e.target.value)} placeholder="External link (e.g. Google Drive)" className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" />
                  </div>

                  <button 
                    disabled={isUploadingMaterial}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isUploadingMaterial ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                       <Plus className="h-4 w-4" />
                    )}
                    {isUploadingMaterial ? 'Uploading...' : 'Upload'}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {materials.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                    No materials uploaded yet.
                  </div>
                ) : (
                  materials.map((material) => (
                    <div key={material.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{material.title}</div>
                        <div className="mt-1 text-sm text-slate-400 truncate">{material.fileName || 'Resource file'}</div>
                        {material.fileSize && material.fileSize !== 'N/A' && (
                          <div className="mt-0.5 text-xs text-slate-600">{material.fileSize}</div>
                        )}
                      </div>
                          <div className="flex items-center gap-2 shrink-0">
                        {material.fileUrl ? (() => {
                          const url = material.fileUrl as string;
                          const name = (material.fileName as string) || 'download';
                          const mimeType = (material.fileType as string) || '';
                          const isVideo = mimeType.startsWith('video/');
                          const isOfficeDoc = /\.(docx?|pptx?|xlsx?)$/i.test(name);

                          const isSupabase = url.includes('supabase.co/storage');
                          const isCloudinary = url.includes('cloudinary.com');
                          const isPdf = mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf');

                          // --- VIEW URL ---
                          // Supabase & images: direct URL (browsers open these natively)
                          // Old Cloudinary raw PDFs need image URL rewrite to render
                          // Office docs and unrecognised URLs: Google Docs viewer
                          let viewUrl: string;
                          if (isSupabase || (!isPdf && !isOfficeDoc)) {
                            viewUrl = url;
                          } else if (isCloudinary && isPdf) {
                            viewUrl = url.replace('/raw/upload/', '/image/upload/');
                          } else if (isPdf || isOfficeDoc) {
                            viewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`;
                          } else {
                            viewUrl = url;
                          }

                          // --- DOWNLOAD ---
                          const handleDownload = async () => {
                            if (isCloudinary) {
                              // Cloudinary CORS blocks fetch — use fl_attachment URL directly
                              const dlUrl = url.replace(/\/upload\//, '/upload/fl_attachment/');
                              window.open(dlUrl, '_blank');
                              return;
                            }
                            if (isSupabase) {
                              // Supabase public buckets allow CORS — fetch as blob for true download
                              try {
                                const response = await fetch(url);
                                if (!response.ok) throw new Error('response not ok');
                                const blob = await response.blob();
                                if (blob.size === 0) throw new Error('empty blob');
                                const blobUrl = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                              } catch {
                                // Fallback: server-side download header
                                const dlUrl = `${url}?download=true`;
                                window.open(dlUrl, '_blank');
                              }
                              return;
                            }
                            // Generic external link
                            window.open(url, '_blank');
                          };

                          return (
                            <>
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </a>
                              {!isVideo && (
                                <button
                                  type="button"
                                  onClick={handleDownload}
                                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </button>
                              )}
                            </>
                          );
                        })() : null}
                        {isFaculty && (
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
                              try {
                                await deleteClassMaterial(material.id);
                                addToast('Material deleted.', 'info');
                              } catch {
                                addToast('Failed to delete material.', 'error');
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
                            title="Delete material"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="space-y-6">
              {/* Faculty Upload Recording Form */}
              {isFaculty && (
                <form onSubmit={handleUploadRecording} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Clapperboard className="h-4 w-4 text-purple-300" />
                    Upload / Add Class Recording
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      value={recordingTitle}
                      onChange={(e) => setRecordingTitle(e.target.value)}
                      placeholder="Recording name (e.g. Lecture 1: Algebra)"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      value={recordingDuration}
                      onChange={(e) => setRecordingDuration(e.target.value)}
                      placeholder="Duration (e.g. 60 mins)"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={(e) => setRecordingFile(e.target.files?.[0] || null)} 
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 focus:outline-none" 
                    />
                    <div className="flex items-center justify-center text-slate-500 text-xs font-semibold px-2">OR</div>
                    <input
                      value={recordingFileUrl}
                      onChange={(e) => setRecordingFileUrl(e.target.value)}
                      placeholder="External video link (e.g. Drive, YouTube)"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button 
                    disabled={isUploadingRecording}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-600 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isUploadingRecording ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                       <Plus className="h-4 w-4" />
                    )}
                    {isUploadingRecording ? 'Uploading Video...' : 'Add Recording'}
                  </button>
                </form>
              )}

              {/* Recordings List */}
              <div className="space-y-3">
                {recordingMeetings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                    No recordings available yet.
                  </div>
                ) : (
                  recordingMeetings.map((rec) => (
                    <div key={rec.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5">
                      {renamingRecordingId === rec.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newRecordingName}
                            onChange={(e) => setNewRecordingName(e.target.value)}
                            className="flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm text-white focus:outline-none"
                            placeholder="Enter new name"
                          />
                          <button
                            onClick={() => handleRenameRecording(rec.id)}
                            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setRenamingRecordingId(null)}
                            className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="text-white font-semibold text-lg">{rec.recordingName || rec.title || 'Class Recording'}</div>
                            <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              <span>Duration: {rec.duration || 'N/A'}</span>
                              <span>Size: {rec.size || 'N/A'}</span>
                              <span>Uploaded: {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Watch Video */}
                            <a
                              href={rec.recordingUrl || rec.recording}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-slate-950 transition"
                            >
                              <Eye className="h-4 w-4" />
                              Watch
                            </a>

                            {/* Download Video (If permitted or isFaculty) */}
                            {(isFaculty || rec.allowDownload !== false) && (
                              <a
                                href={rec.recordingUrl || rec.recording}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                            )}

                            {/* Share Link */}
                            <button
                              onClick={() => handleShareRecording(rec)}
                              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition"
                              title="Copy share link"
                            >
                              Copy Link
                            </button>

                            {/* Faculty specific actions */}
                            {isFaculty && (
                              <>
                                <button
                                  onClick={() => {
                                    setRenamingRecordingId(rec.id);
                                    setNewRecordingName(rec.recordingName || rec.title || '');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-300 transition"
                                  title="Rename recording"
                                >
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleToggleDownloadPermission(rec.id, rec.allowDownload ?? true)}
                                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${rec.allowDownload !== false ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                  title={rec.allowDownload !== false ? "Disable download for students" : "Enable download for students"}
                                >
                                  {rec.allowDownload !== false ? "Downloads Enabled" : "Downloads Blocked"}
                                </button>
                                <button
                                  onClick={() => handleDeleteRecording(rec.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3 py-2.5 text-sm font-semibold text-red-400 transition"
                                  title="Delete recording"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'summaries' && (
            <div className="space-y-6">
              {/* Search Summaries */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <input
                  type="text"
                  placeholder="Search meeting summaries..."
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="space-y-4">
                {summaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                    No meeting summaries yet.
                  </div>
                ) : (
                  summaries
                    .filter((s) => s.title.toLowerCase().includes(summarySearch.toLowerCase()) || (s.summary || '').toLowerCase().includes(summarySearch.toLowerCase()))
                    .map((summary) => (
                      <div key={summary.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-3">
                        {editingSummaryId === summary.id ? (
                          <form onSubmit={handleUpdateSummary} className="space-y-4">
                            <div className="text-white font-bold">Edit Meeting Summary</div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Meeting Title</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.title}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, title: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Topics (comma-separated)</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.topicsCovered}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, topicsCovered: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-slate-400 font-semibold uppercase">Summary</label>
                              <textarea
                                value={editSummaryForm.summary}
                                onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, summary: e.target.value }))}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none min-h-[80px]"
                              />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Homework</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.homework}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, homework: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Announcements</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.announcements}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, announcements: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Notes</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.notes}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, notes: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-semibold uppercase">Recording Link</label>
                                <input
                                  type="text"
                                  value={editSummaryForm.recordingUrl}
                                  onChange={(e) => setEditSummaryForm((prev) => ({ ...prev, recordingUrl: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">
                                Save Summary
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSummaryId(null)}
                                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-white font-bold text-lg">{summary.title}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Conducted on {summary.date ? new Date(summary.date).toLocaleDateString() : 'N/A'} · Duration: {summary.duration ? `${Math.round(summary.duration / 60)} mins` : 'N/A'}
                                </div>
                              </div>
                              {isFaculty && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStartEditSummary(summary)}
                                    className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSummary(summary.id)}
                                    className="rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-xs font-bold text-red-400 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-slate-300 mt-2">{summary.summary || 'No summary notes written yet.'}</div>
                            
                            {summary.topicsCovered && summary.topicsCovered.length > 0 && (
                              <div className="mt-2 text-xs text-slate-500">
                                <span className="font-semibold text-slate-400">Topics covered:</span> {summary.topicsCovered.join(', ')}
                              </div>
                            )}
                            {summary.homework && (
                              <div className="mt-1 text-xs text-cyan-200">
                                <span className="font-semibold">Homework:</span> {summary.homework}
                              </div>
                            )}
                            {summary.announcements && (
                              <div className="mt-1 text-xs text-violet-200">
                                <span className="font-semibold">Announcements:</span> {summary.announcements}
                              </div>
                            )}
                            {summary.notes && (
                              <div className="mt-1 text-xs text-slate-400">
                                <span className="font-semibold">Notes:</span> {summary.notes}
                              </div>
                            )}
                            {summary.recordingUrl && (
                              <a
                                href={summary.recordingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-sm font-bold text-cyan-400"
                              >
                                <Download className="h-4 w-4" />
                                Watch Session Recording
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Members</div>
                <div className="mt-2 text-2xl font-bold text-white">{members.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Meetings</div>
                <div className="mt-2 text-2xl font-bold text-white">{meetingCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Materials</div>
                <div className="mt-2 text-2xl font-bold text-white">{materials.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Attendance</div>
                <div className="mt-2 text-2xl font-bold text-white">{attendanceRecords.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Summaries</div>
                <div className="mt-2 text-2xl font-bold text-white">{summaries.length}</div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" placeholder="Class name" />
                <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" placeholder="Subject" />
              </div>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none min-h-[120px]" placeholder="Description" />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">Save changes</button>
                <button type="button" onClick={handleArchiveClass} className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold text-slate-200">Archive class</button>
                <button type="button" onClick={handleDeleteClass} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200">Delete class</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
