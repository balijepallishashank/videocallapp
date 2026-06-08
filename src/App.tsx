import { useEffect, useState } from 'react'
import LoginPage, { type FacultyRegistrationDetails } from './components/LoginPage'
import type { UserRole } from './components/LoginPage'
import Toast from './components/Toast'
import SettingsPage from './components/SettingsPage'
import CalendarIntegration, { type ScheduledMeeting } from './components/CalendarIntegration'
import MeetingHistory, { type MeetingRecord } from './components/MeetingHistory'
import { NotificationBell, NotificationPanel } from './components/NotificationsSystem'
import { EmptyState, EmptyStateContainer, NoMeetingHistoryEmptyState } from './components/EmptyStates'
import { CalendarDays, Download, FileText } from 'lucide-react'
import HierarchicalSidebar, { 
  type AcademicNavItem,
  type AcademicFacultyRoot,
  type AcademicSection,
  type StudentRecord,
} from './components/HierarchicalSidebar.tsx'
import type { FacultyProfile } from './components/AcademicStructure.tsx'
import FacultyStudentDashboard from './components/FacultyStudentDashboard'
import AcademicStructure from './components/AcademicStructure.tsx'
import MeetingRoom from './components/MeetingRoom'
import StudentSelectionModal from './components/StudentSelectionModal'

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

interface UserProfile {
  id: string
  email: string
  name: string
  avatar: string
  role: UserRole
  facultyProfile?: FacultyProfile
  studentId?: string
}

