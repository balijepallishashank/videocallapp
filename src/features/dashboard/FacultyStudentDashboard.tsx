import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clapperboard, GraduationCap, MessageSquare, Video } from 'lucide-react'

interface SharedResourceItem {
  id: string
  title: string
  date: Date
  hasRecording: boolean
  hasSummary: boolean
  subject?: string
  recordingUrl?: string
  downloadUrl?: string
  fileSizeLabel?: string
  slidesUrl?: string
  summaryText?: string
  summaryUrl?: string
}

interface FacultyStudentDashboardProps {
  role: 'faculty' | 'student'
  onQuickStartMeeting?: () => void
  onNavigate?: (nav: string) => void
  upcomingMeetings?: Array<{ id: string; title: string; date: Date }>
  attendanceHistory?: Array<{ id: string; title: string; date: Date; status: 'Attended' | 'Absent' }>
  notifications?: Array<{ id: string; title: string; message: string }>
  sharedResources?: Array<SharedResourceItem>
  liveInvite?: { id: string; title: string; sectionName: string; host: string; startedAt: Date }
  onJoinLiveMeeting?: (meetingId: string) => void
  doubtRequests?: Array<{ id: string; topic: string; preferredSlot: string; requestedBy?: string; status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed'; requestedAtLabel: string }>
  onRequestDoubtSession?: (payload: { topic: string; message: string; preferredSlot: string }) => void
  onUpdateDoubtRequestStatus?: (requestId: string, status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed') => void
}

export default function FacultyStudentDashboard({
  role,
  onQuickStartMeeting,
  onNavigate,
  upcomingMeetings = [],
  attendanceHistory = [],
  notifications = [],
  sharedResources = [],
  liveInvite,
  onJoinLiveMeeting,
  doubtRequests = [],
  onRequestDoubtSession,
  onUpdateDoubtRequestStatus,
}: FacultyStudentDashboardProps) {
  const attendedCount = attendanceHistory.filter((item) => item.status === 'Attended').length
  const attendanceRate = attendanceHistory.length > 0 ? Math.round((attendedCount / attendanceHistory.length) * 100) : 0

  const [doubtTopic, setDoubtTopic] = useState('')
  const [doubtMessage, setDoubtMessage] = useState('')
  const [preferredSlot, setPreferredSlot] = useState('')
  const [calendarAdded, setCalendarAdded] = useState<Record<string, boolean>>({})

  const pendingRequests = doubtRequests.filter((request) => request.status === 'Sent')
  const hasPendingRequests = role === 'student' && pendingRequests.length > 0

  const handleSubmitDoubtSession = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!doubtTopic.trim() || !doubtMessage.trim() || !preferredSlot.trim()) {
      return
    }

    onRequestDoubtSession?.({
      topic: doubtTopic.trim(),
      message: doubtMessage.trim(),
      preferredSlot: preferredSlot.trim(),
    })

    setDoubtTopic('')
    setDoubtMessage('')
    setPreferredSlot('')
  }

  const getDoubtStatusClass = (status: 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed') => {
    if (status === 'Sent') return 'text-sky-200 border-sky-400/30 bg-sky-500/10'
    if (status === 'Accepted') return 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10'
    if (status === 'Rescheduled') return 'text-amber-200 border-amber-400/30 bg-amber-500/10'
    return 'text-violet-200 border-violet-400/30 bg-violet-500/10'
  }

  const handleAddToCalendar = (request: { id: string; topic: string; preferredSlot: string }) => {
    const title = encodeURIComponent(`Doubt session: ${request.topic}`)
    const details = encodeURIComponent(`Preferred slot: ${request.preferredSlot}`)
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setCalendarAdded((prev) => ({ ...prev, [request.id]: true }))
  }

