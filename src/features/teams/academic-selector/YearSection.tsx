import React from 'react'
import { Users, Check, Play } from 'lucide-react'
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
  onStartSection?: () => void
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
  onStartSection
}: YearSectionProps) {
  const visibleStudents = students.slice(0, visibleCount)
  const sectionId = title.split(' ').pop()?.toLowerCase() || 'cse_section_a'

  return (
    <div className="glass rounded-2xl border border-white/10 flex flex-col h-full overflow-hidden">
      {/* Header Area: Optimized & Compact */}
      <div className="p-4 md:p-5 border-b border-white/10 bg-slate-900/40">
        {/* Row 1: Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-2">
          <h2 className="text-base md:text-lg font-bold text-white truncate flex-1" title={title}>
            {title}
          </h2>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end flex-shrink-0">
            {canManageInvites && (
              <>
                <button
                  onClick={onStartSection}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-xs font-semibold transition-all order-first lg:order-none"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Section
                </button>
                <button
                  onClick={onSelectAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 text-slate-200 text-xs font-medium transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={onClearAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 text-slate-200 text-xs font-medium transition-all"
                >
                  Clear All
                </button>
              </>
            )}
            <span className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
              {students.length} Students
            </span>
          </div>
        </div>

        {/* Row 2: Compact Metadata Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[11px] font-medium">
            Section ID: {sectionId}
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[11px] font-medium">
            CR: Not Assigned
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[11px] font-medium">
            Advisor: Prof. Anita Sharma
          </span>
        </div>

        {/* Row 3: Description */}
        <p className="text-[11px] text-slate-500">
          Drag students into participants panel or start a meeting for the entire section.
        </p>
      </div>

      {/* Student List */}
      <div className="p-2 md:p-3 overflow-y-auto flex-1 custom-scrollbar space-y-1.5 mt-2">
        {students.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No students found in this section.
          </div>
        ) : (
          <>
            {visibleStudents.map(student => (
              <div
                key={student.uid}
                onClick={() => onToggleStudent(student)}
                draggable
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => e.dataTransfer.setData('application/x-student-uid', student.uid)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                  selectedIds.has(student.uid)
                    ? 'bg-blue-500/15 border-blue-400/30'
                    : participantIds.has(student.uid)
                      ? 'bg-emerald-500/10 border-emerald-400/20'
                      : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                {canManageInvites && (
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedIds.has(student.uid) || participantIds.has(student.uid)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {(selectedIds.has(student.uid) || participantIds.has(student.uid)) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                )}

                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold shadow-sm">
                    {student.avatar || student.name.charAt(0)}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                      student.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-slate-100 truncate">
                      {student.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {student.studentId}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {visibleCount < students.length && (
              <button
                onClick={onLoadMore}
                className="w-full py-2 mt-1 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/30 text-blue-400 text-xs font-medium transition-colors"
              >
                Load More Students ({students.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}