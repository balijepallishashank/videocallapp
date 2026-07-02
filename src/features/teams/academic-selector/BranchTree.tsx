import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CheckSquare, GraduationCap, Square } from 'lucide-react'
import type { BranchNode } from './types'

const yearLabel = (year: number) => {
  if (year === 1) return '1st Year'
  if (year === 2) return '2nd Year'
  if (year === 3) return '3rd Year'
  return `${year}th Year`
}

interface BranchTreeProps {
  branches: BranchNode[]
  activeBranchId: string | null
  activeYearId: string | null
  selectedIds: Set<string>
  canBulkSelect: boolean
  onActivateBranch: (branchId: string) => void
  onActivateYear: (branchId: string, yearId: string) => void
  onSelectAllBranch: (branchId: string) => void
  onSelectAllYear: (branchId: string, yearId: string) => void
}

export default function BranchTree({
  branches,
  activeBranchId,
  activeYearId,
  selectedIds,
  canBulkSelect,
  onActivateBranch,
  onActivateYear,
  onSelectAllBranch,
  onSelectAllYear,
}: BranchTreeProps) {
  return (
    <div className="space-y-2">
      {branches.map((branch) => {
        const branchStudentIds = branch.years.flatMap((year) => year.students.map((student) => student.uid))
        const selectedInBranch = branchStudentIds.filter((id) => selectedIds.has(id)).length

        return (
          <div key={branch.id} className="rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
            <div
              className={`flex items-center gap-2 px-3 py-3 ${
                activeBranchId === branch.id ? 'bg-cyan-500/10' : 'bg-transparent'
              }`}
            >
              <BookOpen className="h-4 w-4 text-cyan-300" />
              <button
                onClick={() => onActivateBranch(branch.id)}
                className="text-left text-sm text-white font-medium truncate hover:text-cyan-100"
              >
                {branch.name}
                {branch.code ? ` (${branch.code})` : ''}
              </button>
              {canBulkSelect && (
                <button
                  onClick={() => onSelectAllBranch(branch.id)}
                  className="text-cyan-300 hover:text-cyan-200"
                  aria-label={`Select all in ${branch.name}`}
                >
                  {selectedInBranch > 0 && selectedInBranch === branchStudentIds.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="ml-auto text-xs text-slate-400">{branchStudentIds.length} students</div>
            </div>

            <AnimatePresence initial={false}>
              {activeBranchId === branch.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  {branch.years.map((year) => {
                    const selectedInYear = year.students.filter((student) => selectedIds.has(student.uid)).length

                    return (
                      <div key={year.id} className="pl-8 pr-3 py-2 border-b border-white/5 last:border-b-0">
                        <div
                          className={`flex items-center gap-2 rounded-xl px-2 py-2 ${
                            activeYearId === year.id ? 'bg-cyan-500/10 border border-cyan-500/20' : ''
                          }`}
                        >
                          <GraduationCap className="h-4 w-4 text-indigo-300" />
                          {canBulkSelect && (
                            <button
                              onClick={() => onSelectAllYear(branch.id, year.id)}
                              className="text-cyan-300 hover:text-cyan-200"
                              aria-label={`Select all in Year ${year.year}`}
                            >
                              {selectedInYear > 0 && selectedInYear === year.students.length ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => onActivateYear(branch.id, year.id)}
                            className="text-left text-sm text-slate-200 hover:text-white"
                          >
                            {yearLabel(year.year)}
                          </button>
                          <span className="ml-auto text-xs text-slate-400">{year.students.length}</span>
                        </div>
                        <div className="text-xs text-slate-500 pb-1 pl-6 pt-1">
                          {selectedInYear} selected / {year.students.length} total
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
