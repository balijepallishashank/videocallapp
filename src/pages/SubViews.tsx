import { useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Calendar, Clapperboard, ClipboardCheck, HelpCircle, Link as LinkIcon, Plus, Mic, Trash2, CalendarDays } from 'lucide-react'
import {
  db,
  createClass,
  joinClassByCode,
  subscribeToClasses,
  subscribeToLiveMeetings,
  subscribeToMeetings,
  subscribeToScheduledMeetings,
  subscribeToClassMembers,
  subscribeToMeetingAttendance,
  saveUserProfile,
  startLiveMeeting,
  endLiveMeeting,
  deleteScheduledMeeting,
  notifyStudentsOfCancelledMeeting,
  createNotification,
  type LiveMeetingInvite,
  type ScheduledMeeting,
  subscribeToAllRecordings,
} from '../services/db'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth } from '../config/firebase'
import MeetingHistory from '../features/meeting/MeetingHistory'
import type { MeetingRecord } from '../features/meeting/MeetingHistory'
import ScheduledMeetingForm from '../features/scheduling/components/ScheduledMeetingForm'
import ScheduledMeetingCard from '../features/scheduling/components/ScheduledMeetingCard'
import { useScheduledMeetings } from '../features/scheduling/hooks/useScheduledMeetings'
import { useScheduledMeetingPermissions } from '../features/scheduling/hooks/useScheduledMeetingPermissions'

const SettingsPage = lazy(() => import('./SettingsPage'))

interface OutletContext {
  currentUser: any
  role: 'faculty' | 'student'
  isFaculty: boolean
  isStudent: boolean
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
  liveInvite: LiveMeetingInvite | null
  joinLiveInvite: (invite: LiveMeetingInvite) => void
  notifications: any[]
}

