import { useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, BookOpen, Play, Pencil } from 'lucide-react'
import { subscribeToScheduledMeetings, subscribeToClasses, startLiveMeeting, type ScheduledMeeting } from '../../services/db'
import ScheduledMeetingForm from '../scheduling/components/ScheduledMeetingForm'

interface OutletContext {
  currentUser: any
  isFaculty: boolean
  addToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

// Palette for classes
const CLASS_COLORS = [
  'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-300',
  'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-300',
  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-300',
  'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-300',
  'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-300',
  'from-fuchsia-500/20 to-fuchsia-600/10 border-fuchsia-500/30 text-fuchsia-300',
  'from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-300',
  'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-300',
]

const DOT_COLORS = [
  'bg-cyan-400', 'bg-violet-400', 'bg-emerald-400', 'bg-rose-400',
  'bg-amber-400', 'bg-fuchsia-400', 'bg-sky-400', 'bg-teal-400',
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function CalendarView() {
  const { currentUser, isFaculty, addToast } = useOutletContext<OutletContext>()
  const [scheduledMeetings, setScheduledMeetings] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [classesList, setClassesList] = useState<any[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null)

  useEffect(() => {
    if (!currentUser) return
    const unsubMeetings = subscribeToScheduledMeetings((list) => setScheduledMeetings(list))
    const unsubClasses = subscribeToClasses(currentUser.role, currentUser.id, (list) => setClasses(list))
    return () => {
      unsubMeetings()
      unsubClasses()
    }
  }, [currentUser])

  // Faculty: also load their classes list for the edit form
  useEffect(() => {
    if (!currentUser || !isFaculty) return
    return subscribeToClasses('faculty', currentUser.id, setClassesList)
  }, [currentUser, isFaculty])

  // Map classId → color index
  const classColorMap = useMemo(() => {
    const map: Record<string, number> = {}
    classes.forEach((cls, i) => {
      map[cls.id] = i % CLASS_COLORS.length
    })
    return map
  }, [classes])

  // Filter meetings by enrolled classes (students) or own classes (faculty)
  const relevantMeetings = useMemo(() => {
    const classIds = new Set(classes.map((c) => c.id))
    return scheduledMeetings.filter((m) => {
      if (isFaculty) return classIds.has(m.classId)
      return classIds.has(m.classId)
    })
  }, [scheduledMeetings, classes, isFaculty])

  // ── Month View helpers ──────────────────────────────────────
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays: (Date | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  const getMeetingsForDay = (date: Date | null) => {
    if (!date) return []
    return relevantMeetings.filter((m) => {
      if (!m.scheduledDate) return false
      const mDate = new Date(m.scheduledDate)
      return mDate.getFullYear() === date.getFullYear() &&
        mDate.getMonth() === date.getMonth() &&
        mDate.getDate() === date.getDate()
    })
  }

  // ── Week View helpers ───────────────────────────────────────
  const getWeekStart = (d: Date) => {
    const start = new Date(d)
    start.setDate(d.getDate() - d.getDay())
    return start
  }
  const weekStart = getWeekStart(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const navigate = (dir: -1 | 1) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      if (view === 'month') {
        next.setMonth(prev.getMonth() + dir)
      } else {
        next.setDate(prev.getDate() + dir * 7)
      }
      return next
    })
  }

  const handleStartNow = async (meeting: any) => {
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
    } catch {
      addToast('Failed to start meeting.', 'error')
    }
  }

  const handleEditMeeting = (meeting: ScheduledMeeting) => {
    setEditingMeeting(meeting)
  }

