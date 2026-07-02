import { useState } from 'react'
import { motion } from 'framer-motion'
import { History, Clock, Users, Calendar, TrendingUp, BarChart } from 'lucide-react'
import { format } from 'date-fns'

export interface MeetingRecord {
  id: string
  title: string
  date: Date
  duration: number
  participants: string[]
  host: string
  recording?: string
  summary?: string
  keyPoints?: string[]
  attendanceReport?: Array<{ name: string; status: 'Attended' | 'Absent' }>
  absentMembers?: string[]
  autoSharedWithAbsent?: boolean
}

interface MeetingHistoryProps {
  meetings: MeetingRecord[]
  onPlayRecording?: (recordingUrl: string) => void
}

export default function MeetingHistory({ meetings, onPlayRecording }: MeetingHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'day' | 'week' | 'month'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date')

  const getFilteredMeetings = () => {
    const now = new Date()
    const oneDay = 24 * 60 * 60 * 1000
    const oneWeek = 7 * oneDay
    const oneMonth = 30 * oneDay

    let filtered = meetings

    if (filter === 'day') {
      filtered = meetings.filter((m) => now.getTime() - m.date.getTime() < oneDay)
    } else if (filter === 'week') {
      filtered = meetings.filter((m) => now.getTime() - m.date.getTime() < oneWeek)
    } else if (filter === 'month') {
      filtered = meetings.filter((m) => now.getTime() - m.date.getTime() < oneMonth)
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.getTime() - a.date.getTime()
      }
      return b.duration - a.duration
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getStats = () => {
    const totalMeetings = meetings.length
    const totalDuration = meetings.reduce((acc, m) => acc + m.duration, 0)
    const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0
    const uniqueParticipants = new Set(meetings.flatMap((m) => m.participants)).size

    return {
      totalMeetings,
      totalDuration: formatDuration(totalDuration),
      avgDuration: formatDuration(avgDuration),
      uniqueParticipants,
    }
  }

  const stats = getStats()
  const filteredMeetings = getFilteredMeetings()

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-white">Meeting History</span>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">Total Meetings</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalMeetings}</p>
        </div>

        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Total Duration</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalDuration}</p>
        </div>

        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Avg Duration</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgDuration}</p>
        </div>

        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-slate-400">Participants</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.uniqueParticipants}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'day' | 'week' | 'month')}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
        >
          <option value="all">All Time</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'duration')}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
        >
          <option value="date">Sort by Date</option>
          <option value="duration">Sort by Duration</option>
        </select>
      </div>

      {/* Meetings List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No meeting history</p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{meeting.title}</h4>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(meeting.date, 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(meeting.date, 'hh:mm a')}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {formatDuration(meeting.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meeting.participants.length} participants
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">Host: {meeting.host}</p>

                  {meeting.summary && (
                    <div className="mt-2 text-xs text-cyan-100 bg-cyan-500/10 border border-cyan-400/20 rounded-md p-2">
                      {meeting.summary}
                    </div>
                  )}

                  {meeting.keyPoints && meeting.keyPoints.length > 0 && (
                    <div className="mt-2 text-xs text-slate-300">
                      <span className="text-slate-400">Key points:</span> {meeting.keyPoints.join(' | ')}
                    </div>
                  )}

                  {meeting.attendanceReport && meeting.attendanceReport.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="text-slate-400">Attendance:</span>{' '}
                      <span className="text-emerald-300">
                        {meeting.attendanceReport.filter((item) => item.status === 'Attended').length} attended
                      </span>
                      {' · '}
                      <span className="text-rose-300">
                        {meeting.attendanceReport.filter((item) => item.status === 'Absent').length} absent
                      </span>
                    </div>
                  )}

                  {meeting.autoSharedWithAbsent && (
                    <div className="mt-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
                      Recording and summary auto-shared with absent members.
                    </div>
                  )}

                  {meeting.recording && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onPlayRecording?.(meeting.recording!)}
                      className="mt-2 px-3 py-1 rounded text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
                    >
                      View Recording
                    </motion.button>
                  )}
                </div>

                <div className="ml-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
