import { AnimatePresence, motion } from 'framer-motion'
import { Users } from 'lucide-react'
import StudentCard from './StudentCard'
import type { AcademicStudent } from './types'

interface YearSectionProps {
  title: string
  students: AcademicStudent[]
  selectedIds: Set<string>
  participantIds: Set<string>
  canManageInvites: boolean
  visibleCount: number
  onToggleStudent: (student: AcademicStudent) => void
  onSelectAll: () => void
  onClearAll: () => void
  onLoadMore: () => void
}

export default function YearSection({
  title,
  students,
  selectedIds,
  participantIds,
  canManageInvites,
  visibleCount,
  onToggleStudent,
  onSelectAll,
  onClearAll,
  onLoadMore,
}: YearSectionProps) {
  const visibleStudents = students.slice(0, visibleCount)

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur p-4 md:p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">{title}</h2>
          <p className="text-sm text-slate-400">
            {canManageInvites
              ? 'Drag a student card into meeting participants to invite instantly.'
              : 'Browse year students. Students can only join meetings from the Meetings tab.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageInvites && (
            <>
              <button
                onClick={onSelectAll}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-2 text-xs text-cyan-100"
              >
                Select all
              </button>
              <button
                onClick={onClearAll}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-slate-200"
              >
                Clear all
              </button>
            </>
          )}
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-200 text-sm">
            <Users className="h-4 w-4 text-cyan-300" />
            {students.length} students
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-slate-500">
            No students found in this section.
          </div>
        ) : (
          <AnimatePresence>
            {visibleStudents.map((student) => (
              <motion.div
                key={student.uid}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <StudentCard
                  student={student}
                  isSelected={selectedIds.has(student.uid)}
                  isParticipant={participantIds.has(student.uid)}
                  selectable={canManageInvites}
                  draggableEnabled={canManageInvites}
                  onToggleSelect={onToggleStudent}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {visibleCount < students.length && (
        <div className="pt-4">
          <button
            onClick={onLoadMore}
            className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-slate-200"
          >
            Load more students
          </button>
        </div>
      )}
    </div>
  )
}
