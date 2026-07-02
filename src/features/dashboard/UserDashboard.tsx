import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, CheckSquare, FileText, PlayCircle, Video } from 'lucide-react'
import type { MeetingRecord } from '../meeting/MeetingHistory'
import type { ScheduledMeeting } from '../calendar/CalendarIntegration'

interface UserDashboardProps {
  scheduledMeetings: ScheduledMeeting[]
  meetingHistory: MeetingRecord[]
  onJoinMeeting: () => void
  onViewHistory: () => void
}

export default function UserDashboard({
  scheduledMeetings,
  meetingHistory,
  onJoinMeeting,
  onViewHistory,
}: UserDashboardProps) {
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(null)
  const [activeView, setActiveView] = useState<'recording' | 'summary'>('recording')

  const upcoming = scheduledMeetings
    .filter((m) => m.date > new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const pastWithRecording = meetingHistory.filter((m) => !!m.recording)
  const pastWithSummary = meetingHistory.filter((m) => !!m.summary)

  const openMeetingViewer = (meeting: MeetingRecord, view: 'recording' | 'summary') => {
    setSelectedMeeting(meeting)
    setActiveView(view)
  }

  return (
    <div className="w-full h-screen overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">User Dashboard</h1>
            <p className="text-slate-300 mt-2">Track upcoming meetings, recordings, summaries, and alerts.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onJoinMeeting}
            className="px-6 py-3 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-200 font-semibold"
          >
            Join Meeting
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Upcoming Meetings</div>
            <div className="text-3xl font-bold text-cyan-200">{upcoming.length}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Past Meetings</div>
            <div className="text-3xl font-bold text-violet-200">{meetingHistory.length}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-slate-400 text-sm">Recordings Available</div>
            <div className="text-3xl font-bold text-emerald-200">{pastWithRecording.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <Calendar className="w-5 h-5 text-blue-300" />
              Upcoming Meetings
            </div>
            {upcoming.length === 0 ? (
              <p className="text-slate-400 text-sm">No upcoming meetings.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((meeting) => (
                  <div key={meeting.id} className="rounded-lg bg-slate-800/60 p-3">
                    <p className="text-white font-medium">{meeting.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{meeting.date.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <Bell className="w-5 h-5 text-amber-300" />
              Notifications
            </div>
            <div className="space-y-2 text-sm">
              <div className="rounded-lg bg-slate-800/60 p-3 text-slate-200">Meeting invitation received</div>
              <div className="rounded-lg bg-slate-800/60 p-3 text-slate-200">Meeting starting soon</div>
              <div className="rounded-lg bg-slate-800/60 p-3 text-slate-200">Missed meeting alert with summary</div>
            </div>
          </div>

          <button
            onClick={() => {
              const latest = pastWithRecording[0]
              if (latest) {
                openMeetingViewer(latest, 'recording')
              } else {
                onViewHistory()
              }
            }}
            className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all"
          >
            <PlayCircle className="w-5 h-5 text-violet-300 mb-3" />
            <h3 className="text-white font-semibold">View Recordings</h3>
            <p className="text-slate-400 text-sm mt-1">Open past meetings and play recordings.</p>
          </button>

          <button
            onClick={() => {
              const latest = pastWithSummary[0]
              if (latest) {
                openMeetingViewer(latest, 'summary')
              } else {
                onViewHistory()
              }
            }}
            className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all"
          >
            <FileText className="w-5 h-5 text-emerald-300 mb-3" />
            <h3 className="text-white font-semibold">Meeting Summaries</h3>
            <p className="text-slate-400 text-sm mt-1">Read AI summaries and action items.</p>
          </button>

          <button onClick={onJoinMeeting} className="glass rounded-xl p-5 text-left hover:bg-white/10 transition-all lg:col-span-2">
            <Video className="w-5 h-5 text-cyan-300 mb-3" />
            <h3 className="text-white font-semibold">Join Next Meeting</h3>
            <p className="text-slate-400 text-sm mt-1">Users can only join meetings and view shared outputs.</p>
          </button>
        </div>

        <div className="glass rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Past Meetings: Recordings & Summaries</h3>
          {meetingHistory.length === 0 ? (
            <p className="text-slate-400 text-sm">No past meetings available yet.</p>
          ) : (
            <div className="space-y-3">
              {meetingHistory.slice().reverse().map((meeting) => (
                <div key={meeting.id} className="rounded-lg bg-slate-800/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-medium">{meeting.title}</p>
                      <p className="text-slate-400 text-xs mt-1">{meeting.date.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!meeting.recording}
                        onClick={() => openMeetingViewer(meeting, 'recording')}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-violet-500/20 border border-violet-400/30 text-violet-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        View Recording
                      </button>
                      <button
                        disabled={!meeting.summary}
                        onClick={() => openMeetingViewer(meeting, 'summary')}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        View Summary
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-cyan-100 text-sm flex items-start gap-2">
          <CheckSquare className="w-5 h-5 mt-0.5" />
          Invitation control is Admin-only. Participants cannot invite others.
        </div>
      </div>

      <AnimatePresence>
        {selectedMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMeeting(null)}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{selectedMeeting.title}</h3>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="px-3 py-1 rounded-md text-xs bg-slate-700/70 text-slate-200"
                >
                  Close
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveView('recording')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                    activeView === 'recording' ? 'bg-violet-500/30 text-violet-100' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  Recording
                </button>
                <button
                  onClick={() => setActiveView('summary')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                    activeView === 'summary' ? 'bg-emerald-500/30 text-emerald-100' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  Summary
                </button>
              </div>

              {activeView === 'recording' ? (
                selectedMeeting.recording ? (
                  <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4 text-violet-100 text-sm">
                    Recording available: {selectedMeeting.recording}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-600/40 bg-slate-800/60 p-4 text-slate-300 text-sm">
                    Recording is not available for this meeting.
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
                    {selectedMeeting.summary || 'Summary is not available for this meeting.'}
                  </div>
                  {selectedMeeting.keyPoints && selectedMeeting.keyPoints.length > 0 && (
                    <div className="rounded-xl border border-slate-600/40 bg-slate-800/60 p-4">
                      <p className="text-slate-200 text-sm font-semibold mb-2">Key Points</p>
                      <ul className="text-slate-300 text-sm list-disc list-inside space-y-1">
                        {selectedMeeting.keyPoints.map((point, index) => (
                          <li key={`${selectedMeeting.id}-point-${index}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
