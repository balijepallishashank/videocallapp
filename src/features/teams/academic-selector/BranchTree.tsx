import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CheckSquare, GraduationCap, Pencil, Plus, Search, Square, Trash2, Users } from 'lucide-react'
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
  activeSectionId: string | null
  selectedIds: Set<string>
  canBulkSelect: boolean
  onActivateBranch: (branchId: string) => void
  onActivateYear: (branchId: string, yearId: string) => void
  onActivateSection: (branchId: string, yearId: string, sectionId: string) => void
  onSelectAllBranch: (branchId: string) => void
  onSelectAllYear: (branchId: string, yearId: string) => void
  onCreateSection: (branchId: string, yearId: string, sectionName: string) => void
  onRenameSection: (sectionId: string, sectionName: string) => void
  onDeleteSection: (sectionId: string) => void
}

export default function BranchTree({
  branches,
  activeBranchId,
  activeYearId,
  activeSectionId,
  selectedIds,
  canBulkSelect,
  onActivateBranch,
  onActivateYear,
  onActivateSection,
  onSelectAllBranch,
  onSelectAllYear,
  onCreateSection,
  onRenameSection,
  onDeleteSection,
}: BranchTreeProps) {
  const [query, setQuery] = useState('')
  const [newSectionForYear, setNewSectionForYear] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search section"
          className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
      </div>
      {branches.map((branch) => {
        const branchStudentIds = branch.years.flatMap((year) =>
          year.sections.flatMap((section) => section.students.map((student) => student.uid)),
        )
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
                {branch.departmentName} / {branch.name}
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
                    const yearStudents = year.sections.flatMap((section) => section.students)
                    const selectedInYear = yearStudents.filter((student) => selectedIds.has(student.uid)).length
                    const visibleSections = normalizedQuery
                      ? year.sections.filter((section) =>
                          `${branch.departmentName} ${branch.name} ${yearLabel(year.year)} ${section.name}`.toLowerCase().includes(normalizedQuery),
                        )
                      : year.sections

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
                              {selectedInYear > 0 && selectedInYear === yearStudents.length ? (
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
                          <span className="ml-auto text-xs text-slate-400">{yearStudents.length}</span>
                        </div>
                        <div className="text-xs text-slate-500 pb-1 pl-6 pt-1">
                          {selectedInYear} selected / {yearStudents.length} total
                        </div>
                        <div className="space-y-1 pl-6">
                          {visibleSections.map((section) => {
                            const selectedInSection = section.students.filter((student) => selectedIds.has(student.uid)).length
                            return (
                              <div
                                key={section.id}
                                className={`rounded-lg border px-2 py-2 ${
                                  activeSectionId === section.id
                                    ? 'border-cyan-400/30 bg-cyan-500/10'
                                    : 'border-white/5 bg-slate-950/25'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-3.5 w-3.5 text-cyan-300" />
                                  <button
                                    onClick={() => onActivateSection(branch.id, year.id, section.id)}
                                    className="min-w-0 flex-1 text-left text-xs text-slate-100 hover:text-white truncate"
                                  >
                                    {section.name} ({section.students.length} Students)
                                  </button>
                                  {canBulkSelect && (
                                    <>
                                      <button
                                        onClick={() => {
                                          const nextName = window.prompt('Section name', section.name)
                                          if (nextName) onRenameSection(section.id, nextName)
                                        }}
                                        className="text-slate-400 hover:text-slate-200"
                                        title="Rename section"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => onDeleteSection(section.id)}
                                        className="text-rose-300 hover:text-rose-200"
                                        title="Delete section"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500">
                                  {selectedInSection} selected / CR: {section.classRepresentative || 'Not assigned'} / Advisor: {section.facultyAdvisor || 'Unassigned'}
                                </div>
                              </div>
                            )
                          })}
                          {canBulkSelect && (
                            <div className="pt-1">
                              {newSectionForYear === year.id ? (
                                <form
                                  className="flex gap-1"
                                  onSubmit={(event) => {
                                    event.preventDefault()
                                    onCreateSection(branch.id, year.id, newSectionName)
                                    setNewSectionName('')
                                    setNewSectionForYear(null)
                                  }}
                                >
                                  <input
                                    value={newSectionName}
                                    onChange={(event) => setNewSectionName(event.target.value)}
                                    placeholder="Section name"
                                    className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950/50 px-2 py-1 text-xs text-white focus:outline-none"
                                  />
                                  <button className="rounded-md bg-cyan-500/20 px-2 text-xs text-cyan-100">Add</button>
                                </form>
                              ) : (
                                <button
                                  onClick={() => setNewSectionForYear(year.id)}
                                  className="inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200"
                                >
                                  <Plus className="h-3 w-3" /> Add section
                                </button>
                              )}
                            </div>
                          )}
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
