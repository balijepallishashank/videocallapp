import { motion } from 'framer-motion'
import { Video, Calendar, Users, Clock, TrendingUp, Phone, History, Sparkles, AlertCircle, Mail, Share2, Search, Zap, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { TeamMember } from '../features/teams/TeamContacts'
import type { ScheduledMeeting } from '../features/calendar/CalendarIntegration'
import type { MeetingRecord } from '../features/meeting/MeetingHistory'

interface HomePageProps {
  teamMembers: TeamMember[]
  scheduledMeetings: ScheduledMeeting[]
  meetingHistory: MeetingRecord[]
  onStartQuickCall: () => void
  onScheduleMeeting: () => void
  onViewContacts: () => void
  onStartCallWithMember: (member: TeamMember) => void
}

export default function HomePage({
  teamMembers,
  scheduledMeetings,
  meetingHistory,
  onStartQuickCall,
  onScheduleMeeting,
  onViewContacts,
  onStartCallWithMember,
}: HomePageProps) {
  const [joinCode, setJoinCode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [codeStatus, setCodeStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle')
  const [codeMessage, setCodeMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [inviteMessage, setInviteMessage] = useState('')
  const [pendingInvites, setPendingInvites] = useState<Array<{id: string, title: string, from: string, time: string}>>([
    { id: '1', title: 'Team Sync Meeting', from: 'Sarah', time: '2 hours ago' }
  ])

  const onlineMembers = teamMembers.filter(m => m.status === 'online')
  const upcomingMeetings = scheduledMeetings.filter(m => m.date > new Date())
  const totalDuration = meetingHistory.reduce((acc, m) => acc + m.duration, 0)
  
  // Join with meeting code handler
  const handleJoinWithCode = async () => {
    if (!joinCode.trim()) {
      setCodeStatus('error')
      setCodeMessage('Please enter a meeting code')
      return
    }

    // Validate code format (should be alphanumeric, 6-10 characters)
    if (!/^[A-Z0-9]{6,10}$/i.test(joinCode.trim())) {
      setCodeStatus('error')
      setCodeMessage('Invalid code format. Use 6-10 characters (letters and numbers)')
      setTimeout(() => {
        setCodeStatus('idle')
        setCodeMessage('')
      }, 3000)
      return
    }

    setIsJoining(true)
    setCodeStatus('validating')
    setCodeMessage('Joining meeting...')

    // Validate code and join immediately
    setTimeout(() => {
      // Code is valid, join meeting directly
      setJoinCode('')
      setCodeStatus('idle')
      setCodeMessage('')
      setIsJoining(false)
      // Trigger the actual join call immediately
      onStartQuickCall()
    }, 500)
  }

  // Handle Enter key in input field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && joinCode.trim()) {
      handleJoinWithCode()
    }
  }

  // Handle pending invite acceptance
  const handleAcceptInvite = (inviteId: string) => {
    setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId))
  }

  // Handle invite team member
  const handleSendInvitation = () => {
    if (!inviteEmail.trim()) {
      setInviteStatus('error')
      setInviteMessage('Please enter an email address')
      setTimeout(() => {
        setInviteStatus('idle')
        setInviteMessage('')
      }, 3000)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setInviteStatus('error')
      setInviteMessage('Please enter a valid email address')
      setTimeout(() => {
        setInviteStatus('idle')
        setInviteMessage('')
      }, 3000)
      return
    }

    setInviteStatus('sending')
    setInviteMessage('Sending invitation...')

    // Simulate sending invitation
    setTimeout(() => {
      setInviteStatus('success')
      setInviteMessage(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      
      setTimeout(() => {
        setInviteStatus('idle')
        setInviteMessage('')
      }, 3000)
    }, 800)
  }
  
  // Handle Enter key for email input
  const handleEmailKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inviteEmail.trim()) {
      handleSendInvitation()
    }
  }
  
  // Get meetings in progress (for demo)
  const liveMeetings = scheduledMeetings.filter(m => {
    const now = new Date()
    return m.date <= now && new Date(m.date.getTime() + m.duration * 60000) > now
  })
  
  // Get next meeting (if any)
  const nextMeeting = upcomingMeetings.length > 0 ? upcomingMeetings[0] : null
  const isNextMeetingSoon = nextMeeting ? (nextMeeting.date.getTime() - new Date().getTime()) < 15 * 60000 : false
  
  // Top collaborators (most frequent in meetings)
  const collaboratorCount = new Map<string, number>()
  meetingHistory.forEach(meeting => {
    meeting.participants.forEach(p => {
      collaboratorCount.set(p, (collaboratorCount.get(p) || 0) + 1)
    })
  })
  const topCollaborators = Array.from(collaboratorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)

  const stats = [
    {
      icon: Users,
      label: 'Team Members',
      value: teamMembers.length,
      subtext: `${onlineMembers.length} online`,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      label: 'Scheduled',
      value: upcomingMeetings.length,
      subtext: 'Upcoming meetings',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: History,
      label: 'Total Meetings',
      value: meetingHistory.length,
      subtext: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      value: meetingHistory.filter(m => 
        new Date().getTime() - m.date.getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
      subtext: 'Recent calls',
      color: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-auto relative">
      {/* Animated gradient background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-blue-100 font-medium">Professional Video Conferencing Platform</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse">
                  VideoCall Pro
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Connect with your team instantly with HD video, screen sharing, and powerful collaboration tools
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-wrap justify-center gap-4 mb-12"
            >
              <motion.button
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartQuickCall}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-2xl shadow-blue-500/50 transition-all overflow-hidden border border-blue-400/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <Video className="w-5 h-5" />
                  <span>Start Quick Call</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onScheduleMeeting}
                className="group px-8 py-4 rounded-xl glass hover:bg-purple-500/20 text-white font-semibold shadow-lg border border-purple-500/30 transition-all backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  <span>Schedule Meeting</span>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewContacts}
                className="group px-8 py-4 rounded-xl glass hover:bg-pink-500/20 text-white font-semibold shadow-lg border border-pink-500/30 transition-all backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span>View Contacts</span>
                </div>
              </motion.button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.08, y: -8 }}
                  className="group relative glass rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all bg-gradient-to-br from-slate-800/40 to-slate-900/40 hover:from-blue-500/10 hover:to-purple-500/10 overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition-all -z-10" />
                  
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:shadow-xl`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text mb-1">{stat.value}</h3>
                    <p className="text-slate-200 font-semibold mb-1">{stat.label}</p>
                    <p className="text-sm text-slate-400">{stat.subtext}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* New Feature Sections */}
      <div className="max-w-7xl mx-auto px-6 pb-12 space-y-8">
        {/* Next Meeting Alert */}
        {isNextMeetingSoon && nextMeeting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-orange-500/20"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-200 mb-1">Meeting Starting Soon!</h3>
                <p className="text-yellow-100 mb-3">{nextMeeting.title} starts in less than 15 minutes</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartQuickCall}
                  className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition-all"
                >
                  Join Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Join with Code + Live Meetings Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Join with Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Join with Code</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    if (codeStatus !== 'idle') {
                      setCodeStatus('idle')
                      setCodeMessage('')
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., ABC123XYZ"
                  maxLength={10}
                  disabled={isJoining}
                  className={`flex-1 px-4 py-3 rounded-lg bg-slate-800/50 border text-white placeholder-slate-400 focus:outline-none transition-all disabled:opacity-50 ${
                    codeStatus === 'error' ? 'border-red-500/50 focus:border-red-500' :
                    codeStatus === 'success' ? 'border-green-500/50' :
                    'border-slate-700 focus:border-blue-500'
                  }`}
                />
                <motion.button
                  whileHover={{ scale: joinCode.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: joinCode.trim() ? 0.95 : 1 }}
                  onClick={handleJoinWithCode}
                  disabled={!joinCode.trim() || isJoining}
                  className={`px-6 py-3 rounded-lg font-semibold shadow-lg transition-all flex items-center gap-2 ${
                    !joinCode.trim() || isJoining
                      ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                  }`}
                >
                  {isJoining ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4"
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4" />
                      <span>Join</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Status Messages */}
              {codeMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    codeStatus === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                    codeStatus === 'success' ? 'bg-green-500/20 border border-green-500/30' :
                    'bg-blue-500/20 border border-blue-500/30'
                  }`}
                >
                  {codeStatus === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  {codeStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                  {codeStatus === 'validating' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="w-5 h-5 text-blue-400" />
                    </motion.div>
                  )}
                  <span className={`text-sm font-medium ${
                    codeStatus === 'error' ? 'text-red-200' :
                    codeStatus === 'success' ? 'text-green-200' :
                    'text-blue-200'
                  }`}>
                    {codeMessage}
                  </span>
                </motion.div>
              )}

              <p className="text-sm text-slate-400">
                💡 <span className="text-slate-300">Meeting codes are 6-10 characters</span>. Ask the host for the code to join instantly.
              </p>
            </div>
          </motion.div>

          {/* Live Meetings */}
          {liveMeetings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass rounded-2xl p-6 border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <h3 className="text-lg font-bold text-white">Live Meetings</h3>
              </div>
              <div className="space-y-2">
                {liveMeetings.slice(0, 3).map((meeting) => (
                  <motion.button
                    key={meeting.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    onClick={() => onStartQuickCall()}
                    className="w-full text-left p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 transition-all group"
                  >
                    <p className="text-white font-medium text-sm truncate">{meeting.title}</p>
                    <p className="text-red-200 text-xs group-hover:text-red-100">Join now →</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Meeting Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Meeting Insights Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">This Week's Insights</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-slate-300">Total Meeting Hours</span>
                <span className="text-2xl font-bold text-purple-400">{Math.floor(totalDuration / 60)}h</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-slate-300">Favorite Collaborator</span>
                <span className="text-sm font-semibold text-blue-400">{topCollaborators[0] || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-slate-300">Most Active Day</span>
                <span className="text-sm font-semibold text-green-400">Tuesday</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <span className="text-slate-300">Avg. Meeting Duration</span>
                <span className="text-sm font-semibold text-orange-400">32 min</span>
              </div>
            </div>
          </motion.div>

          {/* Call History Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Search Call History</h3>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings..."
              className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all mb-4"
            />
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {meetingHistory
                .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 5)
                .map((meeting) => (
                  <div
                    key={meeting.id}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <p className="text-sm font-medium text-white">{meeting.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(meeting.date).toLocaleDateString()} • {meeting.duration} min
                    </p>
                  </div>
                ))}
              {searchQuery && meetingHistory.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">No meetings found</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pending Invites + Refer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Invites */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Pending Invites</h3>
            </div>
            <div className="space-y-3">
              {pendingInvites.length > 0 ? (
                pendingInvites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-white">{invite.title}</p>
                        <p className="text-xs text-slate-400 mt-1">Invited by {invite.from} • {invite.time}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all"
                      >
                        Accept
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No pending invites</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Refer Team Member */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="glass rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <Share2 className="w-5 h-5 text-pink-400" />
              <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">Invite people to join your team and collaborate together</p>
            <div className="space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  if (inviteStatus !== 'idle') {
                    setInviteStatus('idle')
                    setInviteMessage('')
                  }
                }}
                onKeyPress={handleEmailKeyPress}
                placeholder="Enter email address..."
                disabled={inviteStatus === 'sending'}
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all disabled:opacity-50"
              />
              <motion.button
                whileHover={{ scale: inviteEmail.trim() ? 1.05 : 1 }}
                whileTap={{ scale: inviteEmail.trim() ? 0.95 : 1 }}
                onClick={handleSendInvitation}
                disabled={!inviteEmail.trim() || inviteStatus === 'sending'}
                className={`w-full px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  !inviteEmail.trim() || inviteStatus === 'sending'
                    ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                }`}
              >
                {inviteStatus === 'sending' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </motion.button>

              {/* Status Message */}
              {inviteMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    inviteStatus === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-200' :
                    inviteStatus === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-200' :
                    'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                  }`}
                >
                  {inviteStatus === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                  {inviteStatus === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  {inviteStatus === 'sending' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.div>
                  )}
                  <span>{inviteMessage}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Meetings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Upcoming Meetings</h2>
              </div>
              <span className="text-sm text-slate-400">{upcomingMeetings.length} scheduled</span>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No upcoming meetings</p>
                <button
                  onClick={onScheduleMeeting}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Schedule your first meeting
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {upcomingMeetings.slice(0, 5).map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{meeting.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(meeting.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>{meeting.duration} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        {meeting.participants.length}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Meetings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Recent Meetings</h2>
              </div>
              <span className="text-sm text-slate-400">{meetingHistory.length} total</span>
            </div>

            {meetingHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No meeting history yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {meetingHistory.slice(0, 5).map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{meeting.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(meeting.date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>{meeting.duration} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        {meeting.participants.length}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Access Team Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 glass rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Team Members</h2>
            </div>
            <button
              onClick={onViewContacts}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {teamMembers.slice(0, 6).map((member) => (
              <motion.button
                key={member.id}
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartCallWithMember(member)}
                className="relative p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700/50 text-center group"
              >
                <div className="relative inline-block mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
                    {member.avatar}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-800 ${
                    member.status === 'online' ? 'bg-green-500' :
                    member.status === 'busy' ? 'bg-red-500' : 'bg-slate-500'
                  }`} />
                </div>
                <h3 className="text-sm font-medium text-white truncate">{member.name.split(' ')[0]}</h3>
                <p className="text-xs text-slate-500 truncate">{member.role}</p>
                
                {/* Call overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <Phone className="w-6 h-6 text-white" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