interface AuthResult {
  success: boolean
  message?: string
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
  departments: [
    {
      id: 'cse_dept',
      name: 'Computer Science & Engineering',
      branches: [
        {
          id: 'cse_branch',
          name: 'Computer Science',
          sections: [
            {
              id: 'cse_section_a',
              name: 'CSE Section A (Semester 3)',
              subject: 'Data Structures & Algorithms',
              faculty: 'Prof. Anita Sharma',
              students: [
                {
                  id: 'CSE21001',
                  name: 'Aarav Patel',
                  email: 'aarav.patel@student.edu',
                  attendancePct: 85,
                  status: 'Active',
                  phone: '+91-9876543001',
                  semester: 3,
                },
                {
                  id: 'CSE21002',
                  name: 'Priya Sharma',
                  email: 'priya.sharma@student.edu',
                  attendancePct: 92,
                  status: 'Active',
                  phone: '+91-9876543002',
                  semester: 3,
                },
                {
                  id: 'CSE21003',
                  name: 'Rahul Gupta',
                  email: 'rahul.gupta@student.edu',
                  attendancePct: 78,
                  status: 'At Risk',
                  phone: '+91-9876543003',
                  semester: 3,
                },
                {
                  id: 'CSE21004',
                  name: 'Sneha Reddy',
                  email: 'sneha.reddy@student.edu',
                  attendancePct: 94,
                  status: 'Active',
                  phone: '+91-9876543004',
                  semester: 3,
                },
              ],
            },
            {
              id: 'cse_section_b',
              name: 'CSE Section B (Semester 3)',
              subject: 'Operating Systems',
              faculty: 'Dr. Vikram Singh',
              students: [
                {
                  id: 'CSE21005',
                  name: 'Amit Kumar',
                  email: 'amit.kumar@student.edu',
                  attendancePct: 88,
                  status: 'Active',
                  phone: '+91-9876543005',
                  semester: 3,
                },
                {
                  id: 'CSE21006',
                  name: 'Kavya Nair',
                  email: 'kavya.nair@student.edu',
                  attendancePct: 72,
                  status: 'At Risk',
                  phone: '+91-9876543006',
                  semester: 3,
                },
              ],
            },
          ],
        },
        {
          id: 'it_branch',
          name: 'Information Technology',
          sections: [
            {
              id: 'it_section_a',
              name: 'IT Section A (Semester 2)',
              subject: 'Programming Fundamentals',
              faculty: 'Dr. Sarah Wilson',
              students: [
                {
                  id: 'IT22001',
                  name: 'Arjun Das',
                  email: 'arjun.das@student.edu',
                  attendancePct: 90,
                  status: 'Active',
                  phone: '+91-9876543007',
                  semester: 2,
                },
                {
                  id: 'IT22002',
                  name: 'Meera Singh',
                  email: 'meera.singh@student.edu',
                  attendancePct: 86,
                  status: 'Active',
                  phone: '+91-9876543008',
                  semester: 2,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ece_dept',
      name: 'Electronics & Communication Engineering',
      branches: [
        {
          id: 'ece_branch',
          name: 'Electronics & Communication',
          sections: [
            {
              id: 'ece_section_a',
              name: 'ECE Section A (Semester 4)',
              subject: 'Digital Electronics',
              faculty: 'Prof. Rajesh Kumar',
              students: [
                {
                  id: 'ECE20001',
                  name: 'Karan Mehta',
                  email: 'karan.mehta@student.edu',
                  attendancePct: 82,
                  status: 'Active',
                  phone: '+91-9876543009',
                  semester: 4,
                },
                {
                  id: 'ECE20002',
                  name: 'Pooja Verma',
                  email: 'pooja.verma@student.edu',
                  attendancePct: 95,
                  status: 'Active',
                  phone: '+91-9876543010',
                  semester: 4,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function App() {
  const [academicRoot, setAcademicRoot] = useState<AcademicFacultyRoot>(initialAcademicRoot)

  // ==================== AUTHENTICATION ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [facultyDirectory, setFacultyDirectory] = useState<Record<string, FacultyProfile>>({})

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
  const [liveMeetingInvite, setLiveMeetingInvite] = useState<{ id: string; title: string; sectionName: string; host: string; startedAt: Date } | null>(null)
  const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([])
  const [studentDoubtRequests, setStudentDoubtRequests] = useState<StudentDoubtRequest[]>([
    {
      id: 'dr-1',
      topic: 'Data Structures',
      preferredSlot: 'Today 5:30 PM',
      requestedBy: 'Aarav Patel',
      status: 'Sent',
      createdAt: new Date(Date.now() - 1000 * 60 * 90),
    },
    {
      id: 'dr-2',
      topic: 'Operating Systems',
      preferredSlot: 'Tomorrow 10:00 AM',
      requestedBy: 'Priya Sharma',
      status: 'Accepted',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: 'dr-3',
      topic: 'DBMS Lab',
      preferredSlot: 'Friday 2:00 PM',
      requestedBy: 'Rahul Gupta',
      status: 'Rescheduled',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40),
    },
    {
      id: 'dr-4',
      topic: 'Computer Networks',
      preferredSlot: 'Completed session',
      requestedBy: 'Sneha Reddy',
      status: 'Completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ])
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  
  const [showStudentSelection, setShowStudentSelection] = useState(false)
  const [selectedSection, setSelectedSection] = useState<AcademicSection | null>(null)
  const [postMeetingRecord, setPostMeetingRecord] = useState<MeetingRecord | null>(null)
  const [shareOptions, setShareOptions] = useState({
    includeRecording: true,
    includeSummary: true,
  })
  const persistLiveInvite = (invite: { id: string; title: string; sectionName: string; host: string; startedAt: Date }) => {
    setLiveMeetingInvite(invite)
    try {
      localStorage.setItem('liveMeetingInvite', JSON.stringify({ ...invite, startedAt: invite.startedAt.toISOString() }))
    } catch {
      // ignore storage errors
    }
  }

  const clearLiveInvite = () => {
    setLiveMeetingInvite(null)
    try {
      localStorage.removeItem('liveMeetingInvite')
    } catch {
      // ignore storage errors
    }
  }

  const handleLogin = (
    creds:
      | { role: 'faculty'; email: string; password: string }
      | { role: 'student'; studentId: string; email: string; password: string },
  ): AuthResult => {
    const normalizedEmail = creds.email.trim().toLowerCase()
    const normalizedPassword = creds.password.trim()

    if (normalizedPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' }
    }

    if (creds.role === 'faculty') {
      const emailPrefix = normalizedEmail.split('@')[0] || 'faculty'
      const formattedName = emailPrefix
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')

      const faculty = facultyDirectory[normalizedEmail] || {
        facultyId: normalizedEmail === 'faculty@demo.com' ? 'DEMO_FAC_001' : `FAC-${Date.now().toString().slice(-5)}`,
        name: formattedName || 'Faculty User',
        email: normalizedEmail,
        department: 'Computer Science & Engineering',
        phone: '+91-9999999999',
        designation: 'Professor',
      }

      if (!facultyDirectory[normalizedEmail]) {
        setFacultyDirectory((prev) => ({ ...prev, [normalizedEmail]: faculty }))
      }

      const user: UserProfile = {
        id: 'faculty-' + Date.now(),
        email: normalizedEmail,
        name: faculty.name,
        avatar: '👩‍🏫',
        role: 'faculty',
        facultyProfile: faculty,
      }

      setCurrentUser(user)
      setIsAuthenticated(true)
      return { success: true }
    }

    const studentNameSeed = normalizedEmail.split('@')[0] || 'student'
    const studentName = studentNameSeed
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    const user: UserProfile = {
      id: 'student-' + Date.now(),
      email: normalizedEmail,
      name: studentName || 'Student User',
      avatar: '🎓',
      role: 'student',
      studentId: creds.studentId.trim() || 'STU001',
    }
    setCurrentUser(user)
    setIsAuthenticated(true)
    return { success: true }
  }

  const handleRegisterFaculty = (details: FacultyRegistrationDetails): AuthResult => {
    const profile: FacultyProfile = {
      facultyId: details.facultyId.trim(),
      name: details.facultyName.trim(),
      email: details.facultyEmail.trim(),
      department: details.facultyDepartment.trim(),
      phone: details.phoneNumber.trim(),
      designation: details.designation.trim(),
    }

    setFacultyDirectory((prev) => ({ ...prev, [details.facultyEmail]: profile }))

    // Auto-login after registration
    setCurrentUser({
      id: 'faculty-' + Date.now(),
      email: details.facultyEmail,
      name: profile.name,
      avatar: '👩‍🏫',
      role: 'faculty',
      facultyProfile: profile,
    })
    setIsAuthenticated(true)
    return { success: true }
  }

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

  // Restore any pending live invite (for students) from localStorage on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('liveMeetingInvite')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id && parsed?.title && parsed?.sectionName && parsed?.host && parsed?.startedAt) {
          setLiveMeetingInvite({
            id: parsed.id,
            title: parsed.title,
            sectionName: parsed.sectionName,
            host: parsed.host,
            startedAt: new Date(parsed.startedAt),
          })
        }
      }
    } catch {
      // ignore malformed data
    }
  }, [])

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

    persistLiveInvite({
      id: meetingId,
      title: meetingTitle,
      sectionName: section.name,
      host: currentUser?.name || 'Host',
      startedAt: new Date(),
    })
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

  const handleEndMeeting = () => {
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

      const record: MeetingRecord = {
        id: currentMeeting.id,
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

      setMeetingHistory((prev) => [record, ...prev])
      setPostMeetingRecord(record)
      setShareOptions({ includeRecording: true, includeSummary: true })
      addToast(`Meeting "${currentMeeting.title}" has ended.`, 'info')
      addActivityNotification('Meeting Ended', `${currentMeeting.title} ended (${durationMinutes} min).`)
      setCurrentMeeting(null)
      setSelectedNav('recordings')
      clearLiveInvite()
    }
  }

  const handleJoinLiveInvite = (meetingId: string) => {
    const invite = liveMeetingInvite && liveMeetingInvite.id === meetingId ? liveMeetingInvite : null
    if (!invite) return
    addToast('Join request sent to host', 'info')
    addActivityNotification('Join Request', `${currentUser?.name || 'Student'} wants to join ${invite.title}.`)
    clearLiveInvite()
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

  const handleScheduleMeeting = (meeting: Omit<ScheduledMeeting, 'id'>) => {
    const newMeeting: ScheduledMeeting = {
      ...meeting,
      id: `sch-${Date.now()}`,
    }
    setScheduledMeetings((prev) => [newMeeting, ...prev])
    addActivityNotification('Meeting Scheduled', `${newMeeting.title} on ${newMeeting.date.toLocaleString()}`)
  }

  const handleDeleteScheduledMeeting = (id: string) => {
    setScheduledMeetings((prev) => prev.filter((meeting) => meeting.id !== id))
    addToast('Scheduled meeting deleted', 'info')
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

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setSelectedNav('dashboard')
    setShowNotificationPanel(false)
    clearLiveInvite()
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegisterFaculty={handleRegisterFaculty} />
  }

  // If in a meeting, show meeting room
  if (currentMeeting) {
    return (
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
    )
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

  const studentSharedResources = studentSharedResourcesRaw.length > 0
    ? studentSharedResourcesRaw
    : [
      {
        id: 'demo-rec-1',
        title: 'DSA - Recursion Patterns',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        duration: 55,
        participants: ['Aarav Patel', 'Priya Sharma'],
        host: 'Prof. Anita Sharma',
        recording: 'https://example.com/recordings/dsa-recursion.mp4',
        summary: 'Covered recursion design, base cases, and recurrence tracing. Demoed backtracking on subsets.',
        keyPoints: ['Base cases first', 'Prevent infinite recursion', 'Backtracking example'],
      },
      {
        id: 'demo-rec-2',
        title: 'Operating Systems - CPU Scheduling',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        duration: 48,
        participants: ['Amit Kumar', 'Kavya Nair'],
        host: 'Dr. Vikram Singh',
        recording: 'https://example.com/recordings/os-cpu-scheduling.mp4',
        summary: 'FCFS vs SJF vs RR trade-offs; calculating waiting/turnaround times.',
        keyPoints: ['FCFS', 'SJF', 'Round Robin', 'Gantt chart practice'],
        autoSharedWithAbsent: true,
      },
      {
        id: 'demo-rec-3',
        title: 'Digital Electronics - Flip Flops',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 42,
        participants: ['Karan Mehta', 'Pooja Verma'],
        host: 'Prof. Rajesh Kumar',
        recording: 'https://example.com/recordings/digital-flipflops.mp4',
        summary: 'SR, JK, D, T flip flops; setup/hold timing basics.',
        keyPoints: ['SR latch', 'JK flip flop', 'Timing diagrams'],
        absentMembers: ['Guest Student'],
      },
    ]

  const getResourceSubject = (title: string) => {
    const [prefix] = title.split('-')
    return prefix?.trim() || 'General'
  }

  const handleRequestDoubtSession = (payload: { topic: string; message: string; preferredSlot: string }) => {
    setStudentDoubtRequests((prev) => [
      {
        id: `dr-${Date.now()}`,
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

      <HierarchicalSidebar
        isOpen={sidebarOpen}
        selected={selectedNav}
        onSelect={setSelectedNav}
        userRole={currentUser?.role || 'student'}
      />

      <main
        className="min-h-screen"
        style={{ marginLeft: sidebarOpen ? '320px' : '0px', transition: 'margin-left 0.22s ease-in-out' }}
      >
        <div className="p-6 md:p-10 pt-16">
          <div className="max-w-7xl mx-auto">
            {selectedNav === 'dashboard' && (
              <FacultyStudentDashboard 
                role={currentUser?.role === 'faculty' ? 'faculty' : 'student'} 
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
            )}

            {selectedNav === 'academic-structure' && currentUser?.role === 'faculty' && (
              <AcademicStructure
                facultyRoot={academicRoot}
                facultyProfile={currentUser?.facultyProfile}
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
                onAcademicRootChange={(updatedDepts) => setAcademicRoot((prev) => ({ ...prev, departments: updatedDepts }))}
              />
            )}

            {selectedNav === 'meetings' && currentUser?.role === 'faculty' && (
              <div className="glass rounded-2xl border border-white/10 p-6 text-slate-200">
                <div className="text-white text-xl font-semibold mb-4">Meetings & Video Calls</div>
                <div className="space-y-4">
                  {currentUser?.role === 'faculty' && (
                    <>
                      <CalendarIntegration
                        meetings={scheduledMeetings}
                        onSchedule={handleScheduleMeeting}
                        onEdit={() => {}}
                        onDelete={handleDeleteScheduledMeeting}
                        onToast={addToast}
                      />

                      <div className="text-slate-400 text-sm">
                        Start a meeting by clicking the video icon next to any section in the Academic Structure.
                      </div>
                    </>
                  )}

                  {currentUser?.role === 'faculty' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h3 className="text-blue-300 font-medium mb-2">Quick Actions</h3>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            // Find first section to demo
                            const firstSection = getFirstAvailableSection()
                            if (firstSection) {
                              handleStartMeetingForSection(firstSection)
                            }
                          }}
                          className="w-full text-left px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                        >
                          🎥 Start Demo Meeting (CSE Section A)
                        </button>
                        <button 
                          onClick={() => addToast('Schedule meeting functionality coming soon!', 'info')}
                          className="w-full text-left px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 rounded-lg transition-colors"
                        >
                          📅 Schedule Meeting
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
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
                          ? 'Start or join a meeting and your latest session history will appear here for quick return access.'
                          : 'Join a meeting and your latest session history will appear here for quick return access.'}
                        action={currentUser?.role === 'faculty'
                          ? { label: 'Start Quick Meeting', onClick: handleQuickStartMeeting }
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
                  <MeetingHistory meetings={meetingHistory} onPlayRecording={handlePlayRecording} />
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
        <StudentSelectionModal
          isOpen={showStudentSelection}
          onClose={() => {
            setShowStudentSelection(false)
            setSelectedSection(null)
          }}
          section={selectedSection}
          onStartMeeting={handleStudentSelectionComplete}
        />
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

export default App
