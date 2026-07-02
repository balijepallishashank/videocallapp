import { AnimatePresence, motion } from 'framer-motion'
import { UserPlus2, X } from 'lucide-react'
import type { AcademicStudent } from './types'

interface DragDropAreaProps {
  participants: AcademicStudent[]
  isDragOver: boolean
  onDragEnter: () => void
  onDragLeave: () => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDropStudent: (event: React.DragEvent<HTMLDivElement>) => void
  onRemoveParticipant: (uid: string) => void
}

export default function DragDropArea({
  participants,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDropStudent,
  onRemoveParticipant,
}: DragDropAreaProps) {
  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDropStudent}
      className={`rounded-2xl border p-4 md:p-5 backdrop-blur min-h-[420px] transition-all ${
        isDragOver
          ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.35)]'
          : 'border-white/10 bg-slate-900/45'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-white">Meeting Participants</h3>
          <p className="text-xs text-slate-400 mt-1">Drop students here to invite them</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-1.5 text-sm text-cyan-200">
          {participants.length}
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="h-[300px] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <UserPlus2 className="h-8 w-8 text-cyan-300" />
          <p className="text-sm">Drag students and drop here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {participants.map((student) => (
              <motion.div
                key={student.uid}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500/70 to-cyan-500/70 text-xs font-semibold text-white flex items-center justify-center">
                  {student.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{student.name}</p>
                  <p className="text-xs text-slate-400 truncate">{student.studentId}</p>
                </div>
                <button
                  onClick={() => onRemoveParticipant(student.uid)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10"
                  aria-label={`Remove ${student.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
