import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clapperboard, ClipboardCheck, Video } from 'lucide-react'
import { subscribeToClasses, subscribeToMeetings, subscribeToScheduledMeetings, subscribeToStudentAttendance } from '../../services/db'
import type { MeetingRecord } from '../../features/meeting/MeetingHistory'

interface OutletContext {
  currentUser: any
  liveInvite: any
  joinLiveInvite: (invite: any) => void
}

export default function StudentDashboardView() {
  const { currentUser, liveInvite, joinLiveInvite } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const [classesCount, setClassesCount] = useState(0)
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [upcomingCount, setUpcomingCount] = useState(0)
  const [attendanceRate, setAttendanceRate] = useState<string>('100%')

  useEffect(() => {
    if (!currentUser || !currentUser.id) return

    const unsubClasses = subscribeToClasses('student', currentUser.id, (list) => setClassesCount(list.length))
    const unsubMeetings = subscribeToMeetings((list) => setMeetings(list.sort((a, b) => b.date.getTime() - a.date.getTime())))
    const unsubScheduled = subscribeToScheduledMeetings((list) => {
      const filtered = list.filter((meeting: any) => meeting.invitedStudents?.includes(currentUser.id) || meeting.classId)
      setUpcomingCount(filtered.length)
    })
    const unsubAttendance = subscribeToStudentAttendance(currentUser.id, (records) => {
      if (records.length === 0) {
        setAttendanceRate('100%')
        return
      }
      const presentOrLate = records.filter((r) => r.status === 'Present' || r.status === 'Late').length
      const pct = Math.round((presentOrLate / records.length) * 100)
      setAttendanceRate(`${pct}%`)
    })

    return () => {
      unsubClasses()
      unsubMeetings()
      unsubScheduled()
      unsubAttendance()
    }
  }, [currentUser])

  const recordedCount = meetings.filter((meeting) => Boolean(meeting.recording)).length

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Student Dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Welcome back, <span className="text-violet-300 font-semibold">{currentUser?.name}</span>. Your dashboard now opens into classes, meetings, and recordings.
          </p>
        </div>
        <button onClick={() => navigate('/student/classes')} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950">
          Open classes
        </button>
      </section>

      {liveInvite && (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Live session active</div>
              <div className="mt-1 text-lg font-bold text-white">{liveInvite.title}</div>
              <div className="text-sm text-slate-300">{liveInvite.sectionName} · {liveInvite.host}</div>
            </div>
            <button onClick={() => joinLiveInvite(liveInvite)} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950">
              Join live class
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Classes', value: classesCount, icon: <BookOpen className="h-4 w-4 text-cyan-300" /> },
          { label: 'Upcoming', value: upcomingCount, icon: <Video className="h-4 w-4 text-violet-300" /> },
          { label: 'Attendance', value: attendanceRate, icon: <ClipboardCheck className="h-4 w-4 text-emerald-300" /> },
          { label: 'Recordings', value: recordedCount, icon: <Clapperboard className="h-4 w-4 text-fuchsia-300" /> },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="text-xs uppercase tracking-wider text-slate-500">{item.label}</div>
              <div className="rounded-xl bg-white/5 p-2">{item.icon}</div>
            </div>
            <div className="mt-4 text-3xl font-black text-white">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent meetings</h2>
              <p className="text-sm text-slate-400">Your latest classroom sessions.</p>
            </div>
            <button onClick={() => navigate('/student/meetings')} className="text-sm font-semibold text-cyan-300">View all</button>
          </div>

          <div className="mt-4 space-y-3">
            {meetings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center text-slate-400">No meetings recorded yet.</div>
            ) : (
              meetings.slice(0, 4).map((meeting) => (
                <div key={meeting.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="font-semibold text-white">{meeting.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{meeting.summary || 'Meeting record'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Class shortcuts</h2>
            <div className="mt-4 grid gap-3">
              <button onClick={() => navigate('/student/classes')} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left">
                <div className="font-semibold text-white">Open My Classes</div>
                <div className="mt-1 text-sm text-slate-400">Jump back into your enrolled classes.</div>
              </button>
              <button onClick={() => navigate('/student/meeting-history')} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left">
                <div className="font-semibold text-white">Review meeting history</div>
                <div className="mt-1 text-sm text-slate-400">Check past class sessions and recordings.</div>
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/student/classes')}
            className="w-full rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 p-6 text-left"
          >
            <div className="text-xs uppercase tracking-wider text-slate-400">Shortcut</div>
            <div className="mt-1 text-xl font-black text-white">Go to your classes</div>
            <div className="mt-2 text-sm text-slate-300">Open the workspace that now drives your class experience.</div>
          </motion.button>
        </div>
      </section>
    </div>
  )
}
