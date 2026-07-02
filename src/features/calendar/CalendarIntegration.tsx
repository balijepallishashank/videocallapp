import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Trash2, Bell, X, Check, Zap, Users, Copy, AlertCircle } from 'lucide-react'
import { format, addDays, set } from 'date-fns'

export interface ScheduledMeeting {
  id: string
  title: string
  date: Date
  duration: number
  participants: string[]
  recurring: 'none' | 'daily' | 'weekly' | 'monthly'
  reminder: number // minutes before
  meetingLink?: string
}

interface CalendarIntegrationProps {
  meetings: ScheduledMeeting[]
  onSchedule: (meeting: Omit<ScheduledMeeting, 'id'>) => void
  onEdit: (id: string, meeting: Partial<ScheduledMeeting>) => void
  onDelete: (id: string) => void
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  teamMembers?: Array<{ id: string; name: string; email: string; status: string }>
}

export default function CalendarIntegration({
  meetings,
  onSchedule,
  onDelete,
  onToast,
}: CalendarIntegrationProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    date: string
    duration: number
    participants: string[]
    participantEmail: string
    recurring: ScheduledMeeting['recurring']
    reminder: number
  }>({
    title: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration: 60,
    participants: [],
    participantEmail: '',
    recurring: 'none',
    reminder: 15,
  })
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [isScheduling, setIsScheduling] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  
  // Generate meeting link
  const generateMeetingLink = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `https://videopro.app/join/${code}`
  }

  // Real-time validation
  const isTitleValid = formData.title.trim().length > 2
  const isDateValid = new Date(formData.date) > new Date()
  const isFormValid = isTitleValid && isDateValid

  // Check if time slot is available (no conflicts)
  const isTimeSlotAvailable = useMemo(() => {
    const newMeetingStart = new Date(formData.date)
    const newMeetingEnd = new Date(newMeetingStart.getTime() + formData.duration * 60000)

    return !meetings.some((meeting) => {
      const meetingEnd = new Date(meeting.date.getTime() + meeting.duration * 60000)
      return (
        (newMeetingStart < meetingEnd && newMeetingEnd > meeting.date)
      )
    })
  }, [formData.date, formData.duration, meetings])

  // Get suggested quick times
  const getQuickTimes = () => {
    const now = new Date()
    const times = []

    // Today at 3 PM
    const todayAt3 = set(now, { hours: 15, minutes: 0, seconds: 0, milliseconds: 0 })
    if (todayAt3 > now) {
      times.push({ label: 'Today at 3:00 PM', date: todayAt3 })
    }

    // Today at 5 PM
    const todayAt5 = set(now, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 })
    if (todayAt5 > now) {
      times.push({ label: 'Today at 5:00 PM', date: todayAt5 })
    }

    // Tomorrow at 10 AM
    const tomorrowAt10 = set(addDays(now, 1), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 })
    times.push({ label: 'Tomorrow at 10:00 AM', date: tomorrowAt10 })

    // Next Monday at 10 AM
    const nextMonday = new Date(now)
    const daysUntilMonday = (1 - nextMonday.getDay() + 7) % 7 || 7
    const mondayAt10 = set(addDays(nextMonday, daysUntilMonday), { hours: 10, minutes: 0, seconds: 0, milliseconds: 0 })
    times.push({ label: 'Next Monday at 10:00 AM', date: mondayAt10 })

    return times
  }

  const handleSchedule = async () => {
    if (!isTitleValid) {
      onToast('Meeting title must be at least 3 characters', 'error')
      return
    }

    if (!isDateValid) {
      onToast('Meeting date must be in the future', 'error')
      return
    }

    setIsScheduling(true)

    // Simulate real-time scheduling with live feedback
    setTimeout(() => {
      const meetingLink = generateMeetingLink()
      const meeting: Omit<ScheduledMeeting, 'id'> = {
        title: formData.title,
        date: new Date(formData.date),
        duration: formData.duration,
        participants: selectedParticipants,
        recurring: formData.recurring,
        reminder: formData.reminder,
        meetingLink,
      }

      onSchedule(meeting)
      
      // Reset form
      setShowScheduleForm(false)
      setFormData({
        title: '',
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duration: 60,
        participants: [],
        participantEmail: '',
        recurring: 'none',
        reminder: 15,
      })
      setSelectedParticipants([])
      setIsScheduling(false)

      onToast('✅ Meeting scheduled successfully! Link copied.', 'success')
    }, 800)
  }

  const handleAddParticipant = (email: string) => {
    if (email && !selectedParticipants.includes(email)) {
      setSelectedParticipants([...selectedParticipants, email])
      setFormData({ ...formData, participantEmail: '' })
    }
  }

  const handleRemoveParticipant = (email: string) => {
    setSelectedParticipants(selectedParticipants.filter(p => p !== email))
  }

  const handleQuickTime = (date: Date) => {
    setFormData({
      ...formData,
      date: format(date, "yyyy-MM-dd'T'HH:mm")
    })
  }

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 2000)
    onToast('Meeting link copied!', 'success')
  }

  const exportToGoogleCalendar = (meeting: ScheduledMeeting) => {
    const startDate = format(meeting.date, "yyyyMMdd'T'HHmmss")
    const durationMs = meeting.duration * 60000
    const endDate = format(new Date(meeting.date.getTime() + durationMs), "yyyyMMdd'T'HHmmss")
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      meeting.title
    )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
      `Meeting ID: ${meeting.id}\nParticipants: ${meeting.participants.join(', ')}\nLink: ${meeting.meetingLink || 'N/A'}`
    )}`
    window.open(url, '_blank')
    onToast('Opening Google Calendar...', 'info')
  }

  const getUpcomingMeetings = () => {
    const now = new Date()
    return meetings
      .filter((m) => m.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20"
          >
            <Calendar className="w-5 h-5 text-blue-400" />
          </motion.div>
          <div>
            <h3 className="font-bold text-white text-lg">Scheduled Meetings</h3>
            <p className="text-xs text-slate-400">{getUpcomingMeetings().length} upcoming</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowScheduleForm(!showScheduleForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 text-blue-300 font-semibold transition-all border border-blue-400/30 shadow-lg"
        >
          <Zap className="w-4 h-4" />
          Quick Schedule
        </motion.button>
      </div>

      {/* Schedule Form - Real-time experience */}
      <AnimatePresence>
        {showScheduleForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-blue-400/20 shadow-2xl space-y-5"
          >
            {/* Title Input with Real-time Validation */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Meeting Title</label>
              <motion.div className="relative">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Team Sync, Client Review, Project Planning..."
                  className={`w-full px-4 py-3 rounded-xl bg-slate-700/50 border-2 transition-all placeholder-slate-500 text-white font-medium ${
                    isTitleValid ? 'border-green-500/50 focus:border-green-500' : 'border-slate-600 focus:border-blue-500'
                  } focus:outline-none`}
                />
                {isTitleValid && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <Check className="w-5 h-5 text-green-400" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Quick Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Quick Schedule</label>
              <div className="grid grid-cols-2 gap-2">
                {getQuickTimes().map((time, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickTime(time.date)}
                    className="px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 text-xs text-slate-300 font-medium border border-slate-600/50 hover:border-blue-500/50 transition-all"
                  >
                    {time.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Date, Duration, and Reminder in 3 Columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl bg-slate-700/50 border-2 ${
                    isDateValid ? 'border-green-500/50' : 'border-red-500/50'
                  } text-white text-sm focus:outline-none focus:border-blue-500`}
                />
                {!isDateValid && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" /> Must be in future
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-700/50 border-2 border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Reminder</label>
                <select
                  value={formData.reminder}
                  onChange={(e) => setFormData({ ...formData, reminder: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-700/50 border-2 border-slate-600 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
            </div>

            {/* Time Slot Availability Indicator */}
            <motion.div
              className={`p-3 rounded-xl border-2 flex items-center gap-2 ${
                isTimeSlotAvailable
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
              }`}
            >
              {isTimeSlotAvailable ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Time slot available</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Time overlaps with another meeting</span>
                </>
              )}
            </motion.div>

            {/* Participants Section */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Invite Participants</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.participantEmail}
                  onChange={(e) => setFormData({ ...formData, participantEmail: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddParticipant(formData.participantEmail)
                    }
                  }}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddParticipant(formData.participantEmail)}
                  className="px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 font-medium border-2 border-slate-600 hover:border-blue-500/50 transition-all"
                >
                  Add
                </motion.button>
              </div>

              {/* Selected Participants */}
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedParticipants.map((email) => (
                    <motion.div
                      key={email}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-300 text-xs font-medium flex items-center gap-2"
                    >
                      {email}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveParticipant(email)}
                        className="ml-1 hover:bg-blue-500/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recurring Option */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Repeat</label>
              <select
                value={formData.recurring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurring: e.target.value as ScheduledMeeting['recurring'],
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-700/50 border-2 border-slate-600 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="none">Don't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!isFormValid || !isTimeSlotAvailable || isScheduling}
                onClick={handleSchedule}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed disabled:opacity-50 text-white font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Meeting
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowScheduleForm(false)
                  setFormData({
                    title: '',
                    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                    duration: 60,
                    participants: [],
                    participantEmail: '',
                    recurring: 'none',
                    reminder: 15,
                  })
                  setSelectedParticipants([])
                }}
                className="px-6 py-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-semibold border-2 border-slate-600 hover:border-slate-500 transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Meetings List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {getUpcomingMeetings().length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-slate-400"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center"
            >
              <Calendar className="w-8 h-8 opacity-50" />
            </motion.div>
            <p className="font-medium">No upcoming meetings</p>
            <p className="text-xs mt-1">Create one to get started!</p>
          </motion.div>
        ) : (
          getUpcomingMeetings().map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4 }}
              className="p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/30 hover:from-slate-800/70 hover:to-slate-900/50 border border-slate-700/50 hover:border-blue-500/30 transition-all shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-white">{meeting.title}</h4>
                    {meeting.recurring !== 'none' && (
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 font-semibold">
                        {meeting.recurring}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{format(meeting.date, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>{format(meeting.date, 'h:mm a')} • {meeting.duration} min</span>
                    </div>
                  </div>

                  {meeting.reminder > 0 && (
                    <div className="flex items-center gap-2 text-xs text-orange-400 mb-2">
                      <Bell className="w-3 h-3" />
                      Reminder {meeting.reminder}m before
                    </div>
                  )}

                  {meeting.participants.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Users className="w-4 h-4 text-blue-400" />
                      {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {meeting.meetingLink && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      onClick={() => copyMeetingLink(meeting.meetingLink!)}
                      className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-300 text-xs font-semibold border border-green-500/30 hover:border-green-500/50 transition-all"
                    >
                      {copiedLink === meeting.meetingLink ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Link
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => exportToGoogleCalendar(meeting)}
                    className="p-2.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all border border-green-500/30"
                    title="Add to Google Calendar"
                  >
                    <Calendar className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(meeting.id)}
                    className="p-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all border border-red-500/30"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
