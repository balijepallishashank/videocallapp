import { motion } from 'framer-motion'
import { Calendar, Clock, Pencil, Play, Trash2, CheckCircle2, XCircle, Radio } from 'lucide-react'
import {
  getMeetingStatus,
  type MeetingStatus,
} from '../utils/meetingDateValidation'
import type { ScheduledMeeting } from '../../../services/db'

interface ScheduledMeetingCardProps {
  meeting: ScheduledMeeting
  isFaculty?: boolean
  onEdit?: (meeting: ScheduledMeeting) => void
  onDelete?: (meeting: ScheduledMeeting) => void
  onStart?: (meeting: ScheduledMeeting) => void
}

const STATUS_STYLES: Record<MeetingStatus, string> = {
  Upcoming: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  Live: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  Completed: 'bg-slate-700/40 text-slate-400 border-slate-600/20',
  Cancelled: 'bg-red-500/15 text-red-300 border-red-500/20',
}

const STATUS_DOT: Record<MeetingStatus, string> = {
  Upcoming: 'bg-cyan-400',
  Live: 'bg-emerald-400 animate-pulse',
  Completed: 'bg-slate-500',
  Cancelled: 'bg-red-400',
}

export default function ScheduledMeetingCard({
  meeting,
  isFaculty = false,
  onEdit,
  onDelete,
  onStart,
}: ScheduledMeetingCardProps) {
  const status = getMeetingStatus(
    meeting.scheduledDate,
    meeting.duration,
    meeting.status
  )

  const scheduledDate = new Date(meeting.scheduledDate)

  const dateLabel = scheduledDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const canStart = isFaculty && (status === 'Upcoming' || status === 'Live')
  const canEdit = isFaculty && (status === 'Upcoming')
  const canDelete = isFaculty && (status !== 'Completed')

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-3xl border border-white/10 bg-slate-950/60 p-6 flex flex-col justify-between space-y-5 hover:border-cyan-500/20 transition duration-200"
    >
      {/* Top row: status badge + duration */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
          {status}
        </span>
        <span className="text-xs text-slate-500 font-medium tabular-nums">
          {meeting.duration ?? 60} min
        </span>
      </div>

      {/* Title + class */}
      <div>
        <h3 className="text-lg font-bold text-white leading-tight line-clamp-2">
          {meeting.title}
        </h3>
        {meeting.className && (
          <p className="mt-1 text-sm font-semibold text-cyan-400 truncate">
            {meeting.className}
          </p>
        )}
        {meeting.description && (
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-900/40 rounded-xl px-3 py-2 border border-white/5">
            {meeting.description}
          </p>
        )}
      </div>

      {/* Date + time grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Date</p>
            <p className="text-xs font-semibold text-white">{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Time</p>
            <p className="text-xs font-semibold text-white">
              {meeting.startTime || 'N/A'}
              {meeting.endTime ? ` – ${meeting.endTime}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Faculty info (shown to students) */}
      {!isFaculty && meeting.facultyName && (
        <p className="text-xs text-slate-500">
          <span className="text-slate-400">By</span> {meeting.facultyName}
        </p>
      )}

      {/* Actions — faculty only */}
      {isFaculty && (
        <div className="flex gap-2 pt-1">
          {canStart && onStart && (
            <button
              id={`start-meeting-${meeting.id}`}
              onClick={() => onStart(meeting)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Play className="h-3.5 w-3.5" />
              Start Now
            </button>
          )}
          {canEdit && onEdit && (
            <button
              id={`edit-meeting-${meeting.id}`}
              onClick={() => onEdit(meeting)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition"
              title="Edit meeting"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {canDelete && onDelete && (
            <button
              id={`delete-meeting-${meeting.id}`}
              onClick={() => onDelete(meeting)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
              title="Delete meeting"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {status === 'Completed' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
              Completed
            </div>
          )}
          {status === 'Cancelled' && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
              <XCircle className="h-3.5 w-3.5" />
              Cancelled
            </div>
          )}
        </div>
      )}

      {/* Student: show live indicator if meeting is now */}
      {!isFaculty && status === 'Live' && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300">This class may be live now — check your class page</span>
        </div>
      )}
    </motion.div>
  )
}
