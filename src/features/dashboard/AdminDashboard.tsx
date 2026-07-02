import { motion } from 'framer-motion'
import { Bell, Calendar, CheckCircle2, FileText, Mic, Users, Video } from 'lucide-react'
import type { MeetingRecord } from '../meeting/MeetingHistory'
import type { ScheduledMeeting } from '../calendar/CalendarIntegration'
import type { TeamMember } from '../teams/TeamContacts'

interface AdminDashboardProps {
  teamMembers: TeamMember[]
  scheduledMeetings: ScheduledMeeting[]
  meetingHistory: MeetingRecord[]
  onCreateMeeting: () => void
  onManageContacts: () => void
  onOpenAttendance: () => void
  onOpenRecordings: () => void
  onSendSummary: () => void
  absentFromPrevious: string[]
}

export default function AdminDashboard({
  teamMembers,
  scheduledMeetings,
  meetingHistory,
  onCreateMeeting,
  onManageContacts,
  onOpenAttendance,
  onOpenRecordings,
  onSendSummary,
  absentFromPrevious,
}: AdminDashboardProps) {
  const upcomingCount = scheduledMeetings.filter((m) => m.date > new Date()).length
  const recordingsCount = meetingHistory.filter((m) => !!m.recording).length
  const recentAbsence = meetingHistory
    .flatMap((m) => m.absentMembers || [])
    .reduce((acc, name) => {
      acc.set(name, (acc.get(name) || 0) + 1)
      return acc
    }, new Map<string, number>())

  return (
    <div className="w-full h-screen overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-300 mt-2">Control meetings, invitations, attendance, and post-meeting follow-up.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateMeeting}
            className="px-6 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-semibold"
          >
            Create Meeting
          </motion.button>
        </div>

        {absentFromPrevious.length > 0 && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-200 font-semibold">
              <Bell className="w-5 h-5" />
              These members missed the previous meeting
            </div>
            <p className="text-amber-100 text-sm mt-2">{absentFromPrevious.join(', ')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Contacts</div>
            <div className="text-3xl font-bold text-cyan-200">{teamMembers.length}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Upcoming Meetings</div>
            <div className="text-3xl font-bold text-blue-200">{upcomingCount}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Recordings</div>
            <div className="text-3xl font-bold text-purple-200">{recordingsCount}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Frequently Absent</div>
            <div className="text-3xl font-bold text-rose-200">{recentAbsence.size}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={onManageContacts} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <Users className="w-5 h-5 text-cyan-300 mb-3" />
            <h3 className="text-white font-semibold">Manage Contacts</h3>
            <p className="text-slate-400 text-sm mt-1">Add, update, and organize participants.</p>
          </button>

          <button onClick={onOpenAttendance} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 mb-3" />
            <h3 className="text-white font-semibold">Attendance Reports</h3>
            <p className="text-slate-400 text-sm mt-1">View attended and absent members by meeting.</p>
          </button>

          <button onClick={onOpenRecordings} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <Video className="w-5 h-5 text-violet-300 mb-3" />
            <h3 className="text-white font-semibold">Meeting Recordings</h3>
            <p className="text-slate-400 text-sm mt-1">Access recordings and summaries.</p>
          </button>

          <button onClick={onCreateMeeting} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <Calendar className="w-5 h-5 text-blue-300 mb-3" />
            <h3 className="text-white font-semibold">Select Participants</h3>
            <p className="text-slate-400 text-sm mt-1">Use drag and drop or checkbox selection.</p>
          </button>

          <button onClick={onSendSummary} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <FileText className="w-5 h-5 text-amber-300 mb-3" />
            <h3 className="text-white font-semibold">Send Meeting Summaries</h3>
            <p className="text-slate-400 text-sm mt-1">Share summaries and key discussion points.</p>
          </button>

          <button onClick={onCreateMeeting} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all">
            <Mic className="w-5 h-5 text-rose-300 mb-3" />
            <h3 className="text-white font-semibold">Record New Meeting</h3>
            <p className="text-slate-400 text-sm mt-1">Recordings are created automatically on call end.</p>
          </button>
        </div>
      </div>
    </div>
  )
}
