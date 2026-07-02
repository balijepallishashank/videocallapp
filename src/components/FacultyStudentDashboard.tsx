import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Clapperboard, GraduationCap, MessageSquare, Video,
  Search, Clock, User, BookOpen, CheckCircle, RefreshCw, Layers
} from 'lucide-react'

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
  const [requestSearch, setRequestSearch] = useState('')
  const [requestFilter, setRequestFilter] = useState<'All' | 'Sent' | 'Accepted' | 'Rescheduled' | 'Completed'>('All')

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

  // Faculty ERP Admin Derived States
  const facultyDoubtRequests = doubtRequests;
  const upcomingDoubtSession = facultyDoubtRequests.find((r) => r.status === 'Accepted');

  const filteredFacultyRequests = facultyDoubtRequests.filter((req) => {
    const matchesSearch =
      req.topic.toLowerCase().includes(requestSearch.toLowerCase()) ||
      (req.requestedBy || '').toLowerCase().includes(requestSearch.toLowerCase());
    const matchesFilter = requestFilter === 'All' || req.status === requestFilter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = facultyDoubtRequests.filter((r) => r.status === 'Sent').length;
  const acceptedCount = facultyDoubtRequests.filter((r) => r.status === 'Accepted').length;
  const rescheduledCount = facultyDoubtRequests.filter((r) => r.status === 'Rescheduled').length;
  const completedCount = facultyDoubtRequests.filter((r) => r.status === 'Completed').length;

  const getRequestPriority = (id: string) => {
    const num = parseInt(id.replace(/\D/g, '') || '0', 10);
    if (num % 3 === 0) return { level: 'High', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', dot: 'bg-rose-400' };
    if (num % 3 === 1) return { level: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' };
    return { level: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' };
  };

  const getErpStatusStyle = (status: string) => {
    switch (status) {
      case 'Sent': return 'text-amber-300 bg-amber-500/10 border-amber-500/30';
      case 'Accepted': return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
      case 'Rescheduled': return 'text-blue-300 bg-blue-500/10 border-blue-500/30';
      case 'Completed': return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
      default: return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
    }
  };

  const sortedRequests = [...filteredFacultyRequests].sort((a, b) => {
    const pA = getRequestPriority(a.id).level;
    const pB = getRequestPriority(b.id).level;
    const val = { High: 3, Medium: 2, Low: 1 };
    return val[pB as keyof typeof val] - val[pA as keyof typeof val];
  });

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="premium-card border border-white/10 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{role === 'faculty' ? 'Meetings' : 'Upcoming Meetings'}</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-200">{role === 'faculty' ? 12 : upcomingMeetings.length}</div>
        </div>

        <div className="premium-card border border-white/10 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{role === 'faculty' ? 'Recordings' : 'Attendance Rate'}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-purple-200">{role === 'faculty' ? 5 : `${attendanceRate}%`}</div>
        </div>

        <div className="premium-card border border-white/10 hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{role === 'faculty' ? 'Academic Units' : 'Shared Resources'}</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-cyan-200">{role === 'faculty' ? 3 : sharedResources.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {role === 'faculty' && (
          <button className="premium-card p-6 text-left hover:bg-slate-900/40 hover:scale-[1.01] hover:border-white/20 transition-all group duration-300" onClick={() => onNavigate?.('academic-structure')}>
            <GraduationCap className="w-6 h-6 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold text-base">Academic Structure</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Browse departments, academic years, sections, and student rosters.</p>
          </button>
        )}

        {role === 'faculty' && (
          <button className="premium-card p-6 text-left hover:bg-slate-900/40 hover:scale-[1.01] hover:border-white/20 transition-all group duration-300" onClick={() => onNavigate?.('meetings')}>
            <Video className="w-6 h-6 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold text-base">Meetings</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Start, join, and manage live video meetings with class rosters.</p>
          </button>
        )}

        <button className="premium-card p-6 text-left hover:bg-slate-900/40 hover:scale-[1.01] hover:border-white/20 transition-all group duration-300" onClick={() => onNavigate?.('recordings')}>
          <Clapperboard className="w-6 h-6 text-violet-400 mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold text-base">{role === 'faculty' ? 'Recordings' : 'Shared Resources'}</h3>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            {role === 'faculty' ? 'Access recent video recordings and text summaries.' : 'Download recordings and class summaries from joined meetings.'}
          </p>
        </button>

        {role === 'faculty' && (
          <button className="premium-card p-6 text-left hover:bg-slate-900/40 hover:scale-[1.01] hover:border-white/20 transition-all group duration-300" onClick={() => onNavigate?.('meetings')}>
            <Calendar className="w-6 h-6 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold text-base">Schedule</h3>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">Plan upcoming academic sessions, doubt hours, and class notifications.</p>
          </button>
        )}
      </div>

      {role === 'faculty' && (
        <div className="mt-12 space-y-8 animate-in fade-in duration-500">
          {/* 1. UPCOMING DOUBT SESSION */}
          {upcomingDoubtSession && (
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl shadow-blue-500/10">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
              <div className="relative p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Next Upcoming Session
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Subject</p>
                    <p className="text-lg font-bold text-white">{upcomingDoubtSession.topic}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Student</p>
                    <div className="flex items-center gap-2 text-lg font-bold text-white">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs">
                        {upcomingDoubtSession.requestedBy?.charAt(0) || 'S'}
                      </div>
                      {upcomingDoubtSession.requestedBy || 'Unknown Student'}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Time</p>
                    <p className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      {upcomingDoubtSession.preferredSlot}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Meeting Type</p>
                    <p className="text-lg font-bold text-slate-300 flex items-center gap-2">
                      <Video className="w-5 h-5 text-slate-400" />
                      Video Call
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => onQuickStartMeeting?.()} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2">
                    <Video className="w-5 h-5" /> Join Session
                  </button>
                  <button className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-600 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. OVERVIEW CARDS */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Doubt Requests Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{pendingCount}</span>
                </div>
                <p className="text-sm font-medium text-amber-200">Pending</p>
              </div>
              <div className="glass rounded-xl p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{acceptedCount}</span>
                </div>
                <p className="text-sm font-medium text-emerald-200">Accepted</p>
              </div>
              <div className="glass rounded-xl p-5 border border-blue-500/20 hover:border-blue-500/40 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{rescheduledCount}</span>
                </div>
                <p className="text-sm font-medium text-blue-200">Rescheduled</p>
              </div>
              <div className="glass rounded-xl p-5 border border-slate-500/20 hover:border-slate-500/40 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-slate-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{completedCount}</span>
                </div>
                <p className="text-sm font-medium text-slate-300">Completed</p>
              </div>
            </div>
          </div>

          {/* 3 & 4 & 5 & 6. ADMIN REQUESTS & FILTERS */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-white">Doubt Requests Admin</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="premium-input pl-10 py-2 w-full sm:w-64"
                  />
                </div>
                <select
                  value={requestFilter}
                  onChange={(e) => setRequestFilter(e.target.value as any)}
                  className="premium-input px-4 py-2 cursor-pointer bg-slate-950/60"
                >
                  <option value="All">All Requests</option>
                  <option value="Sent">Pending</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* REQUEST CARDS GRID */}
            {sortedRequests.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border-dashed border-2 border-slate-700">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Doubt Requests Available</h3>
                <p className="text-slate-400">All student requests have been resolved or don't match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedRequests.map(req => {
                  const priority = getRequestPriority(req.id);
                  const statusStyle = getErpStatusStyle(req.status);

                  return (
                    <motion.div
                      key={req.id}
                      whileHover={{ y: -4 }}
                      className="glass rounded-2xl p-6 border border-white/10 flex flex-col h-full shadow-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${priority.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.level} Priority
                        </span>
                        <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${statusStyle}`}>
                          {req.status === 'Sent' ? 'Pending' : req.status}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-white mb-4 line-clamp-2" title={req.topic}>{req.topic}</h4>

                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Student</p>
                            <p className="text-sm font-medium text-slate-200">{req.requestedBy || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <Clock className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Requested Time</p>
                            <p className="text-sm font-medium text-slate-200">{req.preferredSlot}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Faculty Assigned</p>
                            <p className="text-sm font-medium text-slate-200">You</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-700/50 flex flex-wrap gap-2 mt-auto">
                        {req.status === 'Sent' && (
                          <>
                            <button
                              onClick={() => onUpdateDoubtRequestStatus?.(req.id, 'Accepted')}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => onUpdateDoubtRequestStatus?.(req.id, 'Rescheduled')}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              Reschedule
                            </button>
                          </>
                        )}
                        {req.status === 'Accepted' && (
                          <button
                            onClick={() => onUpdateDoubtRequestStatus?.(req.id, 'Completed')}
                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                        <button className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors">
                          Details
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 9. RECENT ACTIVITY PANEL */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
            <div className="glass rounded-2xl p-6 border border-white/10">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-6">
                  {notifications.slice(0, 4).map((notif, i) => (
                    <div key={notif.id || i} className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-24px] last:before:hidden before:w-px before:bg-slate-700">
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-blue-500 z-10" />
                      <p className="text-sm font-medium text-white">{notif.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">
                        Just now
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-700">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-emerald-500 z-10" />
                    <p className="text-sm font-medium text-white">Admin accepted a doubt request</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">2 mins ago</p>
                  </div>
                  <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-700">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-blue-500 z-10" />
                    <p className="text-sm font-medium text-white">Prof. Anita scheduled a session</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">5 mins ago</p>
                  </div>
                  <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-[-24px] before:w-px before:bg-slate-700">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-amber-500 z-10" />
                    <p className="text-sm font-medium text-white">Student submitted a new request</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">10 mins ago</p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-purple-500 z-10" />
                    <p className="text-sm font-medium text-white">CSV imported successfully</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">15 mins ago</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="premium-card lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold text-base">Request Doubt Session</h3>
              </div>
              <form onSubmit={handleSubmitDoubtSession} className="space-y-4">
                <input
                  value={doubtTopic}
                  onChange={(event) => setDoubtTopic(event.target.value)}
                  placeholder="Topic (e.g., DSA, Networks)"
                  className="premium-input w-full"
                />
                <input
                  value={preferredSlot}
                  onChange={(event) => setPreferredSlot(event.target.value)}
                  placeholder="Preferred slot (e.g., Tomorrow 4 PM)"
                  className="premium-input w-full"
                />
                <textarea
                  value={doubtMessage}
                  onChange={(event) => setDoubtMessage(event.target.value)}
                  placeholder="Describe your doubt briefly..."
                  className="premium-input w-full min-h-[90px] resize-none"
                />
                <button
                  type="submit"
                  className="btn-primary w-full bg-cyan-600 hover:from-cyan-500 hover:to-cyan-500 shadow-md shadow-cyan-600/10 hover:shadow-cyan-600/20"
                >
                  Send Request
                </button>
              </form>
            </div>
            <p className="text-[11px] text-slate-500 mt-4">One-click request to faculty replaces direct meeting controls.</p>
          </div>

          <div id="doubt-tracking" className="premium-card lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold text-base">Doubt Request Tracking</h3>
            </div>
            {doubtRequests.length === 0 ? (
              <p className="text-slate-500 text-sm">No faculty requests yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {doubtRequests.map((request) => (
                  <div key={request.id} className="rounded-xl bg-slate-950/40 border border-white/5 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/10 transition-colors duration-250">
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{request.topic}</p>
                      <p className="text-xs text-slate-400 mt-1">{request.preferredSlot} · {request.requestedAtLabel}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap flex-shrink-0">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${getDoubtStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                      {request.status === 'Sent' && (
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => onUpdateDoubtRequestStatus?.(request.id, 'Accepted')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/20 font-semibold transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onUpdateDoubtRequestStatus?.(request.id, 'Rescheduled')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 font-semibold transition-colors"
                          >
                            Request change
                          </button>
                        </div>
                      )}
                      {request.status === 'Accepted' && !calendarAdded[request.id] && (
                        <button
                          onClick={() => handleAddToCalendar(request)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/25 hover:bg-blue-500/35 text-blue-300 border border-blue-500/20 font-semibold transition-colors"
                        >
                          Add to calendar
                        </button>
                      )}
                      {request.status === 'Accepted' && calendarAdded[request.id] && (
                        <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">Added</span>
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
