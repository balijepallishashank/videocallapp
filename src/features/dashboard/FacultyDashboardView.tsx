import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ClipboardList, Layers, Plus, Video } from 'lucide-react'
import { subscribeToClasses, subscribeToLiveMeetings, subscribeToMeetings, subscribeToScheduledMeetings } from '../../services/db'
import type { LiveMeetingInvite } from '../../services/db'
import type { MeetingRecord } from '../../features/meeting/MeetingHistory'

interface OutletContext {
  currentUser: any
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

export default function FacultyDashboardView() {
  const { currentUser } = useOutletContext<OutletContext>()
  const navigate = useNavigate()
  const [classesCount, setClassesCount] = useState(0)
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])
  const [scheduledCount, setScheduledCount] = useState(0)
  const [liveInvite, setLiveInvite] = useState<LiveMeetingInvite | null>(null)

  useEffect(() => {
    if (!currentUser || !currentUser.id) return

    const unsubClasses = subscribeToClasses('faculty', currentUser.id, (list) => setClassesCount(list.length))
    const unsubMeetings = subscribeToMeetings((list) => setMeetings(list.sort((a, b) => b.date.getTime() - a.date.getTime())))
    const unsubScheduled = subscribeToScheduledMeetings((list) => setScheduledCount(list.filter((meeting: any) => meeting.facultyId === currentUser.id).length))
    const unsubLive = subscribeToLiveMeetings((list) => setLiveInvite(list.find((meeting) => meeting.facultyId === currentUser.id) || null))

    return () => {
      unsubClasses()
      unsubMeetings()
      unsubScheduled()
      unsubLive()
    }
  }, [currentUser])

  const recordingCount = meetings.filter((meeting) => Boolean(meeting.recording)).length
  const liveCount = liveInvite ? 1 : 0

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Faculty Dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Welcome back, <span className="text-cyan-300 font-semibold">{currentUser?.name}</span>. Your workspace now starts with class cards instead of the old hierarchy tree.
          </p>
        </div>
        <button onClick={() => navigate('/faculty/classes')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950">
          <Plus className="h-4 w-4" />
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
            <button onClick={() => navigate(`/faculty/class/${liveInvite.classId}?join=true`)} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950">
              Join active class session
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Classes', value: classesCount, icon: <BookOpen className="h-4 w-4 text-cyan-300" /> },
          { label: 'Scheduled', value: scheduledCount, icon: <ClipboardList className="h-4 w-4 text-fuchsia-300" /> },
          { label: 'Live', value: liveCount, icon: <Video className="h-4 w-4 text-emerald-300" /> },
          { label: 'Recordings', value: recordingCount, icon: <Layers className="h-4 w-4 text-rose-300" /> },
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
              <p className="text-sm text-slate-400">The latest class sessions collected from your workspace.</p>
            </div>
            <button onClick={() => navigate('/faculty/meetings')} className="text-sm font-semibold text-cyan-300">View all</button>
          </div>

          <div className="mt-4 space-y-3">
            {meetings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center text-slate-400">No meetings recorded yet.</div>
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
              <button onClick={() => navigate('/faculty/classes')} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left">
                <div className="font-semibold text-white">Open My Classes</div>
                <div className="mt-1 text-sm text-slate-400">Manage every class from one workspace.</div>
              </button>
              <button onClick={() => navigate('/faculty/scheduled-meetings')} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-left">
                <div className="font-semibold text-white">Review scheduled meetings</div>
                <div className="mt-1 text-sm text-slate-400">Check the next sessions at a glance.</div>
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/faculty/classes')}
            className="w-full rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 p-6 text-left"
          >
            <div className="text-xs uppercase tracking-wider text-slate-400">Shortcut</div>
            <div className="mt-1 text-xl font-black text-white">Open the class hub</div>
            <div className="mt-2 text-sm text-slate-300">Manage meetings, materials, and members from one place.</div>
          </motion.button>
        </div>
      </section>
    </div>
  )
}
