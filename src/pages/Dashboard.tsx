import { useCallback, useEffect, useState, lazy, Suspense } from 'react'
import { useAuth, type UserRole } from '../context/AuthContext'

import Toast from '../components/ui/Toast'
import SettingsPage from '../pages/SettingsPage'
import type { ScheduledMeeting } from '../features/calendar/CalendarIntegration'
import type { MeetingRecord } from '../features/meeting/MeetingHistory'
import { NotificationBell, NotificationPanel } from '../components/ui/NotificationsSystem'
import { EmptyState, EmptyStateContainer, NoMeetingHistoryEmptyState } from '../components/feedback/EmptyStates'
import { CalendarDays, Download, FileText } from 'lucide-react'
import type {
  AcademicFacultyRoot,
  AcademicNavItem,
  AcademicSection,
  AcademicDepartment,
  StudentRecord,
} from '../components/layout/HierarchicalSidebar'

// Lazy-load heavier UI areas to improve initial bundle size and performance
const HierarchicalSidebar = lazy(() => import('../components/layout/HierarchicalSidebar'))
const FacultyStudentDashboard = lazy(() => import('../features/dashboard/FacultyStudentDashboard'))
const AcademicStructure = lazy(() => import('../features/teams/AcademicStructure'))
const MeetingRoom = lazy(() => import('../pages/MeetingRoom'))
const StudentSelectionModal = lazy(() => import('../features/teams/StudentSelectionModal'))
const CalendarIntegration = lazy(() => import('../features/calendar/CalendarIntegration'))
const MeetingHistory = lazy(() => import('../features/meeting/MeetingHistory'))

interface ToastItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface ActivityNotification {
  id: string
  title: string
  message: string
  timestamp: Date
}

interface StudentDoubtRequest {
  id: string
  topic: string
  preferredSlot: string
  requestedBy: string
  status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed'
  createdAt: Date
}



interface RolePermissions {
  canStartMeetingsForSection: boolean
  canInviteStudents: boolean
  canViewRecordings: boolean
  canViewSummaries: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  faculty: {
    canStartMeetingsForSection: true,
    canInviteStudents: true,
    canViewRecordings: true,
    canViewSummaries: true,
  },
  student: {
    canStartMeetingsForSection: false,
    canInviteStudents: false,
    canViewRecordings: true,
    canViewSummaries: true,
  },
}

// Mock academic structure data with detailed student information
const initialAcademicRoot: AcademicFacultyRoot = {
  id: 'CSE_FACULTY',
  name: 'Computer Science & Engineering',
  departments: [],
}

import {
  getAcademicStructure,
  saveAcademicStructure,
  subscribeToMeetings,
  saveMeetingRecord,
  createStudentRequest,
  startLiveMeeting,
  endLiveMeeting,
  subscribeToLiveMeetings,
  subscribeToDoubtRequests,
  updateDoubtRequestStatus,
  createScheduledMeeting,
  deleteScheduledMeeting,
  subscribeToScheduledMeetings,
  logActivity,
  subscribeToNotifications,
  createNotification,
  updateUserPresenceStatus,
  type LiveMeetingInvite
} from '../services/db'

