import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Wifi, WifiOff } from 'lucide-react'
import type { DragEvent } from 'react'
import type { AcademicStudent } from './types'

interface StudentCardProps {
  student: AcademicStudent
  isSelected: boolean
  isParticipant: boolean
  selectable: boolean
  draggableEnabled: boolean
  onToggleSelect: (student: AcademicStudent) => void
}

export default function StudentCard({
  student,
  isSelected,
  isParticipant,
  selectable,
  draggableEnabled,
  onToggleSelect,
}: StudentCardProps) {
  return (
    <motion.div
      layout
      draggable={draggableEnabled}
      onDragStartCapture={(event: DragEvent<HTMLDivElement>) => {
        if (!draggableEnabled) return
        event.dataTransfer.setData('application/x-student-uid', student.uid)
        event.dataTransfer.effectAllowed = 'copyMove'
      }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-2xl border p-4 backdrop-blur bg-slate-900/50 shadow-lg transition-all ${
        draggableEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isSelected
          ? 'border-cyan-400/60 ring-2 ring-cyan-400/20'
          : 'border-white/10 hover:border-white/25'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {selectable ? (
          <button
            onClick={() => onToggleSelect(student)}
            className="text-cyan-300 hover:text-cyan-200 transition-colors"
            aria-label={`Select ${student.name}`}
          >
            {isSelected ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
          </button>
        ) : (
          <div className="h-5 w-5" />
        )}

        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/70 to-cyan-500/70 text-white text-sm font-semibold flex items-center justify-center">
          {student.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{student.name}</div>
          <div className="text-xs text-slate-400 truncate">{student.studentId}</div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              student.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          <span className={student.status === 'online' ? 'text-emerald-300' : 'text-slate-400'}>
            {student.status === 'online' ? 'Online' : 'Offline'}
          </span>
          {student.status === 'online' ? <Wifi className="h-3.5 w-3.5 text-emerald-300" /> : <WifiOff className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      </div>

      {isParticipant && (
        <div className="mt-3 text-[11px] text-cyan-200 bg-cyan-500/10 border border-cyan-400/30 rounded-lg px-2.5 py-1 inline-flex">
          In meeting participants
        </div>
      )}
    </motion.div>
  )
}
