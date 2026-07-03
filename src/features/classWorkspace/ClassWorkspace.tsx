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
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  Mic,
  Plus,
  Settings,
  Trash2,
  Users,
  Video,
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
  type LiveMeetingInvite,
  type MeetingAttendance,
  type MeetingSummary,
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
  const [liveMeeting, setLiveMeeting] = useState<LiveMeetingInvite | null>(null)
  const [scheduleForm, setScheduleForm] = useState(emptyMeetingForm)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialFileName, setMaterialFileName] = useState('')
  const [materialFileUrl, setMaterialFileUrl] = useState('')
  const [editClassName, setEditClassName] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
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
      unsubScheduled()
      unsubLive()
    }
  }, [classId, classRecord?.name])

  const recordingMeetings = useMemo(
    () => meetings.filter((meeting) => Boolean((meeting.recordingUrl || (meeting as any).recording) && (meeting.recordingUrl || (meeting as any).recording) !== '#')),
    [meetings],
  )

  const meetingCount = meetings.length + scheduledMeetings.length

  const copyInvite = async () => {
    if (!classRecord?.inviteLink) return
    await navigator.clipboard.writeText(classRecord.inviteLink)
    setCopied(true)
    addToast('Invite link copied to clipboard.', 'info')
    window.setTimeout(() => setCopied(false), 1800)
  }

  const startClassSession = async () => {
    if (!classId || !classRecord) return

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
    if (!classId || !materialTitle.trim() || !materialFileName.trim()) {
      addToast('Add a title and file name for the material.', 'warning')
      return
    }

    await uploadClassMaterial(
      classId,
      materialTitle.trim(),
      materialFileName.trim(),
      materialFileUrl.trim() || '#',
      'Uploaded in workspace',
      currentUser?.name || 'Faculty',
    )

    setMaterialTitle('')
    setMaterialFileName('')
    setMaterialFileUrl('')
    addToast('Material uploaded successfully.', 'success')
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
              <button
                type="button"
                onClick={copyInvite}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left transition hover:border-cyan-400/30"
              >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                <LinkIcon className="h-3.5 w-3.5" />
                Invite link
              </div>
              <div className="mt-2 text-sm font-semibold text-white break-all">{classRecord.inviteLink || 'Not configured'}</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300">
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy class invite'}
                </div>
            </button>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Class code</div>
              <div className="mt-2 text-2xl font-black text-cyan-300">{classRecord.classCode || 'N/A'}</div>
              <div className="mt-2 text-xs text-slate-500">{classRecord.facultyName || 'Faculty'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Members</div>
            <div className="mt-2 text-2xl font-bold text-white">{members.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Meetings</div>
            <div className="mt-2 text-2xl font-bold text-white">{meetingCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Materials</div>
            <div className="mt-2 text-2xl font-bold text-white">{materials.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Recordings</div>
            <div className="mt-2 text-2xl font-bold text-white">{recordingMeetings.length}</div>
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

          {classRecord.inviteLink && (
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join my class "${classRecord.name}" on Video Pro using link: ${classRecord.inviteLink} or Class Code: ${classRecord.classCode || ''}`)}`}
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
            <div className="space-y-3">
              {attendanceRecords.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                  Attendance has not been captured yet.
                </div>
              ) : (
                attendanceRecords.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-white font-semibold">{entry.studentName}</div>
                      <div className="mt-1 text-sm text-slate-400">Meeting: {entry.meetingId}</div>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${entry.status === 'Present' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : entry.status === 'Late' ? 'border-amber-400/20 bg-amber-500/10 text-amber-300' : 'border-rose-400/20 bg-rose-500/10 text-rose-300'}`}>
                      {entry.status}
                    </span>
                  </div>
                ))
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
                  <input value={materialFileName} onChange={(e) => setMaterialFileName(e.target.value)} placeholder="File name" className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" />
                  <input value={materialFileUrl} onChange={(e) => setMaterialFileUrl(e.target.value)} placeholder="Optional file URL" className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none" />
                  <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">
                    <Plus className="h-4 w-4" />
                    Upload
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
                      <div>
                        <div className="text-white font-semibold">{material.title}</div>
                        <div className="mt-1 text-sm text-slate-400">{material.fileName || 'Resource file'}</div>
                      </div>
                      {material.fileUrl ? (
                        <a href={material.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white">
                          <Download className="h-4 w-4" />
                          Open
                        </a>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'recordings' && (
            <div className="space-y-3">
              {recordingMeetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                  No recordings available yet.
                </div>
              ) : (
                recordingMeetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-white font-semibold">{meeting.title}</div>
                      <div className="mt-1 text-sm text-slate-400">{meeting.description || 'Recorded class session'}</div>
                    </div>
                    <a href={meeting.recordingUrl || (meeting as any).recording} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950">
                      <Download className="h-4 w-4" />
                      Watch
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'summaries' && (
            <div className="space-y-3">
              {summaries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-500">
                  No meeting summaries yet.
                </div>
              ) : (
                summaries.map((summary) => (
                  <div key={summary.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 md:p-5">
                    <div className="text-white font-semibold">{summary.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{summary.summary}</div>
                    <div className="mt-2 text-xs text-slate-500">
                      {summary.topicsCovered?.length ? `Topics: ${summary.topicsCovered.join(', ')}` : 'Topics not recorded yet'}
                    </div>
                    {summary.homework && <div className="mt-2 text-sm text-cyan-200">Homework: {summary.homework}</div>}
                    {summary.announcements && <div className="mt-2 text-sm text-violet-200">Announcements: {summary.announcements}</div>}
                    {summary.recordingLink && (
                      <a href={summary.recordingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white">
                        <Download className="h-4 w-4" />
                        Recording link
                      </a>
                    )}
                  </div>
                ))
              )}
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