function ClassCard({ item, currentUser, navigate, addToast }: { item: any; currentUser: any; navigate: any; addToast: any }) {
  const [studentCount, setStudentCount] = useState(0)
  const [isActiveMeeting, setIsActiveMeeting] = useState(false)
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null)
  const [upcomingMeetingText, setUpcomingMeetingText] = useState('None')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    const unsubMembers = subscribeToClassMembers(item.id, (list) => {
      setStudentCount(list.length)
    })
    const unsubLive = subscribeToLiveMeetings((list) => {
      const active = list.some((m) => m.classId === item.id)
      setIsActiveMeeting(active)
    })
    const unsubAttendance = subscribeToMeetingAttendance(item.id, (list) => {
      if (list.length === 0) {
        setAttendanceRate(null)
        return
      }
      const presentOrLate = list.filter((e: any) => e.status === 'Present' || e.status === 'Late' || e.status === 'Attended').length
      const rate = Math.round((presentOrLate / list.length) * 100)
      setAttendanceRate(rate)
    })
    const unsubScheduled = subscribeToScheduledMeetings((list) => {
      const classMeetings = list.filter((m: any) => m.classId === item.id && m.status === 'scheduled')
      if (classMeetings.length === 0) {
        setUpcomingMeetingText('None')
        return
      }
      const now = new Date().getTime()
      const future = classMeetings
        .map((m: any) => ({ ...m, timeMs: new Date(m.scheduledDate).getTime() }))
        .filter((m: any) => m.timeMs > now)
        .sort((a: any, b: any) => a.timeMs - b.timeMs)

      if (future.length > 0) {
        const next = future[0]
        const dt = new Date(next.scheduledDate)
        setUpcomingMeetingText(`${dt.toLocaleDateString()} ${next.startTime || ''}`)
      } else {
        setUpcomingMeetingText('None')
      }
    })

    return () => {
      unsubMembers()
      unsubLive()
      unsubAttendance()
      unsubScheduled()
    }
  }, [item.id])

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.classCode) return
    await navigator.clipboard.writeText(item.classCode)
    setCopiedCode(true)
    addToast('Class code copied!', 'success')
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const copyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.inviteLink) return
    await navigator.clipboard.writeText(item.inviteLink)
    setCopiedLink(true)
    addToast('Invite link copied!', 'success')
    setTimeout(() => setCopiedLink(false), 1500)
  }

  return (
    <div className="group rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-6 flex flex-col justify-between transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-950/70">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight truncate">{item.name}</h3>
            <p className="mt-1 text-sm text-cyan-400 font-semibold truncate">{item.subject}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex-shrink-0">
            {item.classCode}
          </span>
        </div>

        <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
          {item.description || 'Open the class workspace to manage meetings, materials, and members.'}
        </p>

        <div className="pt-4 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Students</span>
            <span className="text-white font-semibold">{studentCount}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Attendance</span>
            <span className="text-white font-semibold">
              {attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Upcoming Meeting</span>
            <span className="text-white font-semibold truncate max-w-[160px]" title={upcomingMeetingText}>
              {upcomingMeetingText}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Active Meeting</span>
            {isActiveMeeting ? (
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-slate-500 font-medium">No</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button
          onClick={() => navigate(`/${currentUser.role}/class/${item.id}`)}
          className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 py-2.5 text-center text-sm font-bold text-slate-950 transition duration-200"
        >
          Open Class
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyCode}
            className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            {copiedCode ? 'Copied!' : 'Copy Code'}
          </button>
          <button
            onClick={copyLink}
            className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            {copiedLink ? 'Copied!' : 'Copy Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ClassesView() {
  const { currentUser, addToast, isFaculty } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const [classesList, setClassesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeToClasses(
      currentUser.role,
      currentUser.id,
      (list) => {
        setClassesList(list)
        setLoading(false)
      },
      (err: any) => {
        console.error('Firestore subscribeToClasses error:', err)
        const isPermissionDenied = err?.code === 'permission-denied' ||
          err?.message?.includes('permission') ||
          err?.message?.includes('Permissions');
        if (isPermissionDenied) {
          addToast("You don't have permission to load classes. Please verify your account role and Firestore rules.", 'error')
        } else {
          addToast(err instanceof Error ? err.message : 'Failed to load classes.', 'error')
        }
        setLoading(false)
      }
    )
    return () => unsub()
  }, [currentUser])

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim() || !newSubject.trim()) {
      addToast('Please add a class name and subject.', 'warning')
      return
    }


    if (!currentUser || !currentUser.id || currentUser.role !== 'faculty') {
      addToast("You must be authenticated as faculty to create a class.", "error")
      return
    }

    try {
      const created = await createClass({
        name: newClassName.trim(),
        subject: newSubject.trim(),
        description: newDescription.trim(),
        facultyId: currentUser.id,
        facultyName: currentUser.name,
      })
      addToast(`Class "${created.name}" created successfully.`, 'success')
      setNewClassName('')
      setNewSubject('')
      setNewDescription('')
      setShowCreateForm(false)
    } catch (err: any) {
      console.error('Firestore createClass error:', err)
      const isPermissionDenied = err?.code === 'permission-denied' ||
        err?.message?.includes('permission') ||
        err?.message?.includes('Permissions');
      if (isPermissionDenied) {
        addToast("You don't have permission to create classes. Please verify your account role and Firestore rules.", 'error')
      } else {
        addToast(err instanceof Error ? err.message : 'Failed to create class.', 'error')
      }
    }
  }

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) {
      addToast('Please enter a class code.', 'warning')
      return
    }

    try {
      const result = await joinClassByCode(currentUser.id, currentUser.name, currentUser.email, joinCode.trim())
      addToast(`Joined ${result.className}.`, 'success')
      setJoinCode('')
      setShowJoinForm(false)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to join class.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Classes</h1>
          <p className="mt-1 text-slate-400">Manage the class cards that feed the new workspace.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isFaculty && (
            <button
              onClick={async () => {
                try {
                  await saveUserProfile(currentUser.id, { role: 'faculty' } as any)
                  addToast('Firestore user role set to "faculty" successfully! Please reload the page.', 'success')
                } catch (e) {
                  addToast('Failed to update role: ' + (e instanceof Error ? e.message : String(e)), 'error')
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20"
            >
              Fix Faculty Role (Debug)
            </button>
          )}
          {isFaculty ? (
            <button onClick={() => setShowCreateForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">
              <Plus className="h-4 w-4" />
              Create class
            </button>
          ) : (
            <button onClick={() => setShowJoinForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white">
              <LinkIcon className="h-4 w-4" />
              Join class
            </button>
          )}
        </div>
      </div>

      {showCreateForm && isFaculty && (
        <form onSubmit={handleCreateClass} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Class name</label>
              <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-600 focus:outline-none" placeholder="Software Engineering" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Subject</label>
              <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-600 focus:outline-none" placeholder="SE-401" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="min-h-[100px] w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-600 focus:outline-none" placeholder="Short description for the class hub" />
          </div>
          <button className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950">Save class</button>
        </form>
      )}

      {showJoinForm && !isFaculty && (
        <form onSubmit={handleJoinClass} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Class code</label>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-600 focus:outline-none" placeholder="VP-ABC-1234" />
          </div>
          <button className="rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white">Join class</button>
        </form>
      )}

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">Loading classes...</div>
      ) : classesList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
          {isFaculty ? "No classes yet. Create your first class." : "No classes yet."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classesList.map((item) => (
            <ClassCard
              key={item.id}
              item={item}
              currentUser={currentUser}
              navigate={navigate}
              addToast={addToast}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FacultyMeetingsView() {
  const { currentUser, addToast } = useOutletContext<OutletContext>()
  const navigate = useNavigate()

  const [classesList, setClassesList] = useState<any[]>([])
  const [liveMeetings, setLiveMeetings] = useState<LiveMeetingInvite[]>([])
  const [showStartModal, setShowStartModal] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [isStarting, setIsStarting] = useState(false)

  // Fetch classes
  useEffect(() => {
    if (!currentUser) return
    return subscribeToClasses('faculty', currentUser.id, setClassesList)
  }, [currentUser])

  // Subscribe to live meetings
  useEffect(() => {
    const unsub = subscribeToLiveMeetings((list) => {
      const filtered = list.filter((m) => m.facultyId === currentUser?.id)
      setLiveMeetings(filtered)
    })
    return () => unsub()
  }, [currentUser])

  const handleStartLiveMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassId || !meetingTitle.trim() || !currentUser) return

    setIsStarting(true)
    try {
      const cls = classesList.find((c) => c.id === selectedClassId)
      if (!cls) throw new Error('Selected class not found.')

      const channelName = selectedClassId

      await startLiveMeeting(channelName, {
        id: channelName,
        title: meetingTitle.trim(),
        sectionName: cls.name,
        host: currentUser.name,
        invitedStudents: [],
        classId: selectedClassId,
        facultyId: currentUser.id,
        subject: cls.subject,
      })

      const membersSnap = await getDocs(query(collection(db, 'class_members'), where('classId', '==', selectedClassId)))
      await Promise.all(
        membersSnap.docs.map((memberDoc) => {
          const member = memberDoc.data()
          return createNotification({
            userId: member.studentId,
            title: `${cls.name} is live`,
            description: `${currentUser.name} started live class: ${meetingTitle.trim()}. Join now!`,
            type: 'info',
            priority: 'high',
            classId: selectedClassId,
            meetingId: channelName,
          })
        })
      )

      addToast('Live meeting started successfully!', 'success')
      setShowStartModal(false)
      setMeetingTitle('')

      navigate(`/faculty/class/${selectedClassId}?join=true`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to start meeting.', 'error')
    } finally {
      setIsStarting(false)
    }
  }

  const handleEndLiveMeeting = async (classId: string) => {
    try {
      // Ensure the current user context (client-side profile) is a faculty member
      if (!currentUser || (currentUser.role && currentUser.role !== 'faculty')) {
        addToast('Only faculty can end a live meeting. Verify your account role.', 'error')
        return
      }

      if (!auth.currentUser) {
        addToast('You must be signed in to end the meeting. Please reload and sign in again.', 'error')
        return
      }

      await endLiveMeeting(classId)
      addToast('Live meeting ended.', 'success')
    } catch (err) {
      console.error('endLiveMeeting error:', err)
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('permission-denied')) {
        addToast('Permission denied when ending meeting — check Firestore rules and your faculty role.', 'error')
      } else if (message.includes('Unauthenticated')) {
        addToast('Authentication required. Please sign in and try again.', 'error')
      } else {
        addToast(message || 'Failed to end meeting.', 'error')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Live Meetings</h1>
          <p className="mt-1 text-slate-400">Manage and join active online classrooms.</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
        >
          <Plus className="h-4 w-4" />
          Start New Live Meeting
        </button>
      </div>

      {liveMeetings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-slate-900 p-4 border border-white/5">
            <Mic className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No live meetings running</h3>
            <p className="text-slate-400 max-w-sm text-sm">Create an instant meeting to start teaching your students right away.</p>
          </div>
          <button
            onClick={() => setShowStartModal(true)}
            className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            Start New Live Meeting
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {liveMeetings.map((meeting) => {
            const cls = classesList.find((c) => c.id === meeting.classId)
            const activeStudents = cls?.activeStudentCount || 0

            return (
              <div key={meeting.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 flex flex-col justify-between space-y-6 hover:border-emerald-500/30 transition animate-fade-in">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                    <div className="flex items-center gap-2">
                      <span title="Microphone Active" className="text-emerald-400"><Mic className="h-4 w-4" /></span>
                      <span title="Not Recording" className="text-slate-600"><Clapperboard className="h-4 w-4" /></span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{meeting.title}</h3>
                    <p className="text-sm font-semibold text-cyan-400 mt-0.5">{meeting.sectionName}</p>
                    <p className="text-xs text-slate-400 mt-1">Subject: {meeting.subject}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-slate-500">Started At</span>
                      <span className="font-semibold text-white">
                        {meeting.startedAt ? new Date(meeting.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-slate-500">Students Enrolled</span>
                      <span className="font-semibold text-white">{activeStudents} enrolled</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/faculty/class/${meeting.classId}?join=true`)}
                    className="flex-1 rounded-xl bg-emerald-500 py-2 text-center text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    Join Meeting
                  </button>
                  <button
                    onClick={() => handleEndLiveMeeting(meeting.id)}
                    className="rounded-xl border border-white/10 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    End
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-6 md:p-8 shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-black text-white">Start Live Meeting</h2>
              <p className="text-slate-400 text-sm mt-1">Launch an instant session for students to join.</p>
            </div>

            <form onSubmit={handleStartLiveMeeting} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Class</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Algorithms"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStarting}
                  className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50"
                >
                  {isStarting ? 'Starting...' : 'Start Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function ScheduledMeetingsView() {
  const { currentUser, addToast, isFaculty } = useOutletContext<OutletContext>()
  const navigate = useNavigate()

  const { meetings, loading } = useScheduledMeetings({ currentUser })
  const perms = useScheduledMeetingPermissions(currentUser)

  const [showForm, setShowForm] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null)
  const [classesList, setClassesList] = useState<any[]>([])

  useEffect(() => {
    if (!currentUser || !isFaculty) return
    return subscribeToClasses('faculty', currentUser.id, setClassesList)
  }, [currentUser, isFaculty])

  const handleEdit = (meeting: ScheduledMeeting) => {
    setEditingMeeting(meeting)
    setShowForm(true)
  }

  const handleDelete = async (meeting: ScheduledMeeting) => {
    if (!window.confirm(`Delete "${meeting.title}"? Students will be notified.`)) return
    try {
      await deleteScheduledMeeting(meeting.id)
      notifyStudentsOfCancelledMeeting(meeting.classId, meeting.id, meeting.title).catch(() => {})
      addToast('Scheduled meeting deleted.', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete meeting.', 'error')
    }
  }

  const handleStart = async (meeting: ScheduledMeeting) => {
    try {
      await startLiveMeeting(meeting.classId, {
        id: meeting.classId,
        title: meeting.title,
        sectionName: meeting.className || '',
        host: currentUser?.name || 'Faculty',
        invitedStudents: [],
        classId: meeting.classId,
        facultyId: currentUser?.id || '',
        subject: meeting.description || 'Scheduled Lecture',
      })
      addToast('Meeting started!', 'success')
      navigate(`/faculty/class/${meeting.classId}?join=true`)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to start meeting.', 'error')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingMeeting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            {isFaculty ? 'Scheduled Meetings' : 'Upcoming Meetings'}
          </h1>
          <p className="mt-1 text-slate-400">
            {isFaculty
              ? 'Plan and manage future class sessions.'
              : 'Upcoming sessions for your enrolled classes.'}
          </p>
        </div>
        {perms.canCreate && (
          <button
            id="schedule-new-meeting-btn"
            onClick={() => { setEditingMeeting(null); setShowForm(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
          >
            <Plus className="h-4 w-4" />
            Schedule Meeting
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-slate-900 p-4 border border-white/5">
            <Calendar className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              {isFaculty ? 'No scheduled meetings yet' : 'No upcoming meetings'}
            </h3>
            <p className="text-slate-400 max-w-sm text-sm">
              {isFaculty
                ? 'Schedule a lecture or discussion ahead of time. Students will see it on their calendar.'
                : 'Your faculty will schedule meetings here. Check back later.'}
            </p>
          </div>
          {perms.canCreate && (
            <button
              onClick={() => { setEditingMeeting(null); setShowForm(true) }}
              className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Schedule a Meeting
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <ScheduledMeetingCard
              key={meeting.id}
              meeting={meeting}
              isFaculty={isFaculty}
              onEdit={perms.canEdit(meeting) ? handleEdit : undefined}
              onDelete={perms.canDelete(meeting) ? handleDelete : undefined}
              onStart={perms.canStart(meeting) ? handleStart : undefined}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && isFaculty && (
          <ScheduledMeetingForm
            editingMeeting={editingMeeting}
            classesList={classesList}
            currentUser={currentUser}
            onSave={() => handleFormClose()}
            onClose={handleFormClose}
            addToast={addToast}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export function JoinMeetingView() {
  const { currentUser } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const { meetings, loading } = useScheduledMeetings({ currentUser })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Upcoming Meetings</h1>
          <p className="mt-1 text-slate-400">Scheduled sessions for your enrolled classes.</p>
        </div>
        <button
          onClick={() => navigate('/student/classes')}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition"
        >
          <CalendarDays className="h-4 w-4" />
          My Classes
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-slate-900 p-4 border border-white/5">
            <CalendarDays className="h-8 w-8 text-slate-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No upcoming meetings</h3>
            <p className="text-slate-400 max-w-sm text-sm">Your faculty hasn't scheduled any sessions yet. Check back soon or visit your classes.</p>
          </div>
          <button
            onClick={() => navigate('/student/classes')}
            className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
          >
            Go to My Classes
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((meeting) => (
            <ScheduledMeetingCard
              key={meeting.id}
              meeting={meeting}
              isFaculty={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MeetingHistoryView() {
  const { currentUser, isStudent } = useOutletContext<OutletContext>()
  const [classesList, setClassesList] = useState<any[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])

  useEffect(() => {
    if (!currentUser) return
    const unsubClasses = subscribeToClasses(currentUser.role, currentUser.id, (list) => setClassesList(list))
    const unsubMeetings = subscribeToMeetings((list) => setMeetings(list))
    return () => {
      unsubClasses()
      unsubMeetings()
    }
  }, [currentUser])

  const visibleMeetings = useMemo(() => {
    if (!isStudent) return meetings
    const classIds = new Set(classesList.map((item) => item.id))
    return meetings.filter((meeting: any) => !meeting.classId || classIds.has(meeting.classId))
  }, [classesList, isStudent, meetings])

  return <MeetingHistory meetings={visibleMeetings} />
}

export function AttendanceView() {
  const { currentUser, isFaculty } = useOutletContext<OutletContext>()
  const [classesList, setClassesList] = useState<any[]>([])
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const unsubClasses = subscribeToClasses(currentUser.role, currentUser.id, (list) => {
      setClassesList(list)
    })
    const unsubMeetings = subscribeToMeetings((list) => {
      setMeetings(list.sort((a, b) => b.date.getTime() - a.date.getTime()))
      setLoading(false)
    })
    return () => {
      unsubClasses()
      unsubMeetings()
    }
  }, [currentUser])

  const visibleMeetings = useMemo(() => {
    if (classesList.length === 0) return []
    const classIds = new Set(classesList.map((item) => item.id))
    return meetings.filter((meeting: any) => meeting.classId && classIds.has(meeting.classId))
  }, [classesList, meetings])

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h1 className="flex items-center gap-2 text-2xl font-black text-white">
        <ClipboardCheck className="h-6 w-6 text-rose-300" /> Attendance
      </h1>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading attendance...</div>
      ) : visibleMeetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">
          No attendance records found for your classes.
        </div>
      ) : isFaculty ? (
        <div className="space-y-3">
          {visibleMeetings.map((meeting) => {
            const attended = meeting.attendanceReport?.filter((entry) => entry.status === 'Attended').length || 0
            const total = meeting.attendanceReport?.length || 0
            return (
              <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="font-semibold text-white">{meeting.title}</div>
                <div className="mt-1 text-sm text-slate-400">{attended}/{total} attended</div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleMeetings.map((meeting) => {
            const record = meeting.attendanceReport?.find((entry) => entry.name === currentUser.name)
            const attended = record ? record.status === 'Attended' : meeting.participants?.includes(currentUser.name)
            return (
              <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{meeting.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{new Date(meeting.date).toLocaleDateString()}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${attended ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/20 bg-rose-500/10 text-rose-300'}`}>
                  {attended ? 'Attended' : 'Absent'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function RecordingsView() {
  const { currentUser } = useOutletContext<OutletContext>()
  const [classesList, setClassesList] = useState<any[]>([])
  const [recordings, setRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const unsub = subscribeToClasses(currentUser.role, currentUser.id, (list) => {
      setClassesList(list)
    })
    return () => unsub()
  }, [currentUser])

  useEffect(() => {
    if (classesList.length === 0) {
      setLoading(false)
      return
    }
    const classIds = classesList.map(c => c.id)
    const unsub = subscribeToAllRecordings(classIds, (list) => {
      setRecordings(list)
      setLoading(false)
    })
    return () => unsub()
  }, [classesList])

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h1 className="flex items-center gap-2 text-2xl font-black text-white">
        <Clapperboard className="h-6 w-6 text-purple-300" /> Recordings
      </h1>

      {loading ? (
        <div className="text-slate-400 text-sm">Loading recordings...</div>
      ) : recordings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">No recordings available yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recordings.map((rec) => {
            const cls = classesList.find(c => c.id === rec.classId)
            const canDownload = currentUser.role === 'faculty' || rec.allowDownload
            return (
              <div key={rec.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 flex flex-col justify-between hover:border-purple-500/30 transition">
                <div>
                  <div className="font-semibold text-white text-lg">{rec.recordingName}</div>
                  <div className="text-xs text-purple-400 font-semibold mt-1">{cls?.name || 'Class Session'}</div>
                  {rec.duration && (
                    <div className="text-xs text-slate-500 mt-2">Duration: {rec.duration}</div>
                  )}
                  {rec.size && (
                    <div className="text-xs text-slate-500">Size: {rec.size}</div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <a href={rec.recordingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-purple-500 hover:bg-purple-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Open Video
                  </a>
                  {canDownload && (
                    <a href={rec.recordingUrl} download={rec.recordingName} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 transition">
                      Download
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SettingsPageWrapper() {
  const navigate = useNavigate()
  const { isFaculty } = useOutletContext<OutletContext>()

  return (
    <Suspense fallback={<div className="text-slate-400 text-sm">Loading settings...</div>}>
      <SettingsPage onBack={() => navigate(isFaculty ? '/faculty/dashboard' : '/student/dashboard')} />
    </Suspense>
  )
}

export function ProfileView() {
  const { currentUser } = useOutletContext<OutletContext>()

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-2xl font-black text-white">
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
          <p className="text-sm text-slate-400">{currentUser.email}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-slate-500">Role</div>
          <div className="mt-1 text-white font-semibold">{currentUser.role}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="text-slate-500">Student / Employee ID</div>
          <div className="mt-1 text-white font-semibold">{currentUser.studentId || currentUser.employeeId || 'N/A'}</div>
        </div>
      </div>
    </div>
  )
}

export function NotificationsView() {
  const { notifications } = useOutletContext<OutletContext>()

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-black text-white">Notifications</h1>
      {notifications.length === 0 ? (
        <p className="text-slate-400">No notifications yet.</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div key={notification.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="font-semibold text-white">{notification.title}</div>
              <div className="mt-1 text-sm text-slate-400">{notification.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalyticsView() {
  const { currentUser } = useOutletContext<OutletContext>()
  const [classesCount, setClassesCount] = useState(0)
  const [meetingsCount, setMeetingsCount] = useState(0)
  const [recordingsCount, setRecordingsCount] = useState(0)

  useEffect(() => {
    const unsubClasses = currentUser ? subscribeToClasses(currentUser.role, currentUser.id, (list) => setClassesCount(list.length)) : () => { }
    const unsubMeetings = subscribeToMeetings((list) => {
      setMeetingsCount(list.length)
      setRecordingsCount(list.filter((meeting) => Boolean(meeting.recording) || (meeting as any).recordingUrl).length)
    })

    return () => {
      unsubClasses()
      unsubMeetings()
    }
  }, [currentUser])

  // Custom SVG Bar Chart calculation
  const maxVal = Math.max(classesCount, meetingsCount, recordingsCount, 1)
  const classHeight = (classesCount / maxVal) * 120
  const meetingHeight = (meetingsCount / maxVal) * 120
  const recordingHeight = (recordingsCount / maxVal) * 120

  return (
    <div className="space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-white">
          <HelpCircle className="h-6 w-6 text-rose-300" /> Analytics & Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time statistics and workspace analysis overview.</p>
      </div>

      {/* Grid counters */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:border-cyan-500/30 transition">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Classes</div>
          <div className="mt-2 text-3xl font-black text-cyan-400">{classesCount}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:border-violet-500/30 transition">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Meetings Hosted</div>
          <div className="mt-2 text-3xl font-black text-violet-400">{meetingsCount}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 hover:border-emerald-500/30 transition">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Cloud Recordings</div>
          <div className="mt-2 text-3xl font-black text-emerald-400">{recordingsCount}</div>
        </div>
      </div>

      {/* High-quality SVG Chart Component */}
      <div className="grid md:grid-cols-2 gap-6 pt-4">
        {/* Engagement Chart */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5">
          <h3 className="text-white font-bold text-sm mb-4">Workspace Engagement Distribution</h3>
          <div className="flex items-center justify-center p-4">
            <svg width="280" height="180" className="overflow-visible">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="260" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="40" y1="60" x2="260" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="40" y1="100" x2="260" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <line x1="40" y1="140" x2="260" y2="140" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

              {/* Bar 1 (Classes) */}
              <rect x="70" y={140 - classHeight} width="30" height={classHeight} fill="url(#cyan-grad)" rx="4" className="transition-all duration-500" />
              {/* Bar 2 (Meetings) */}
              <rect x="135" y={140 - meetingHeight} width="30" height={meetingHeight} fill="url(#violet-grad)" rx="4" className="transition-all duration-500" />
              {/* Bar 3 (Recordings) */}
              <rect x="200" y={140 - recordingHeight} width="30" height={recordingHeight} fill="url(#emerald-grad)" rx="4" className="transition-all duration-500" />

              {/* Axis Labels */}
              <text x="85" y="160" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Classes</text>
              <text x="150" y="160" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Meetings</text>
              <text x="215" y="160" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">Videos</text>

              {/* Data Values */}
              <text x="85" y={130 - classHeight} fill="#22d3ee" fontSize="11" fontWeight="extrabold" textAnchor="middle">{classesCount}</text>
              <text x="150" y={130 - meetingHeight} fill="#a78bfa" fontSize="11" fontWeight="extrabold" textAnchor="middle">{meetingsCount}</text>
              <text x="215" y={130 - recordingHeight} fill="#34d399" fontSize="11" fontWeight="extrabold" textAnchor="middle">{recordingsCount}</text>

              {/* Gradients */}
              <defs>
                <linearGradient id="cyan-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="violet-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="emerald-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Engagement Trend */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Monthly Activity Engagement Rate</h3>
            <p className="text-xs text-slate-500 mt-1">Aggregate workspace student activity trend (simulated).</p>
          </div>
          <div className="flex items-center justify-center p-2">
            <svg width="280" height="100" className="overflow-visible">
              <path
                d="M 20,80 Q 70,30 120,60 T 220,20"
                fill="none"
                stroke="url(#trend-grad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="220" cy="20" r="4" fill="#22d3ee" />
              <text x="220" y="10" fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">Peak (92%)</text>
              <linearGradient id="trend-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-2">
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan</span>
          </div>
        </div>
      </div>
    </div>
  )
}