  const selectedDayMeetings = selectedDay ? getMeetingsForDay(selectedDay) : []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Calendar</h1>
          <p className="mt-1 text-slate-400">View all scheduled class meetings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 text-sm font-semibold transition ${view === 'month' ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 text-sm font-semibold transition ${view === 'week' ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="text-lg font-bold text-white">
            {view === 'month'
              ? `${MONTHS[month]} ${year}`
              : `Week of ${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`
            }
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{relevantMeetings.length} scheduled meetings</div>
        </div>
        <button onClick={() => navigate(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Today button */}
      <div className="flex justify-end">
        <button
          onClick={() => setCurrentDate(new Date())}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
        >
          Today
        </button>
      </div>

      {view === 'month' ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />

              const dayMeetings = getMeetingsForDay(date)
              const isToday = date.getTime() === today.getTime()
              const isSelected = selectedDay?.getTime() === date.getTime()
              const isPast = date < today

              return (
                <motion.button
                  key={date.toISOString()}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={`relative min-h-[70px] sm:min-h-[90px] rounded-2xl p-2 text-left transition border ${
                    isSelected
                      ? 'border-cyan-500/50 bg-cyan-500/10'
                      : isToday
                      ? 'border-cyan-400/30 bg-cyan-500/5'
                      : 'border-transparent hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <span className={`block text-xs font-bold mb-1 ${
                    isToday ? 'text-cyan-400' : isPast ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    {date.getDate()}
                  </span>

                  {/* Meeting dots / pills */}
                  <div className="space-y-0.5">
                    {dayMeetings.slice(0, 3).map((m) => {
                      const colorIdx = classColorMap[m.classId] ?? 0
                      return (
                        <div key={m.id} className={`h-1.5 rounded-full ${DOT_COLORS[colorIdx]}`} />
                      )
                    })}
                    {dayMeetings.length > 3 && (
                      <div className="text-[9px] text-slate-500 font-semibold">+{dayMeetings.length - 3} more</div>
                    )}
                  </div>

                  {isToday && (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-white/10">
            {weekDays.map((date) => {
              const isToday = date.getTime() === today.getTime()
              return (
                <div
                  key={date.toISOString()}
                  className={`p-3 text-center border-r border-white/5 last:border-0 ${isToday ? 'bg-cyan-500/10' : ''}`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{DAYS[date.getDay()]}</div>
                  <div className={`text-lg font-black mt-0.5 ${isToday ? 'text-cyan-400' : 'text-white'}`}>{date.getDate()}</div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-7 min-h-[300px]">
            {weekDays.map((date) => {
              const dayMeetings = getMeetingsForDay(date)
              const isToday = date.getTime() === today.getTime()
              return (
                <div
                  key={date.toISOString()}
                  className={`p-2 border-r border-white/5 last:border-0 space-y-1 ${isToday ? 'bg-cyan-500/5' : ''}`}
                >
                  {dayMeetings.map((m) => {
                    const colorIdx = classColorMap[m.classId] ?? 0
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border bg-gradient-to-br p-2 text-[11px] ${CLASS_COLORS[colorIdx]}`}
                      >
                        <div className="font-bold leading-tight line-clamp-2">{m.title}</div>
                        {m.startTime && (
                          <div className="mt-1 flex items-center gap-1 opacity-70">
                            <Clock className="w-2.5 h-2.5" />
                            {m.startTime}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Selected Day Panel */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              {selectedDay.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
          </div>

          {selectedDayMeetings.length === 0 ? (
            <p className="text-slate-500 text-sm">No meetings scheduled for this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedDayMeetings.map((m) => {
                const colorIdx = classColorMap[m.classId] ?? 0
                const isOwner = isFaculty && m.facultyId === currentUser?.id
                return (
                  <motion.div
                    key={m.id}
                    whileHover={{ x: 4 }}
                    className={`rounded-2xl border bg-gradient-to-br p-4 flex items-start justify-between gap-4 ${CLASS_COLORS[colorIdx]}`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-white text-sm">{m.title}</div>
                      <div className="flex items-center gap-3 text-xs opacity-70 flex-wrap">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {m.className || 'Class'}</span>
                        {m.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.startTime}</span>}
                        {m.duration && <span>{m.duration} min</span>}
                      </div>
                      {m.description && <div className="text-[11px] opacity-60 line-clamp-1">{m.description}</div>}
                      {!isFaculty && m.facultyName && (
                        <div className="text-[11px] opacity-60">By {m.facultyName}</div>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex flex-shrink-0 gap-2">
                        <button
                          id={`cal-edit-${m.id}`}
                          onClick={() => handleEditMeeting(m as ScheduledMeeting)}
                          className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition"
                          title="Edit meeting"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          id={`cal-start-${m.id}`}
                          onClick={() => handleStartNow(m)}
                          className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition"
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      {classes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Classes</div>
          <div className="flex flex-wrap gap-3">
            {classes.map((cls, i) => (
              <div key={cls.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
                <span className="text-xs text-slate-400">{cls.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit meeting form — faculty only */}
      <AnimatePresence>
        {editingMeeting && isFaculty && currentUser && (
          <ScheduledMeetingForm
            editingMeeting={editingMeeting}
            classesList={classesList}
            currentUser={currentUser}
            onSave={() => setEditingMeeting(null)}
            onClose={() => setEditingMeeting(null)}
            addToast={addToast}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