  return (
    <div className="w-full h-full">
      {role === 'student' && liveInvite && (
        <div className="glass rounded-xl p-5 mb-6 border-2 border-emerald-300/70 bg-emerald-500/20 shadow-xl shadow-emerald-500/25 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide text-emerald-50 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-200 animate-pulse" aria-hidden />
                Class invite
              </p>
              <h3 className="text-white font-semibold text-lg leading-tight">{liveInvite.title}</h3>
              <p className="text-slate-100 text-sm">{liveInvite.sectionName} · Host: {liveInvite.host}</p>
              <p className="text-slate-200 text-xs">Started at {liveInvite.startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  onJoinLiveMeeting?.(liveInvite.id)
                  onNavigate?.('meetings')
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-emerald-300 hover:bg-emerald-200 text-slate-950 text-sm font-bold shadow-md shadow-emerald-300/30"
              >
                Accept & Join class
              </button>
              <button
                onClick={() => onNavigate?.('meetings')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-slate-800/80 border border-white/15 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {role === 'faculty' ? 'Dashboard' : 'Student Dashboard'}
          </h1>
          <p className="text-slate-300 mt-2">
            {role === 'faculty'
              ? 'Manage your academic sections and host video meetings.'
              : 'Join-only access: track meetings, attendance, reminders, and shared resources.'}
          </p>
          {role === 'student' && (
            <p className="text-slate-400 text-sm mt-1">Today · No classes, deadlines, or reminders for today.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 min-w-[220px]">
          {hasPendingRequests && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 shadow-lg shadow-amber-500/20 text-amber-50 text-xs font-semibold">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-300 animate-pulse" aria-hidden />
              {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''} awaiting your response
            </div>
          )}
          {role === 'faculty' && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onQuickStartMeeting?.()}
              className="w-full px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-semibold"
            >
              Start Meeting
            </motion.button>
          )}
        </div>
      </div>

      {role === 'student' && hasPendingRequests && (
        <div className="glass rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-amber-100 text-sm font-semibold">You have pending faculty requests</p>
              <p className="text-amber-50/80 text-xs">Open the tracking card below to accept or propose a new slot.</p>
            </div>
            <a href="#doubt-tracking" className="text-[11px] px-3 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-amber-50 border border-amber-300/40 text-center">
              Go to tracking
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Meetings' : 'Upcoming Meetings'}</div>
          <div className="text-3xl font-bold text-blue-200">{role === 'faculty' ? 12 : upcomingMeetings.length}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Recordings' : 'Attendance Rate'}</div>
          <div className="text-3xl font-bold text-purple-200">{role === 'faculty' ? 5 : `${attendanceRate}%`}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-slate-400 text-sm">{role === 'faculty' ? 'Academic Units' : 'Shared Resources'}</div>
          <div className="text-3xl font-bold text-cyan-200">{role === 'faculty' ? 3 : sharedResources.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('academic-structure')}>
            <GraduationCap className="w-5 h-5 text-cyan-300 mb-3" />
            <h3 className="text-white font-semibold">Academic Structure</h3>
            <p className="text-slate-400 text-sm mt-1">Browse departments, academic years, and students.</p>
          </button>
        )}

        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('meetings')}>
            <Video className="w-5 h-5 text-blue-300 mb-3" />
            <h3 className="text-white font-semibold">Meetings</h3>
            <p className="text-slate-400 text-sm mt-1">Start, join, and manage video meetings.</p>
          </button>
        )}

        <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('recordings')}>
          <Clapperboard className="w-5 h-5 text-violet-300 mb-3" />
          <h3 className="text-white font-semibold">{role === 'faculty' ? 'Recordings' : 'Shared Resources'}</h3>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'faculty' ? 'Access recordings and meeting summaries.' : 'Download shared recordings and summaries from joined meetings.'}
          </p>
        </button>

        {role === 'faculty' && (
          <button className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all" onClick={() => onNavigate?.('meetings')}>
            <Calendar className="w-5 h-5 text-amber-300 mb-3" />
            <h3 className="text-white font-semibold">Schedule</h3>
            <p className="text-slate-400 text-sm mt-1">Schedule academic sessions and reminders.</p>
          </button>
        )}
      </div>

      {role === 'faculty' && (
        <div className="glass rounded-xl p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <h3 className="text-white font-semibold">Doubt Requests Admin</h3>
          </div>
          {doubtRequests.length === 0 ? (
            <p className="text-slate-500 text-sm">No student doubt requests yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-auto pr-1">
              {doubtRequests.map((request) => (
                <div key={request.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{request.topic}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {request.requestedBy ? `${request.requestedBy} · ` : ''}{request.preferredSlot} · {request.requestedAtLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getDoubtStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                    <select
                      value={request.status}
                      onChange={(event) => onUpdateDoubtRequestStatus?.(request.id, event.target.value as 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed')}
                      className="text-xs rounded-md bg-slate-900/70 border border-white/10 px-2 py-1 text-slate-200 focus:outline-none"
                    >
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rescheduled">Rescheduled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-cyan-300" />
              <h3 className="text-white font-semibold">Request Doubt Session</h3>
            </div>
            <form onSubmit={handleSubmitDoubtSession} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={doubtTopic}
                onChange={(event) => setDoubtTopic(event.target.value)}
                placeholder="Topic (e.g., DSA, Networks)"
                className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <input
                value={preferredSlot}
                onChange={(event) => setPreferredSlot(event.target.value)}
                placeholder="Preferred slot (e.g., Tomorrow 4 PM)"
                className="rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/20 text-cyan-200 text-sm font-medium"
              >
                Send Request
              </button>
              <textarea
                value={doubtMessage}
                onChange={(event) => setDoubtMessage(event.target.value)}
                placeholder="Describe your doubt briefly..."
                className="md:col-span-3 rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 min-h-[90px] focus:outline-none"
              />
            </form>
            <p className="text-[11px] text-slate-500 mt-2">One-click request to faculty replaces direct meeting controls.</p>
          </div>

          <div id="doubt-tracking" className="glass rounded-xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-300" />
              <h3 className="text-white font-semibold">Doubt Request Tracking</h3>
            </div>
            {doubtRequests.length === 0 ? (
              <p className="text-slate-500 text-sm">No faculty requests yet.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-auto pr-1">
                {doubtRequests.map((request) => (
                  <div key={request.id} className="rounded-lg bg-slate-900/60 border border-white/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{request.topic}</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">{request.preferredSlot} · {request.requestedAtLabel}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getDoubtStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                      {request.status === 'Sent' && (
                        <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => onUpdateDoubtRequestStatus?.(request.id, 'Accepted')}
                            className="text-[11px] px-3 py-1 rounded bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-50 border border-emerald-300/40 font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onUpdateDoubtRequestStatus?.(request.id, 'Rescheduled')}
                            className="text-[11px] px-3 py-1 rounded bg-slate-700/80 hover:bg-slate-700 text-slate-100 border border-white/20 font-semibold"
                          >
                            Request change
                          </button>
                        </div>
                      )}
                      {request.status === 'Accepted' && !calendarAdded[request.id] && (
                        <button
                          onClick={() => handleAddToCalendar(request)}
                          className="text-[11px] px-3 py-1 rounded bg-blue-500/25 hover:bg-blue-500/35 text-blue-50 border border-blue-300/40 font-semibold"
                        >
                          Add to calendar
                        </button>
                      )}
                      {request.status === 'Accepted' && calendarAdded[request.id] && (
                        <span className="text-[11px] px-3 py-1 rounded bg-blue-500/10 border border-blue-300/40 text-blue-50 font-semibold">Added</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="glass rounded-xl p-5 lg:col-span-2">
              <h3 className="text-white font-semibold mb-3">Recent Notifications</h3>
              <div className="space-y-2 max-h-40 overflow-auto pr-1">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-lg bg-slate-900/50 border border-white/10 px-3 py-2">
                    <p className="text-xs text-white">{notification.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