export default function Dashboard() {
  const [academicRoot, setAcademicRoot] = useState<AcademicFacultyRoot>(initialAcademicRoot)

  const handleAcademicRootChange = useCallback(async (updatedDepts: AcademicDepartment[]) => {
    setAcademicRoot((prev) => ({ ...prev, departments: updatedDepts }))
    try {
      await saveAcademicStructure(updatedDepts)
    } catch (err) {
      console.error("Failed to save academic structure", err)
      // Assuming addToast is in scope below, but it's defined later. We'll just log for now.
    }
  }, [])

  // ==================== AUTHENTICATION ====================
  const { isAuthenticated, currentUser, logout } = useAuth()

  useEffect(() => {
    // Load academic structure
    const loadStructure = async () => {
      try {
        const structure = await getAcademicStructure();
        if (structure && structure.length > 0) {
          setAcademicRoot(prev => ({ ...prev, departments: structure }));
        }
      } catch (err) {
        console.error("Failed to load academic structure", err);
      }
    };
    loadStructure();

    // Subscribe to live meetings
    const unsubscribe = subscribeToMeetings((meetings) => {
      // Sort by newest first
      const sorted = meetings.sort((a, b) => b.date.getTime() - a.date.getTime());
      setMeetingHistory(sorted);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to doubt requests
  useEffect(() => {
    const unsubscribe = subscribeToDoubtRequests((requests) => {
      const sorted = requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setStudentDoubtRequests(sorted);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to scheduled meetings
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToScheduledMeetings((meetings) => {
      const parsed = meetings.map((m: any) => ({
        id: m.id,
        title: m.title,
        date: new Date(m.scheduledDate),
        duration: m.duration || 60,
        participants: m.participants || [],
        academicTarget: (m as any).academicTarget || undefined,
        recurring: (m as any).recurring || 'none',
        reminder: (m as any).reminder || 15,
        meetingLink: (m as any).meetingLink || undefined,
      } as ScheduledMeeting));

      // Filter based on role and invites
      const filtered = parsed.filter(m => {
        if (currentUser.role === 'faculty') {
          return (m as any).facultyId === currentUser.id || true; // Show all to faculty or filter by creator
        } else {
          // If it's targeted to a specific section/year/branch, check if the student belongs to it
          const target = (m as any).academicTarget;
          if (target) {
            // Check if student belongs to invited branch/year/section
            // Standard invite list check is safer:
            return m.participants.includes(currentUser.studentId || currentUser.id);
          }
          return m.participants.includes(currentUser.studentId || currentUser.id);
        }
      });
      setScheduledMeetings(filtered);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to real notifications from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeToNotifications(currentUser.id, (notifs) => {
      const parsed = notifs.map(n => ({
        id: n.id,
        title: n.title,
        message: n.description,
        timestamp: n.createdAt
      }));
      setActivityNotifications(parsed);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Track User Presence & Log logins
  useEffect(() => {
    if (!currentUser) return;
    updateUserPresenceStatus(currentUser.id, 'online').catch(e => console.error("Error setting presence", e));
    logActivity(currentUser.id, currentUser.name, 'User Login', `${currentUser.role} role`);

    const handleUnload = () => {
      updateUserPresenceStatus(currentUser.id, 'offline').catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      updateUserPresenceStatus(currentUser.id, 'offline').catch(() => {});
    };
  }, [currentUser]);

  // ==================== MEETING STATE ====================
  const [currentMeeting, setCurrentMeeting] = useState<{
    id: string
    title: string
    section: AcademicSection
    selectedStudents: StudentRecord[]
    startedAt: Date
    attendanceMap: Record<string, boolean>
  } | null>(null)
  const [meetingHistory, setMeetingHistory] = useState<MeetingRecord[]>([])
  const [scheduledMeetings, setScheduledMeetings] = useState<ScheduledMeeting[]>([])
  const [liveMeetingInvite, setLiveMeetingInvite] = useState<LiveMeetingInvite | null>(null)
  const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([])
  const [studentDoubtRequests, setStudentDoubtRequests] = useState<StudentDoubtRequest[]>([])
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)

  const [showStudentSelection, setShowStudentSelection] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AcademicSection | null>(null)
  const [postMeetingRecord, setPostMeetingRecord] = useState<MeetingRecord | null>(null)
  const [shareOptions, setShareOptions] = useState({
    includeRecording: true,
    includeSummary: true,
  })
  // ==================== NAV / LAYOUT ====================
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedNav, setSelectedNav] = useState<AcademicNavItem>('dashboard')

  useEffect(() => {
    if (currentUser?.role === 'student' && selectedNav === 'academic-structure') {
      setSelectedNav('dashboard')
    }
  }, [currentUser?.role, selectedNav])

  useEffect(() => {
    if (currentUser?.role === 'student' && selectedNav === 'meetings') {
      setSelectedNav('dashboard')
    }
  }, [currentUser?.role, selectedNav])

  // Subscribe to live invites from Firestore for students
  useEffect(() => {
    if (currentUser?.role !== 'student') return;

    const unsubscribe = subscribeToLiveMeetings((meetings) => {
      // Find if there's any meeting where this student is invited
      const invite = meetings.find(m => m.invitedStudents.includes(currentUser.studentId || currentUser.id));
      if (invite) {
        setLiveMeetingInvite(invite);
      } else {
        setLiveMeetingInvite(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ==================== TOASTS ====================
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }

  const addActivityNotification = (title: string, message: string) => {
    const id = `notif-${Date.now()}-${Math.random()}`
    setActivityNotifications((prev) => [{ id, title, message, timestamp: new Date() }, ...prev].slice(0, 30))
  }

  const permissions = currentUser ? ROLE_PERMISSIONS[currentUser.role] : ROLE_PERMISSIONS.student

  const getFirstAvailableSection = (): AcademicSection | null => {
    for (const department of academicRoot.departments) {
      if (department.branches && department.branches.length > 0) {
        for (const branch of department.branches) {
          if (branch.sections && branch.sections.length > 0) {
            const section = branch.sections[0]
            if (section.students && section.students.length > 0) {
              return section
            }
          }
        }
      }
    }
    return null
  }

  const handleStartMeetingForSection = (section: AcademicSection) => {
    if (!permissions.canStartMeetingsForSection) {
      addToast('Only faculty can start meetings for a section.', 'warning')
      return
    }

    // Show student selection modal
    setSelectedSection(section)
    setShowStudentSelection(true)
  }

  const handleStudentSelectionComplete = (selectedStudents: StudentRecord[], section: AcademicSection) => {
    const meetingId = `meeting-${Date.now()}`
    const meetingTitle = `${section.name} - ${section.subject || 'Class Meeting'}`
    const attendanceMap = selectedStudents.reduce<Record<string, boolean>>((acc, student) => {
      acc[student.id] = false
      return acc
    }, {})

    setCurrentMeeting({
      id: meetingId,
      title: meetingTitle,
      section,
      selectedStudents,
      startedAt: new Date(),
      attendanceMap,
    })

    setShowStudentSelection(false)
    setSelectedSection(null)

    addToast(`Meeting started with ${selectedStudents.length} students from ${section.name}`, 'success')
    addActivityNotification('Meeting Started', `${meetingTitle} with ${selectedStudents.length} students.`)

    // Broadcast live meeting to Firestore
    startLiveMeeting(meetingId, {
      id: meetingId,
      title: meetingTitle,
      sectionName: section.name,
      host: currentUser?.name || 'Host',
      invitedStudents: selectedStudents.map(s => s.id)
    }).catch(err => {
      console.error("Failed to broadcast live meeting:", err);
      addToast('Failed to notify students of meeting', 'error');
    });
  }

  const handleToggleAttendance = (studentId: string) => {
    setCurrentMeeting((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        attendanceMap: {
          ...prev.attendanceMap,
          [studentId]: !prev.attendanceMap[studentId],
        },
      }
    })
  }

  const handleEndMeeting = async () => {
    if (currentMeeting) {
      const durationMinutes = Math.max(1, Math.round((Date.now() - currentMeeting.startedAt.getTime()) / 60000))
      const attendanceReport = currentMeeting.selectedStudents.map((student) => ({
        name: student.name,
        status: currentMeeting.attendanceMap[student.id] ? 'Attended' as const : 'Absent' as const,
      }))
      const absentMembers = attendanceReport
        .filter((item) => item.status === 'Absent')
        .map((item) => item.name)
      const attendedCount = attendanceReport.filter((item) => item.status === 'Attended').length

      const record: Omit<MeetingRecord, 'id'> = {
        title: currentMeeting.title,
        date: currentMeeting.startedAt,
        duration: durationMinutes,
        participants: [currentUser?.name || 'Host', ...currentMeeting.selectedStudents.map((s) => s.name)],
        host: currentUser?.name || 'Host',
        recording: `https://example.edu/recordings/${currentMeeting.id}`,
        summary: `Meeting completed for ${currentMeeting.section.name}. Attendance: ${attendedCount}/${currentMeeting.selectedStudents.length} students attended.`,
        keyPoints: [
          `Section: ${currentMeeting.section.name}`,
          `Subject: ${currentMeeting.section.subject || 'General Meeting'}`,
          `Participants invited: ${currentMeeting.selectedStudents.length}`,
          `Students attended: ${attendedCount}`,
          `Students absent: ${absentMembers.length}`,
        ],
        attendanceReport,
        absentMembers,
        autoSharedWithAbsent: false,
      }

      try {
        const docId = await saveMeetingRecord(record)
        // Meeting history is handled by the subscription, but we update post meeting for the modal
        setPostMeetingRecord({ id: docId, ...record })
      } catch (err) {
        console.error("Failed to save meeting record:", err)
        addToast('Failed to save meeting record', 'error')
      }

      setShareOptions({ includeRecording: true, includeSummary: true })
      addToast(`Meeting "${currentMeeting.title}" has ended.`, 'info')
      addActivityNotification('Meeting Ended', `${currentMeeting.title} ended (${durationMinutes} min).`)

      // Delete the live meeting from Firestore
      endLiveMeeting(currentMeeting.id).catch(err => console.error("Failed to end live meeting broadcast:", err));

      setCurrentMeeting(null)
      setSelectedNav('recordings')
    }
  }

  const handleJoinLiveInvite = (meetingId: string) => {
    const invite = liveMeetingInvite && liveMeetingInvite.id === meetingId ? liveMeetingInvite : null
    if (!invite) return

    // Find the real section in the academic structure first
    let realSection: AcademicSection | undefined
    for (const dept of academicRoot.departments) {
      if (dept.branches) {
        for (const branch of dept.branches) {
          if (branch.sections) {
            const found = branch.sections.find(s => s.name === invite.sectionName)
            if (found) {
              realSection = found
              break
            }
          }
        }
      }
      if (realSection) break
    }

    const sectionToUse: AcademicSection = realSection || {
      id: 'dynamic-section',
      name: invite.sectionName,
      students: []
    }

    setCurrentMeeting({
      id: invite.id,
      title: invite.title,
      section: sectionToUse,
      selectedStudents: sectionToUse.students,
      startedAt: invite.startedAt,
      attendanceMap: {},
    })

    addToast('Joined live class', 'success')
  }

  const handleSendMeetingPackage = (target: 'absent' | 'all') => {
    if (!postMeetingRecord) return

    const recipients = target === 'absent'
      ? (postMeetingRecord.absentMembers || [])
      : (postMeetingRecord.attendanceReport || []).map((item) => item.name)

    if (recipients.length === 0) {
      addToast(target === 'absent' ? 'No absent students to send the package.' : 'No recipients found.', 'warning')
      return
    }

    const payloadParts: string[] = []
    if (shareOptions.includeRecording) payloadParts.push('recording')
    if (shareOptions.includeSummary) payloadParts.push('summary')

    if (payloadParts.length === 0) {
      addToast('Select at least one item to send.', 'warning')
      return
    }

    addToast(
      `Sent ${payloadParts.join(', ')} to ${recipients.length} ${target === 'absent' ? 'absent student(s)' : 'student(s)'}.`,
      'success',
    )
    addActivityNotification(
      'Meeting Package Sent',
      `${postMeetingRecord.title}: sent ${payloadParts.join(', ')} to ${target === 'absent' ? 'absent students' : 'all students'}.`,
    )

    if (target === 'absent') {
      setMeetingHistory((prev) =>
        prev.map((meeting) =>
          meeting.id === postMeetingRecord.id
            ? { ...meeting, autoSharedWithAbsent: true }
            : meeting,
        ),
      )
      setPostMeetingRecord((prev) => (prev ? { ...prev, autoSharedWithAbsent: true } : prev))
    }
  }

  const handleScheduleMeeting = async (meeting: Omit<ScheduledMeeting, 'id'>) => {
    try {
      const payload = {
        title: meeting.title,
        scheduledDate: meeting.date.toISOString(),
        duration: meeting.duration,
        participants: meeting.participants,
        academicTarget: meeting.academicTarget || null,
        recurring: meeting.recurring,
        reminder: meeting.reminder,
        meetingLink: meeting.meetingLink || '',
        facultyId: currentUser?.id || 'Unknown',
        facultyName: currentUser?.name || 'Faculty',
        status: 'scheduled' as const,
      };

      await createScheduledMeeting(payload as any);
      addToast('Meeting scheduled successfully.', 'success');

      logActivity(currentUser!.id, currentUser!.name, 'Meeting Scheduled', meeting.title);
      await createNotification({
        userId: 'all',
        title: 'Class Scheduled',
        description: `"${meeting.title}" is scheduled for ${meeting.date.toLocaleString()}`,
        type: 'info',
        priority: 'medium',
      });
    } catch (err) {
      console.error("Failed to schedule meeting:", err);
      addToast('Failed to schedule meeting.', 'error');
    }
  }

  const handleDeleteScheduledMeeting = async (id: string) => {
    try {
      await deleteScheduledMeeting(id);
      addToast('Scheduled meeting deleted', 'info');
      logActivity(currentUser!.id, currentUser!.name, 'Meeting Cancelled', id);
    } catch (err) {
      console.error("Failed to delete scheduled meeting:", err);
      addToast('Failed to delete scheduled meeting.', 'error');
    }
  }

  const handlePlayRecording = (recordingUrl: string) => {
    window.open(recordingUrl, '_blank', 'noopener,noreferrer')
    addToast('Opening recording in a new tab.', 'info')
  }

  const handleDownloadSummary = (meeting: MeetingRecord) => {
    const summaryText = [
      `Meeting: ${meeting.title}`,
      `Date: ${meeting.date.toLocaleString()}`,
      `Host: ${meeting.host}`,
      `Duration: ${meeting.duration} minutes`,
      '',
      meeting.summary || 'No summary available.',
      '',
      ...(meeting.keyPoints?.length ? ['Key Points:', ...meeting.keyPoints.map((point) => `- ${point}`)] : []),
    ].join('\n')

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Summary downloaded', 'success')
  }

  const handleQuickStartMeeting = () => {
    // Use the first section available (CSE Section A) for quick start
    const defaultSection = getFirstAvailableSection()
    if (defaultSection) {
      handleStartMeetingForSection(defaultSection)
    } else {
      addToast('No sections available to start a meeting', 'warning')
    }
  }

  const handleLogout = async () => {
    await logout()
    setSelectedNav('dashboard')
    setShowNotificationPanel(false)
  }

  if (!isAuthenticated || !currentUser) {
    return null; // The router/ProtectedRoute should handle redirecting to /login
  }

  // If in a meeting, show meeting room
  if (currentMeeting) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading meeting…</div>}>
        <MeetingRoom
          meetingId={currentMeeting.id}
          meetingTitle={currentMeeting.title}
          participants={[]}
          selectedStudents={currentMeeting.selectedStudents}
          currentUser={{
            id: currentUser!.id,
            name: currentUser!.name,
            email: currentUser!.email,
            role: currentUser!.role,
          }}
          attendanceMap={currentMeeting.attendanceMap}
          onToggleAttendance={handleToggleAttendance}
          onEndMeeting={handleEndMeeting}
          onInviteParticipants={() => addToast('Invite panel opened', 'info')}
        />
      </Suspense>
    )
  }

  // Calculate total students and branches from academicRoot structure dynamically
  let totalStudents = 0
  let totalBranches = 0
  if (academicRoot && academicRoot.departments) {
    academicRoot.departments.forEach(dept => {
      if (dept.branches) {
        totalBranches += dept.branches.length
        dept.branches.forEach(branch => {
          if (branch.sections) {
            branch.sections.forEach(sec => {
              if (sec.students) {
                totalStudents += sec.students.length
              }
            })
          }
        })
      }
    })
  }

  const recentMeetingPreview = meetingHistory.slice(0, 3)
  const now = new Date()
  const studentUpcomingMeetings = scheduledMeetings
    .filter((meeting) => meeting.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const studentAttendanceHistory = meetingHistory
    .map((meeting) => {
      const reportStatus = meeting.attendanceReport?.find((entry) => entry.name === currentUser?.name)?.status
      if (reportStatus) {
        return { meeting, status: reportStatus }
      }

      if (meeting.participants.includes(currentUser?.name || '')) {
        return { meeting, status: 'Attended' as const }
      }

      return null
    })
    .filter((item): item is { meeting: MeetingRecord; status: 'Attended' | 'Absent' } => item !== null)
    .slice(0, 6)

  const studentSharedResourcesRaw = meetingHistory
    .filter((meeting) => Boolean(meeting.recording || meeting.summary))
    .slice(0, 8)

  const studentSharedResources = studentSharedResourcesRaw

  const getResourceSubject = (title: string) => {
    const [prefix] = title.split('-')
    return prefix?.trim() || 'General'
  }

  const handleRequestDoubtSession = async (payload: { topic: string; message: string; preferredSlot: string }) => {
    try {
      const docId = await createStudentRequest(
        payload.topic,
        payload.preferredSlot,
        currentUser?.id || 'Unknown',
        currentUser?.name || 'Student'
      )

      setStudentDoubtRequests((prev) => [
        {
          id: docId,
          topic: payload.topic,
          preferredSlot: payload.preferredSlot,
          requestedBy: currentUser?.name || 'Student',
          status: 'Sent',
          createdAt: new Date(),
        },
        ...prev,
      ])
      addToast('Doubt session request sent to faculty.', 'success')
      addActivityNotification('Doubt Session Requested', `${payload.topic} · ${payload.preferredSlot}`)
    } catch (err) {
      console.error("Failed to submit request", err)
      addToast('Failed to submit doubt request.', 'error')
    }
  }

  const handleUpdateDoubtRequestStatus = (
    requestId: string,
    status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed',
  ) => {
    let targetTopic = ''
    let requester = ''

    setStudentDoubtRequests((prev) => {
      const found = prev.find((request) => request.id === requestId)
      targetTopic = found?.topic || ''
      requester = found?.requestedBy || ''
      return prev.map((request) => (
        request.id === requestId ? { ...request, status } : request
      ))
    })

    updateDoubtRequestStatus(requestId, status).catch(err => {
      console.error("Failed to update doubt request status in Firestore:", err);
      addToast('Failed to sync status update to server.', 'error');
    });

    const label = targetTopic || 'Doubt request'
    const statusMessage = status === 'Accepted'
      ? `${label} accepted.`
      : status === 'Rescheduled'
        ? `${label} marked for a new time.`
        : `${label} updated to ${status}.`

    addToast(statusMessage, 'success')
    addActivityNotification('Doubt Request Updated', `${label} · ${status}${requester ? ` · ${requester}` : ''}`)

    // Notify faculty when a student responds to a request
    if (currentUser?.role === 'student' && (status === 'Accepted' || status === 'Rescheduled')) {
      addActivityNotification(
        'Student responded to request',
        `${currentUser.name} ${status === 'Accepted' ? 'accepted' : 'requested changes for'} "${label}".`,
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-40 w-11 h-11 rounded-xl glass border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      <Suspense fallback={null}>
        <HierarchicalSidebar
          isOpen={sidebarOpen}
          selected={selectedNav}
          onSelect={setSelectedNav}
          userRole={currentUser?.role || 'student'}
        />
      </Suspense>

      <main
        className="min-h-screen"
        role="main"
        aria-label="Main content"
        style={{ marginLeft: sidebarOpen ? '320px' : '0px', transition: 'margin-left 0.22s ease-in-out' }}
      >
        <div className="p-6 md:p-10 pt-16">
          <div className="max-w-7xl mx-auto">
            {selectedNav === 'dashboard' && (
              <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
                <FacultyStudentDashboard
                  role={currentUser?.role === 'faculty' ? 'faculty' : 'student'}
                  totalStudentsCount={totalStudents}
                  totalMeetingsCount={meetingHistory.length}
                  totalRecordingsCount={meetingHistory.filter(m => m.recording).length}
                  onQuickStartMeeting={handleQuickStartMeeting}
                  onNavigate={(nav) => setSelectedNav(nav as AcademicNavItem)}
                  upcomingMeetings={studentUpcomingMeetings.map((meeting) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                  }))}
                  attendanceHistory={studentAttendanceHistory.map(({ meeting, status }) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                    status,
                  }))}
                  notifications={activityNotifications.map((notification) => ({
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                  }))}
                  sharedResources={studentSharedResources.map((meeting) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                    hasRecording: Boolean(meeting.recording),
                    hasSummary: Boolean(meeting.summary || meeting.keyPoints?.length),
                    subject: getResourceSubject(meeting.title),
                    recordingUrl: meeting.recording || undefined,
                    downloadUrl: meeting.recording || undefined,
                    fileSizeLabel: meeting.recording ? 'MP4' : undefined,
                    slidesUrl: typeof meeting.summary === 'string' && meeting.summary.startsWith('http') ? meeting.summary : undefined,
                    summaryText: meeting.summary || (meeting.keyPoints ? meeting.keyPoints.join(' · ') : undefined),
                    summaryUrl: typeof meeting.summary === 'string' && meeting.summary.startsWith('http') ? meeting.summary : undefined,
                  }))}
                  liveInvite={liveMeetingInvite || undefined}
                  onJoinLiveMeeting={handleJoinLiveInvite}
                  doubtRequests={studentDoubtRequests.map((request) => ({
                    id: request.id,
                    topic: request.topic,
                    preferredSlot: request.preferredSlot,
                    requestedBy: request.requestedBy,
                    status: request.status,
                    requestedAtLabel: request.createdAt.toLocaleString(),
                  }))}
                  onUpdateDoubtRequestStatus={handleUpdateDoubtRequestStatus}
                  onRequestDoubtSession={handleRequestDoubtSession}
                />
              </Suspense>
            )}

            {selectedNav === 'academic-structure' && currentUser?.role === 'faculty' && (
              <Suspense fallback={<div className="p-6">Loading structure…</div>}>
                <AcademicStructure
                  facultyRoot={academicRoot}
                  facultyProfile={currentUser?.facultyProfile as import('../features/teams/AcademicStructure').FacultyProfile | undefined}
                  role={currentUser?.role === 'faculty' ? 'faculty' : 'student'}
                  studentUpcomingMeetings={studentUpcomingMeetings.map((meeting) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                  }))}
                  studentAttendanceHistory={studentAttendanceHistory.map(({ meeting, status }) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                    status,
                  }))}
                  studentNotifications={activityNotifications.map((notification) => ({
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                  }))}
                  studentSharedResources={studentSharedResources.map((meeting) => ({
                    id: meeting.id,
                    title: meeting.title,
                    date: meeting.date,
                    recording: meeting.recording,
                    summary: meeting.summary,
                  }))}
                  onOpenRecording={handlePlayRecording}
                  onDownloadResourceSummary={(meetingId) => {
                    const meeting = meetingHistory.find((item) => item.id === meetingId)
                    if (!meeting) return
                    handleDownloadSummary(meeting)
                  }}
                  onStartMeetingForSection={handleStartMeetingForSection}
                  onInviteStudentToMeeting={(student: StudentRecord) => addToast(`Invited ${student.name} to a meeting.`, 'success')}
                  onSendMessageToStudent={(student: StudentRecord) => addToast(`Message sent to ${student.name}.`, 'success')}
                  onViewStudentProfile={(student: StudentRecord) => addToast(`Viewing profile: ${student.name} (${student.id})`, 'info')}
                  onAcademicRootChange={handleAcademicRootChange}
                />
              </Suspense>
            )}

            {selectedNav === 'meetings' && currentUser?.role === 'faculty' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold mb-4">Meetings & Video Calls</div>
                <div className="space-y-4">
                  {currentUser?.role === 'faculty' && (
                    <>
                      <Suspense fallback={<div className="p-4">Loading calendar…</div>}>
                        <CalendarIntegration
                          meetings={scheduledMeetings}
                          onSchedule={handleScheduleMeeting}
                          onEdit={() => { }}
                          onDelete={handleDeleteScheduledMeeting}
                          onToast={addToast}
                        />
                      </Suspense>
                    </>
                  )}

                  {currentUser?.role === 'faculty' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5 flex items-center justify-between mb-4 mt-2">
                      <div>
                        <h3 className="text-blue-200 font-medium text-lg">Ready to start a live class?</h3>
                        <p className="text-blue-200/70 text-sm mt-1">
                          Navigate to the Academic Structure to view your sections, manage students, and launch an interactive meeting.
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedNav('academic-structure')}
                        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap ml-4"
                      >
                        Go to Academic Structure
                      </button>
                    </div>
                  )}

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10 mt-2">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-slate-200 font-medium">Recent Meetings</h3>
                        <p className="text-xs text-slate-500 mt-1">Quick access to your latest sessions and recordings.</p>
                      </div>
                      <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">
                        <CalendarDays className="w-3.5 h-3.5" />
                        Live activity
                      </div>
                    </div>

                    {recentMeetingPreview.length === 0 ? (
                      <EmptyState
                        message="No recent meetings yet"
                        subMessage={currentUser?.role === 'faculty'
                          ? 'Your completed sessions and recordings will appear here.'
                          : 'Your recent sessions will appear here.'}
                        action={currentUser?.role === 'faculty'
                          ? { label: 'Go to Academic Structure', onClick: () => setSelectedNav('academic-structure') }
                          : undefined}
                      />
                    ) : (
                      <div className="space-y-2">
                        {recentMeetingPreview.map((meeting) => (
                          <div key={meeting.id} className="rounded-xl border border-white/10 bg-slate-900/35 px-4 py-3">
                            <div className="text-sm font-medium text-white">{meeting.title}</div>
                            <div className="text-xs text-slate-400 mt-1">{meeting.duration} min · {meeting.participants.length} participants</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedNav === 'recordings' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold">Recordings</div>
                <div className="text-slate-400 text-sm mt-1 mb-6">Meeting recordings and summaries appear below.</div>
                {currentUser?.role === 'student' && (
                  <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex items-center gap-2 text-cyan-200 font-medium mb-2">
                      <Download className="w-4 h-4" /> Shared Resources
                    </div>
                    {studentSharedResources.length === 0 ? (
                      <p className="text-xs text-cyan-100/70">No shared recordings/resources yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-auto pr-1">
                        {studentSharedResources.map((meeting) => (
                          <div key={meeting.id} className="rounded-md border border-white/10 bg-slate-900/45 px-3 py-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm text-slate-100 truncate">{meeting.title}</p>
                              <p className="text-[11px] text-slate-400">{meeting.date.toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {meeting.recording && (
                                <button
                                  onClick={() => handlePlayRecording(meeting.recording!)}
                                  className="px-2 py-1 text-[11px] rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200"
                                >
                                  Open
                                </button>
                              )}
                              {(meeting.summary || meeting.keyPoints?.length) && (
                                <button
                                  onClick={() => handleDownloadSummary(meeting)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                                >
                                  <FileText className="w-3 h-3" /> Summary
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {meetingHistory.length === 0 ? (
                  <EmptyStateContainer>
                    <NoMeetingHistoryEmptyState />
                  </EmptyStateContainer>
                ) : (
                  <Suspense fallback={<div className="p-4">Loading history…</div>}>
                    <MeetingHistory meetings={meetingHistory} onPlayRecording={handlePlayRecording} />
                  </Suspense>
                )}
              </div>
            )}

            {selectedNav === 'settings' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors font-medium"
                  >
                    Logout
                  </button>
                </div>
                <SettingsPage onBack={() => setSelectedNav('dashboard')} />
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      <div className="fixed top-4 right-6 z-50 flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/20 transition-colors text-sm font-medium"
        >
          Logout
        </button>
        <NotificationBell
          unreadCount={activityNotifications.length}
          onBellClick={() => setShowNotificationPanel(true)}
        />
      </div>

      <NotificationPanel
        isOpen={showNotificationPanel}
        notifications={activityNotifications}
        onClose={() => setShowNotificationPanel(false)}
        onClear={() => setActivityNotifications([])}
      />

      {/* Student Selection Modal */}
      {showStudentSelection && selectedSection && (
        <Suspense fallback={<div className="fixed inset-0 z-[60] flex items-center justify-center">Loading…</div>}>
          <StudentSelectionModal
            isOpen={showStudentSelection}
            onClose={() => {
              setShowStudentSelection(false)
              setSelectedSection(null)
            }}
            section={selectedSection}
            onStartMeeting={handleStudentSelectionComplete}
          />
        </Suspense>
      )}

      {postMeetingRecord && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl glass rounded-2xl border border-white/10 p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Meeting Follow-up</h3>
                <p className="text-slate-400 text-sm mt-1">Review absentees and send recording/summary.</p>
              </div>
              <button
                onClick={() => setPostMeetingRecord(null)}
                className="px-3 py-1 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-sm"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-800/40 border border-white/10 rounded-lg p-4 mb-4">
              <div className="text-sm text-slate-300 mb-2">
                Absentees ({postMeetingRecord.absentMembers?.length || 0})
              </div>
              {postMeetingRecord.absentMembers && postMeetingRecord.absentMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {postMeetingRecord.absentMembers.map((member) => (
                    <span key={member} className="px-2 py-1 rounded-md bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                      {member}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-emerald-300 text-sm">Everyone attended this meeting.</div>
              )}
            </div>

            <div className="space-y-2 mb-5">
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={shareOptions.includeRecording}
                  onChange={(e) => setShareOptions((prev) => ({ ...prev, includeRecording: e.target.checked }))}
                />
                Include recording link
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={shareOptions.includeSummary}
                  onChange={(e) => setShareOptions((prev) => ({ ...prev, includeSummary: e.target.checked }))}
                />
                Include meeting summary
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSendMeetingPackage('absent')}
                className="flex-1 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30"
              >
                Send to Absentees
              </button>
              <button
                onClick={() => handleSendMeetingPackage('all')}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30"
              >
                Send to All Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

