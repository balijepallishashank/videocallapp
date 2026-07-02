import { useEffect, useMemo, useRef, useState, memo, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Bell, CalendarDays, Download, FileText, Users, 
  ChevronRight, Search, Folder, FolderOpen, Edit2, Trash2, 
  Plus, Video, CheckSquare, Square, UploadCloud, 
  FileSpreadsheet, File, Layout, Activity, ArrowRightLeft,
  Eye, Building2, X, UserPlus
} from 'lucide-react'
import type {
  AcademicDepartment,
  AcademicFacultyRoot,
  AcademicSection,
  StudentRecord,
} from './HierarchicalSidebar.tsx'
const DragDropArea = lazy(() => import('./academic-selector/DragDropArea'))
const AddStudentForm = lazy(() => import('./academic-selector/AddStudentForm.tsx'))
import type { AcademicStudent, BranchNode, SelectorToast } from './academic-selector/types'

export type { AcademicFacultyRoot, AcademicSection, StudentRecord } from './HierarchicalSidebar.tsx'

export interface FacultyProfile {
  facultyId: string
  name: string
  email: string
  department: string
  phone?: string
  designation?: string
}

interface AcademicStructureProps {
  facultyRoot: AcademicFacultyRoot
  facultyProfile?: FacultyProfile
  role: 'faculty' | 'student'
  studentUpcomingMeetings?: Array<{ id: string; title: string; date: Date }>
  studentAttendanceHistory?: Array<{ id: string; title: string; date: Date; status: 'Attended' | 'Absent' }>
  studentNotifications?: Array<{ id: string; title: string; message: string }>
  studentSharedResources?: Array<{ id: string; title: string; date: Date; recording?: string; summary?: string }>
  onOpenRecording?: (recordingUrl: string) => void
  onDownloadResourceSummary?: (resourceId: string) => void
  onStartMeetingForSection?: (section: AcademicSection) => void
  onInviteStudentToMeeting?: (student: StudentRecord) => void
  onSendMessageToStudent?: (student: StudentRecord) => void
  onViewStudentProfile?: (student: StudentRecord) => void
  onAcademicRootChange?: (departments: AcademicDepartment[]) => void
}

const ORDINALS = ['1st', '2nd', '3rd', '4th']

const yearFromStudent = (student: StudentRecord) => {
  if (student.yearNumber && student.yearNumber > 0) return Math.min(4, Math.max(1, student.yearNumber))
  if (student.semester && student.semester > 0) return Math.min(4, Math.max(1, Math.ceil(student.semester / 2)))
  return 1
}

const avatarFromName = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() || '')
    .join('') || 'ST'

const DEMO_NAMES = [
  'Aarav Patel',
  'Priya Sharma',
  'Rahul Verma',
  'Sneha Reddy',
  'Karan Mehta',
  'Pooja Nair',
  'Arjun Das',
  'Meera Iyer',
  'Rohit Kumar',
  'Ananya Singh',
  'Vivek Gupta',
  'Ishita Rao',
];

const createSeedStudents = (branchName: string, branchId: string, year: number, count = 8): AcademicStudent[] => {
  const code = branchName
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase() || 'STU'

  return Array.from({ length: count }, (_, index) => {
    const name = DEMO_NAMES[(year * 3 + index) % DEMO_NAMES.length]
    const studentId = `${code}${year}${String(index + 1).padStart(3, '0')}`
    return {
      uid: `${branchId}-${studentId}`,
      studentId,
      name,
      avatar: avatarFromName(name),
      status: index % 4 === 0 ? 'offline' : 'online',
      branchId,
      year,
      sectionId: `${branchId}_y${year}_sA`,
    }
  })
}

const mapStudentRecord = (student: StudentRecord, branchId: string, year: number, sectionId: string): AcademicStudent => ({
  uid: `${branchId}-${student.id}`,
  studentId: student.id,
  name: student.name,
  avatar: avatarFromName(student.name),
  status: student.status === 'Active' ? 'online' : 'offline',
  branchId,
  sectionId,
  year,
})

const buildDummyBranches = (): BranchNode[] => {
  const branchNames = ['CSE', 'ECE', 'MECH', 'CIVIL']
  return branchNames.map((name) => {
    const branchId = `${name.toLowerCase()}_branch`
    return {
      id: branchId,
      name,
      departmentId: name.toLowerCase(),
      departmentName: name,
      years: [1, 2, 3, 4].map((year) => {
        const yearId = `${branchId}_y${year}`
        const sectionId = `${yearId}_sA`
        return {
          id: yearId,
          year,
          sections: [
            {
              id: sectionId,
              sectionId: sectionId,
              name: 'Section A',
              students: createSeedStudents(name, branchId, year, 12),
            },
          ],
        }
      }),
    }
  })
}

const normalizeBranches = (root: AcademicFacultyRoot): BranchNode[] => {
  const normalized = root.departments.map((department) => {
    const yearBuckets = new Map<number, Map<string, { id: string; sectionId: string; name: string; students: AcademicStudent[] }>>()
    for (let year = 1; year <= 4; year += 1) {
      yearBuckets.set(year, new Map())
    }

    department.branches?.forEach((branch) => {
      branch.sections?.forEach((section) => {
        // Ensure the section exists even if it has no students yet
        const sectionYear = section.yearNumber || 1
        const bucket = yearBuckets.get(sectionYear)
        if (bucket && !bucket.has(section.id)) {
          bucket.set(section.id, { id: section.id, sectionId: section.id, name: section.name, students: [] })
        }

        section.students.forEach((student) => {
          const year = yearFromStudent(student)
          const sectionBucket = yearBuckets.get(year)
          if (sectionBucket) {
            let sec = sectionBucket.get(section.id)
            if (!sec) {
              sec = { id: section.id, sectionId: section.id, name: section.name, students: [] }
              sectionBucket.set(section.id, sec)
            }
            if (!sec!.students.some((s) => s.studentId === student.id)) {
              sec!.students.push(mapStudentRecord(student, department.id, year, section.id))
            }
          }
        })
      })
    })

    const years = [1, 2, 3, 4].map((year) => {
      const sectionMap = yearBuckets.get(year)
      let sections = Array.from(sectionMap?.values() || [])
      if (sections.length === 0) {
        const sectionId = `${department.id}_year_${year}_sA`
        sections = [
          {
            id: sectionId,
            sectionId: sectionId,
            name: 'Section A',
            students: createSeedStudents(department.name, department.id, year),
          },
        ]
      }

      return {
        id: `${department.id}_year_${year}`,
        year,
        sections,
      }
    })

    return {
      id: department.id,
      name: department.name,
      code: department.code,
      departmentId: department.id,
      departmentName: department.name,
      years,
    }
  })

  return normalized.length > 0 ? normalized : buildDummyBranches()
}

const toStudentRecord = (student: AcademicStudent): StudentRecord => ({
  id: student.studentId,
  name: student.name,
  email: `${student.studentId.toLowerCase()}@student.edu`,
  attendancePct: 0,
  status: student.status === 'online' ? 'Active' : 'Inactive',
  yearNumber: student.year,
  semester: student.year * 2,
});

const toDepartmentsPayload = (branches: BranchNode[]): AcademicDepartment[] =>
  branches.map((branchNode) => {
    const department: AcademicDepartment = {
      id: branchNode.id,
      name: branchNode.name,
      code: branchNode.code || branchNode.name.split(' ')[0].slice(0, 4).toUpperCase(),
      totalYears: 4,
      branches: [
        {
          id: `${branchNode.id}_main_branch`,
          name: branchNode.name, // This should probably be a sub-branch name if that model exists
          sections: branchNode.years.flatMap((year) =>
            year.sections.map((section) => ({
              id: section.id,
              name: section.name,
              students: section.students.map((s) => toStudentRecord(s)),
              yearNumber: year.year,
              departmentName: branchNode.name,
            }))
          ),
        },
      ],
    };
    return department;
  });

interface AccordionBranchTreeProps {
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
  onRenameSection: (sectionId: string, newName: string) => void
  onDeleteSection: (sectionId: string) => void
  onStartMeetingForSection: (branchId: string, yearId: string, sectionId: string) => void
}

const AccordionBranchTree = memo(function AccordionBranchTree({
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
  onStartMeetingForSection,
}: AccordionBranchTreeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)
  const [expandedYear, setExpandedYear] = useState<string | null>(null)

  const filteredBranches = useMemo(() => {
    if (!searchQuery.trim()) return branches
    const q = searchQuery.toLowerCase()
    return branches.map((b) => {
      const matchB = b.name.toLowerCase().includes(q) || b.departmentName?.toLowerCase().includes(q)
      const filteredYears = b.years.map((y) => {
        const matchY = `year ${y.year}`.includes(q) || `${y.year} year`.includes(q) || y.year.toString() === q
        const filteredSections = y.sections.filter((s) => s.name.toLowerCase().includes(q))
        if (matchB || matchY || filteredSections.length > 0) {
          return { ...y, sections: matchB || matchY ? y.sections : filteredSections }
        }
        return null
      }).filter(Boolean) as typeof b.years

      if (matchB || filteredYears.length > 0) {
        return { ...b, years: matchB ? b.years : filteredYears }
      }
      return null
    }).filter(Boolean) as BranchNode[]
  }, [branches, searchQuery])

  useEffect(() => {
    if (searchQuery.trim() && filteredBranches.length > 0) {
      setExpandedBranch(filteredBranches[0].id)
      if (filteredBranches[0].years.length > 0) {
        setExpandedYear(filteredBranches[0].years[0].id)
      }
    }
  }, [searchQuery, filteredBranches])

  return (
    <div className="space-y-4 flex flex-col h-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search academic structure..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm shadow-inner"
        />
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {filteredBranches.map((branch) => {
          const isBranchExpanded = expandedBranch === branch.id
          const isBranchActive = activeBranchId === branch.id
          const branchStudentIds = branch.years.flatMap((y) => y.sections.flatMap((s) => s.students.map((st) => st.uid)))
          const branchSelectedCount = branchStudentIds.filter((id) => selectedIds.has(id)).length
          const isAllBranchSelected = branchStudentIds.length > 0 && branchSelectedCount === branchStudentIds.length

          return (
            <div key={branch.id} className="space-y-0.5">
              <div
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all group ${
                  isBranchActive ? 'bg-blue-500/15 border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => {
                  if (isBranchExpanded) {
                    setExpandedBranch(null)
                    setExpandedYear(null)
                  } else {
                    setExpandedBranch(branch.id)
                    setExpandedYear(null)
                  }
                  onActivateBranch(branch.id)
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <motion.div animate={{ rotate: isBranchExpanded ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
                  </motion.div>
                  {isBranchExpanded ? <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" /> : <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  <span className={`text-sm font-semibold truncate ${isBranchActive ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                    {branch.name}
                  </span>
                </div>
                {canBulkSelect && (
                  <button onClick={(e) => { e.stopPropagation(); onSelectAllBranch(branch.id); }} className="p-1 hover:bg-white/10 rounded-lg ml-2 flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                    {isAllBranchSelected ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {isBranchExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden pl-5 space-y-0.5 mt-1 border-l border-white/5 ml-3"
                  >
                    {branch.years.map((year) => {
                      const isYearExpanded = expandedYear === year.id
                      const isYearActive = activeYearId === year.id
                      const yearStudentIds = year.sections.flatMap((s) => s.students.map((st) => st.uid))
                      const yearSelectedCount = yearStudentIds.filter((id) => selectedIds.has(id)).length
                      const isAllYearSelected = yearStudentIds.length > 0 && yearSelectedCount === yearStudentIds.length

                      return (
                        <div key={year.id} className="space-y-0.5">
                          <div
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all group/year ${
                              isYearActive ? 'bg-slate-800/80 text-white' : 'hover:bg-white/5 border border-transparent text-slate-300'
                            }`}
                            onClick={() => {
                              setExpandedYear(isYearExpanded ? null : year.id)
                              onActivateYear(branch.id, year.id)
                            }}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <motion.div animate={{ rotate: isYearExpanded ? 90 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              </motion.div>
                              <span className={`text-sm font-medium truncate ${isYearActive ? 'text-white' : 'group-hover:text-white transition-colors'}`}>
                                {ORDINALS[year.year - 1] || `${year.year}th`} Year
                              </span>
                            </div>
                            {canBulkSelect && (
                              <button onClick={(e) => { e.stopPropagation(); onSelectAllYear(branch.id, year.id); }} className="p-1 hover:bg-white/10 rounded ml-2 flex-shrink-0 opacity-0 group-hover/year:opacity-100">
                                {isAllYearSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> : <Square className="w-3.5 h-3.5 text-slate-500" />}
                              </button>
                            )}
                          </div>

                          <AnimatePresence initial={false}>
                            {isYearExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden pl-4 space-y-0.5 mt-0.5 border-l border-white/5 ml-2.5"
                              >
                                {year.sections.map((section) => {
                                  const isSectionActive = activeSectionId === section.id
                                  return (
                                    <div
                                      key={section.id}
                                      onClick={() => onActivateSection(branch.id, year.id, section.id)}
                                      className={`group/section flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                                        isSectionActive
                                          ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                          : 'hover:bg-slate-800/30 border border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                                            isSectionActive ? 'bg-blue-400' : 'bg-slate-600 group-hover/section:bg-slate-400'
                                          }`}
                                        />
                                        <span className={`text-[13px] truncate ${isSectionActive ? 'text-blue-200' : 'text-slate-400 group-hover/section:text-slate-200'}`}>
                                          {section.name}
                                        </span>
                                      </div>
                                      {canBulkSelect && (
                                        <div className="relative flex items-center opacity-0 group-hover/section:opacity-100 transition-opacity">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); onStartMeetingForSection(branch.id, year.id, section.id); }}
                                            className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors"
                                            title="Start Meeting"
                                          >
                                            <Video className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); const newName = window.prompt('Rename section:', section.name); if (newName) onRenameSection(section.id, newName); }}
                                            className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded transition-colors"
                                            title="Rename"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete ${section.name}?`)) onDeleteSection(section.id); }}
                                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                                            title="Delete"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                {canBulkSelect && (
                                  <div
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors mt-1"
                                    onClick={() => {
                                      const name = window.prompt('Enter new section name:')
                                      if (name) onCreateSection(branch.id, year.id, name)
                                    }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[13px] font-medium">Add Section</span>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        {filteredBranches.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No structure found.
          </div>
        )}
      </div>
    </div>
  )
})

// ================= Bulk Import Modal ================= //
const BulkImportModal = memo(function BulkImportModal({ isOpen, onClose, pushToast }: any) {
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'report'>('idle')
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" /> Bulk Import Students
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {status === 'idle' && (
          <>
            <div 
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault(); setIsDragging(false); setStatus('processing');
                setTimeout(() => setStatus('report'), 1500)
              }}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'}`}
            >
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-white font-medium text-lg mb-1">Drag and drop your file here</p>
              <p className="text-slate-400 text-sm mb-4">Supported formats: .csv, .xlsx (Max 10MB)</p>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
                Browse Files
              </button>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
              <span>Need help formatting?</span>
              <a href="#" className="text-blue-400 hover:underline flex items-center gap-1"><Download className="w-4 h-4"/> Download Template</a>
            </div>
          </>
        )}

        {status === 'processing' && (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-medium">Analyzing file data...</p>
          </div>
        )}

        {status === 'report' && (
          <div className="animate-slideIn">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Validation Complete</h3>
              <div className="grid grid-cols-3 gap-4 text-center mt-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">124</div>
                  <div className="text-xs text-slate-400">Total Found</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-emerald-400">120</div>
                  <div className="text-xs text-emerald-200/70">Ready to Import</div>
                </div>
                <div className="bg-rose-500/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-rose-400">4</div>
                  <div className="text-xs text-rose-200/70">Invalid Entries</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStatus('idle')} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={() => {
                pushToast("120 Students imported successfully", "success");
                onClose();
              }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all">
                Import 120 Students
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

// ================= Branch Modal ================= //
const BranchModal = memo(function BranchModal({ isOpen, onClose, onAdd }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        onAdd(fd.get('name') as string)
        onClose()
      }} className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-400"/> New Branch</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-1">Branch Name *</label>
            <input name="name" required placeholder="e.g. Computer Science & Eng" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-1">Branch Code</label>
            <input name="code" placeholder="e.g. CSE" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-1">Department Head</label>
            <input name="head" placeholder="e.g. Dr. Alan Turing" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 transition-all">Create Branch</button>
        </div>
      </form>
    </div>
  )
})

// ================= Stats Card ================= //
const StatCard = memo(({ title, value, icon, gradient }: any) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-5 shadow-lg group hover:bg-slate-800/60 transition-all">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${gradient}`} />
    <div className="flex items-center justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
        {icon}
      </div>
    </div>
  </div>
))

export default function AcademicStructure({
  facultyRoot,
  role,
  studentUpcomingMeetings = [],
  studentAttendanceHistory = [],
  studentNotifications = [],
  studentSharedResources = [],
  onOpenRecording,
  onDownloadResourceSummary,
  onStartMeetingForSection,
  onInviteStudentToMeeting,
  onAcademicRootChange,
}: AcademicStructureProps) {
  const [branches, setBranches] = useState<BranchNode[]>(() => normalizeBranches(facultyRoot))
  const isHydratingFromPropsRef = useRef(false)
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)
  const [activeYearId, setActiveYearId] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set())
  const [visibleCount, setVisibleCount] = useState(30)
  const [isDragOver, setIsDragOver] = useState(false)
  const [toasts, setToasts] = useState<SelectorToast[]>([])
  
  // ERP Dashboard specific states
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false)
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const isFaculty = role === 'faculty'

  useEffect(() => {
    if (isHydratingFromPropsRef.current) {
      isHydratingFromPropsRef.current = false
      return
    }
    if (!onAcademicRootChange) return
    onAcademicRootChange(toDepartmentsPayload(branches))
  }, [branches, onAcademicRootChange])

  useEffect(() => {
    setVisibleCount(30)
  }, [activeBranchId, activeYearId])

  const pushToast = (message: string, type: SelectorToast['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`
    setToasts((previous) => [...previous, { id, message, type }])
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, 2800)
  }

  const studentMap = useMemo(() => {
    const map = new Map<string, AcademicStudent>()
    branches.forEach(branch => branch.years.forEach(year => year.sections.forEach(section => section.students.forEach(student => map.set(student.uid, student)))))
    return map
  }, [branches])

  const activeBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) || null,
    [branches, activeBranchId],
  )

  const activeYear = useMemo(
    () => activeBranch?.years.find((year) => year.id === activeYearId) || null,
    [activeBranch, activeYearId],
  )

  const activeSection = useMemo(
    () => activeYear?.sections.find((s) => s.id === activeSectionId) || null,
    [activeYear, activeSectionId]
  )

  const activeStudents = useMemo(() => activeSection?.students || [], [activeSection])

  const selectedStudents = useMemo(
    () => Array.from(selectedStudentIds).map((id) => studentMap.get(id)).filter(Boolean) as AcademicStudent[],
    [selectedStudentIds, studentMap],
  )

  const participantStudents = useMemo(
    () => Array.from(participantIds).map((id) => studentMap.get(id)).filter(Boolean) as AcademicStudent[],
    [participantIds, studentMap],
  )

  const toggleStudent = (student: AcademicStudent) => {
    if (!isFaculty) return
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      if (next.has(student.uid)) {
        next.delete(student.uid)
      } else {
        next.add(student.uid)
      }
      return next
    })
  }

  const selectAllActiveStudents = () => {
    if (!isFaculty) return
    const activeIds = activeStudents.map((student) => student.uid)
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      activeIds.forEach((id) => next.add(id))
      return next
    })
  }

  const clearAllActiveStudents = () => {
    if (!isFaculty) return
    const activeIds = new Set(activeStudents.map((student) => student.uid))
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      Array.from(next).forEach((id) => {
        if (activeIds.has(id)) next.delete(id)
      })
      return next
    })
  }

  const toggleSelectAllYear = (branchId: string, yearId: string) => {
    if (!isFaculty) return
    const branch = branches.find((item) => item.id === branchId)
    const year = branch?.years.find((item) => item.id === yearId)
    if (!year) return

    const yearIds = year.sections.flatMap(s => s.students).map((student: AcademicStudent) => student.uid)
    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      const areAllSelected = yearIds.every((id) => next.has(id))
      if (areAllSelected) {
        yearIds.forEach((id: string) => next.delete(id))
      } else {
        yearIds.forEach((id: string) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectAllBranch = (branchId: string) => {
    if (!isFaculty) return
    const branch = branches.find((item) => item.id === branchId)
    if (!branch) return
    const branchIds = branch.years.flatMap((year) => year.sections.flatMap(s => s.students.map((student: AcademicStudent) => student.uid)))

    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      const areAllSelected = branchIds.every((id) => next.has(id))
      if (areAllSelected) {
        branchIds.forEach((id: string) => next.delete(id))
      } else {
        branchIds.forEach((id: string) => next.add(id))
      }
      return next
    })
  }

  const addParticipantByUid = (uid: string) => {
    if (!isFaculty) return
    const student = studentMap.get(uid)
    if (!student) return

    setParticipantIds((previous) => {
      if (previous.has(uid)) return previous
      const next = new Set(previous)
      next.add(uid)
      return next
    })

    setSelectedStudentIds((previous) => {
      const next = new Set(previous)
      next.add(uid)
      return next
    })

    onInviteStudentToMeeting?.(toStudentRecord(student as AcademicStudent))
    pushToast(`${student.name} added to meeting participants`, 'success')
  }

  const removeParticipant = (uid: string) => {
    if (!isFaculty) return
    const student = studentMap.get(uid)
    setParticipantIds((previous) => {
      const next = new Set(previous)
      next.delete(uid)
      return next
    })
    if (student) {
      pushToast(`${student.name} removed from meeting`, 'info')
    }
  }

  const addBranch = (branchName: string) => {
    if (!isFaculty) return
    const normalized = branchName.trim()
    if (!normalized) return

    setBranches((previous) => {
      const exists = previous.some((branch) => branch.name.toLowerCase() === normalized.toLowerCase())
      if (exists) return previous

      const id = `${normalized.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
      const created: BranchNode = {
        id,
        name: normalized,
        code: normalized.slice(0, 4).toUpperCase(),
        departmentId: id,
        departmentName: normalized,
        years: [1, 2, 3, 4].map((year) => ({
          id: `${id}_year_${year}`,
          year,
          sections: [
            {
              id: `${id}_year_${year}_sA`,
              sectionId: `${id}_year_${year}_sA`,
              name: 'Section A',
              students: [],
            },
          ],
        })),
      }

      setActiveBranchId(id)
      setActiveYearId(created.years[0].id)
      setActiveSectionId(created.years[0].sections[0].id)
      pushToast(`Branch ${normalized} added`, 'success')
      return [...previous, created]
    })
  }

  const addStudent = (payload: { name: string; studentId: string; branchId: string; year: number; sectionId: string }) => {
    if (!isFaculty) return
    const cleanedName = payload.name.trim()
    const cleanedStudentId = payload.studentId.trim()
    if (!cleanedName || !cleanedStudentId) return

    setBranches((previous) =>
      previous.map((branch) => {
        if (branch.id !== payload.branchId) return branch

        return {
          ...branch,
          years: branch.years.map((year) => {
            if (year.year !== payload.year) return year;
            return {
              ...year,
              sections: year.sections.map(section => {
                if (section.id !== payload.sectionId) return section;
                const student: AcademicStudent = {
                  uid: `${payload.branchId}-${cleanedStudentId}`,
                  studentId: cleanedStudentId,
                  name: cleanedName,
                  avatar: avatarFromName(cleanedName),
                  status: 'online',
                  branchId: payload.branchId,
                  year: payload.year,
                  sectionId: payload.sectionId,
                };
                if (section.students.some((item: AcademicStudent) => item.studentId === cleanedStudentId)) return section;
                return { ...section, students: [student, ...section.students] };
              })
            }
          }),
        }
      }),
    )

    setActiveBranchId(payload.branchId)
    setActiveYearId(`${payload.branchId}_year_${payload.year}`)
    pushToast(`${cleanedName} added successfully`, 'success')
  }

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        years: branch.years.map((year: { year: any }) => year.year),
        sectionsByYear: Object.fromEntries(
          branch.years.map((year) => [year.year, [{ id: `${branch.id}_y${year.year}_sA`, name: 'Section A' }]]),
        ),
      })),
    [branches]
  )

  const startCallWithSelectedStudents = () => {
    if (!isFaculty) return
    if (selectedStudents.length === 0) {
      pushToast('Select at least one student to start a call.', 'info')
      return
    }
    if (!activeBranch || !activeYear) { // activeBranch can be null
      pushToast('Select branch and year first.', 'info')
      return
    }

    onStartMeetingForSection?.({
      id: `${activeBranch.id}_${activeYear.id}_meeting_${Date.now()}`,
      name: `${activeBranch.name} - ${ORDINALS[(activeYear.year || 1) - 1]} Year`,
      students: selectedStudents.map((student: AcademicStudent) => toStudentRecord(student)),
      subject: `${activeBranch.name} Meeting`,
      departmentName: activeBranch.name,
      yearNumber: activeYear.year,
    })
    pushToast(`Starting call with ${selectedStudents.length} students`, 'success')
  }

  const startCallWithParticipantStudents = () => {
    if (!isFaculty) return
    if (participantStudents.length === 0) {
      pushToast('Add at least one student to the participants panel to start a call.', 'error')
      return
    }

    onStartMeetingForSection?.({
      id: `custom_meeting_${Date.now()}`,
      name: `Custom Group Meeting`,
      students: participantStudents.map((student: AcademicStudent) => toStudentRecord(student)),
      subject: `Custom Group Meeting`,
    })
    pushToast(`Starting call with ${participantStudents.length} students`, 'success')
  }

  const startMeetingForSection = (branchId: string, yearId: string, sectionId: string) => {
    if (!isFaculty) return

    const branch = branches.find((b) => b.id === branchId)
    const year = branch?.years.find((y) => y.id === yearId)
    const section = year?.sections.find((s) => s.id === sectionId)

    if (!branch || !year || !section) {
      pushToast('Could not find the specified section.', 'error')
      return
    }

    if (section.students.length === 0) {
      pushToast('Cannot start a meeting for an empty section.', 'info')
      return
    }

    onStartMeetingForSection?.({
      id: `${section.id}_meeting_${Date.now()}`,
      name: `${branch.name} - ${ORDINALS[(year.year || 1) - 1]} Year - ${section.name}`,
      students: section.students.map(toStudentRecord),
      subject: `${section.name} Meeting`,
      departmentName: branch.departmentName,
      yearNumber: year.year,
    })

    pushToast(`Starting meeting for ${section.name}...`, 'success')
  }

  const createSection = (branchId: string, yearId: string, sectionName: string) => {
    if (!isFaculty) return
    const normalized = sectionName.trim()
    if (!normalized) return

    setBranches((previous) => {
      let alreadyExists = false
      const next = previous.map((branch) => {
        if (branch.id !== branchId) return branch
        return {
          ...branch,
          years: branch.years.map((year) => {
            if (year.id !== yearId) return year
            if (year.sections.some((s) => s.name.toLowerCase() === normalized.toLowerCase())) {
              alreadyExists = true
              return year
            }
            
            const newSectionId = `${branchId}_year_${year.year}_${normalized.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
            const newSection = {
              id: newSectionId,
              sectionId: newSectionId,
              name: normalized,
              students: [],
            }
            
            setTimeout(() => {
              setActiveBranchId(branchId)
              setActiveYearId(yearId)
              setActiveSectionId(newSectionId)
            }, 0)

            return {
              ...year,
              sections: [...year.sections, newSection],
            }
          })
        }
      })
      
      if (alreadyExists) {
        setTimeout(() => pushToast(`Section "${normalized}" already exists`, 'error'), 0)
      } else {
        setTimeout(() => pushToast(`Section "${normalized}" created`, 'success'), 0)
      }
      return next
    })
  }

  const renameSection = (sectionId: string, newName: string) => {
    if (!isFaculty) return
    const normalized = newName.trim()
    if (!normalized) return

    setBranches((previous) =>
      previous.map((branch) => ({
        ...branch,
        years: branch.years.map((year) => ({
          ...year,
          sections: year.sections.map((section) => {
            if (section.id !== sectionId) return section
            return { ...section, name: normalized }
          })
        }))
      }))
    )
    pushToast(`Section renamed to "${normalized}"`, 'success')
  }

  const deleteSection = (sectionId: string) => {
    if (!isFaculty) return
    
    let deleted = false
    setBranches((previous) => {
      const next = previous.map((branch) => ({
        ...branch,
        years: branch.years.map((year) => {
          if (!year.sections.some((section) => section.id === sectionId)) return year
          
          if (year.sections.length <= 1) {
            setTimeout(() => pushToast(`Cannot delete the last section in the year.`, 'error'), 0)
            return year
          }
          
          deleted = true
          const filteredSections = year.sections.filter((section) => section.id !== sectionId)
          
          if (activeSectionId === sectionId) {
            setTimeout(() => setActiveSectionId(filteredSections[0]?.id || null), 0)
          }

          return {
            ...year,
            sections: filteredSections
          }
        })
      }))
      
      if (deleted) {
        setTimeout(() => pushToast(`Section deleted`, 'info'), 0)
      }
      return next
    })
  }


  const filteredStudentsTable = useMemo(() => {
    if (!searchQuery) return activeStudents
    const q = searchQuery.toLowerCase()
    return activeStudents.filter(s => 
      s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
    )
  }, [activeStudents, searchQuery])

  const totalAllStudents = useMemo(() => branches.reduce((acc, b) => acc + b.years.reduce((yAcc, y) => yAcc + y.sections.reduce((sAcc, s) => sAcc + s.students.length, 0), 0), 0), [branches])
  const totalAllOnline = useMemo(() => branches.reduce((acc, b) => acc + b.years.reduce((yAcc, y) => yAcc + y.sections.reduce((sAcc, s) => sAcc + s.students.filter(st => st.status==='online').length, 0), 0), 0), [branches])
  const totalAllSections = useMemo(() => branches.reduce((acc, b) => acc + b.years.reduce((yAcc, y) => yAcc + y.sections.length, 0), 0), [branches])

  return (
    <div className="space-y-6">
      {!isFaculty && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 backdrop-blur p-4 md:p-5">
          <h3 className="text-cyan-200 font-semibold">Student Academic Structure</h3>
          <p className="text-xs text-cyan-100/80 mt-1">
            Browse branch → year → students. Students can view status and join meetings from the Meetings section.
          </p>
          <ul className="mt-3 text-xs text-cyan-100/80 space-y-1 list-disc list-inside">
            <li>Can browse students and view online/offline status</li>
            <li>Can join meetings using meeting ID</li>
            <li>Cannot start/conduct meetings or use admin tools</li>
          </ul>
        </div>
      )}

      {isFaculty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Students" value={totalAllStudents.toLocaleString()} icon={<Users className="w-6 h-6 text-blue-100" />} gradient="from-blue-500 to-blue-600" />
          <StatCard title="Active Branches" value={branches.length} icon={<Building2 className="w-6 h-6 text-purple-100" />} gradient="from-purple-500 to-purple-600" />
          <StatCard title="Total Sections" value={totalAllSections} icon={<Layout className="w-6 h-6 text-emerald-100" />} gradient="from-emerald-500 to-emerald-600" />
          <StatCard title="Online Now" value={totalAllOnline} icon={<Activity className="w-6 h-6 text-amber-100" />} gradient="from-amber-500 to-orange-500" />
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-start`}>
        
        {/* LEFT HIERARCHY PANEL */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4 flex flex-col h-auto md:h-[calc(100vh-140px)] md:sticky md:top-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Academic Structure</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage departments & sections</p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300 shadow-inner">{branches.length} Branches</div>
            </div>

            <div className="flex-1 overflow-hidden">
              <AccordionBranchTree
              branches={branches}
              activeBranchId={activeBranchId}
              activeYearId={activeYearId}
              activeSectionId={activeSectionId}
              selectedIds={selectedStudentIds}
              canBulkSelect={isFaculty}
              onActivateBranch={(branchId) => {
                const branch = branches.find((item) => item.id === branchId)
                setActiveBranchId(branchId)
                setActiveYearId(branch?.years[0]?.id || null)
                setActiveSectionId(branch?.years[0]?.sections[0]?.id || null)
              }}
              onActivateYear={(branchId, yearId) => {
                setActiveBranchId(branchId)
                setActiveYearId(yearId)
                const branch = branches.find((item) => item.id === branchId)
                const year = branch?.years.find((item) => item.id === yearId)
                setActiveSectionId(year?.sections[0]?.id || null)
              }}
              onActivateSection={(branchId, yearId, sectionId) => {
                setActiveBranchId(branchId)
                setActiveYearId(yearId)
                setActiveSectionId(sectionId)
              }}
              onSelectAllBranch={toggleSelectAllBranch}
              onSelectAllYear={toggleSelectAllYear}
              onCreateSection={createSection}
              onRenameSection={renameSection}
              onDeleteSection={deleteSection}
              onStartMeetingForSection={startMeetingForSection}
            />
            </div>
          </div>
        </aside>

        {/* CENTER MAIN CONTENT: DATA TABLE OR STUDENT CARDS */}
        <section className={`md:col-span-8 ${isFaculty ? 'lg:col-span-6' : 'lg:col-span-9'} space-y-4 flex flex-col h-[500px] md:h-[calc(100vh-140px)]`}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden flex flex-col h-full shadow-2xl">
            
            {/* Table Header / Selection Header */}
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-slate-800/80 to-slate-900/80 shrink-0">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-white break-words whitespace-normal leading-tight drop-shadow-md">
                    {activeBranch ? activeBranch.name : 'Select a Branch'}
                  </h2>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-300 mt-1.5">
                    {activeYear && <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-400/20">{ORDINALS[activeYear.year - 1]} Year</span>}
                    {activeYear && activeSection && <ChevronRight className="w-3 h-3 text-slate-500" />}
                    {activeSection && <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/20">{activeSection.name}</span>}
                  </div>
                </div>
                {activeSection && (
                  <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-600/50 text-slate-300 text-sm font-medium rounded-lg shadow-inner">
                    <Users className="w-4 h-4 text-emerald-400" /> {activeStudents.length} Enrolled
                  </div>
                </div>
                )}
              </div>

              {/* Toolbar Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
                {isFaculty && activeSection && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={startCallWithSelectedStudents}
                      disabled={selectedStudentIds.size === 0}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      <Video className="w-4 h-4" /> Start Section
                    </button>
                    <button
                      onClick={selectAllActiveStudents}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600/50"
                    >
                      <CheckSquare className="w-4 h-4" /> Select All
                    </button>
                    <button
                      onClick={clearAllActiveStudents}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-600/50"
                    >
                      <Square className="w-4 h-4" /> Clear All
                    </button>
                    
                    <div className="relative ml-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" placeholder="Search students..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:border-blue-500 focus:outline-none w-48 lg:w-64" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Table Area (Faculty) or List Area (Student) */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/30">
              {!activeSection ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                    <Layout className="w-8 h-8 text-blue-400 opacity-50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No Section Selected</h3>
                  <p className="text-slate-400 max-w-sm mx-auto">Navigate through the academic structure on the left and select a section to view its students.</p>
                </div>
              ) : (
                <>
              {!isFaculty ? (
                <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar">
                  {/* Student View (Read Only Cards) */}
                  {activeStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No students found in this section.</p>
                    </div>
                  ) : (
                    activeStudents.slice(0, visibleCount).map((student) => {
                      const inCall = participantIds.has(student.uid);
                      return (
                        <div key={student.uid} className="flex items-center justify-between p-3 rounded-xl border bg-slate-800/40 border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                              {student.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-100 truncate">{student.name}</div>
                              <div className="text-xs text-slate-400 truncate">{student.studentId}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${student.status === 'online' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-slate-700/50 text-slate-400 border-slate-600/50'}`}>
                              {student.status}
                            </span>
                            {inCall && <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase border border-indigo-400/20"><Video className="w-3 h-3 inline" /> In Call</span>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : (
                // Professional ERP Data Table
                <div className="flex-1 overflow-auto custom-scrollbar relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-800 border-y border-slate-700 text-slate-400 text-xs uppercase font-semibold z-10 shadow-md">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <button onClick={selectedStudentIds.size === activeStudents.length ? clearAllActiveStudents : selectAllActiveStudents} className="text-slate-400 hover:text-white transition-colors">
                            {selectedStudentIds.size === activeStudents.length && activeStudents.length > 0 ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="p-4">Student Info</th>
                        <th className="p-4 hidden sm:table-cell">ID</th>
                        <th className="p-4 hidden md:table-cell">Year / Sec</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredStudentsTable.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-500">
                            <File className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No records match your criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudentsTable.slice(0, visibleCount).map((s) => {
                          const isSel = selectedStudentIds.has(s.uid);
                          return (
                            <tr 
                              key={s.uid} 
                              draggable 
                              onDragStart={(e) => e.dataTransfer.setData('application/x-student-uid', s.uid)}
                              className={`group hover:bg-slate-800/30 transition-colors cursor-grab active:cursor-grabbing ${isSel ? 'bg-blue-500/5' : ''}`}
                            >
                              <td className="p-4 text-center">
                                <button onClick={() => toggleStudent(s)} className="text-slate-500 group-hover:text-slate-300">
                                  {isSel ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">{s.avatar}</div>
                                  <div>
                                    <div className="text-sm font-semibold text-slate-200 group-hover:text-white">{s.name}</div>
                                    <div className="text-xs text-slate-500">{s.studentId.toLowerCase()}@university.edu</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 hidden sm:table-cell text-sm text-slate-400 font-mono">{s.studentId}</td>
                              <td className="p-4 hidden md:table-cell text-sm text-slate-400">{ORDINALS[s.year-1]} / {activeSection?.name.split(' ').pop()}</td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="p-1.5 hover:bg-slate-700 rounded text-blue-400" title="View Profile"><Eye className="w-4 h-4" /></button>
                                  <button className="p-1.5 hover:bg-slate-700 rounded text-amber-400" title="Edit Student"><Edit2 className="w-4 h-4" /></button>
                                  <button className="p-1.5 hover:bg-slate-700 rounded text-rose-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                  <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400" title="Transfer"><ArrowRightLeft className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination / Load More Footer */}
              {visibleCount < activeStudents.length && (
                <div className="p-3 bg-slate-800/80 border-t border-slate-700 text-center shrink-0">
                  <button 
                    onClick={() => setVisibleCount((previous) => previous + 30)}
                    className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: ACTION PANELS (Faculty Only) */}
        <aside className={`${isFaculty ? 'md:col-span-12 lg:col-span-3' : 'hidden'} space-y-4 flex flex-col h-auto md:h-[calc(100vh-140px)] md:sticky md:top-6 overflow-y-auto custom-scrollbar pr-1`}>
          {isFaculty ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 shadow-2xl flex flex-col h-full gap-4">
              <Suspense fallback={null}>
                <DragDropArea
                  participants={participantStudents}
                  isDragOver={isDragOver}
                  onDragEnter={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
                    event.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDropStudent={(event: React.DragEvent<HTMLDivElement>) => {
                    event.preventDefault()
                    const uid = event.dataTransfer.getData('application/x-student-uid')
                    if (uid) { addParticipantByUid(uid); }
                    setIsDragOver(false)
                  }}
                  onRemoveParticipant={removeParticipant}
                />
              </Suspense>
              <div className="space-y-3 pt-1 mt-auto">
                <button
                  onClick={startCallWithParticipantStudents}
                  disabled={participantStudents.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed border border-blue-400/30 shadow-lg shadow-blue-500/20 px-4 py-3 text-sm font-bold text-white transition-all"
                >
                  <Video className="w-5 h-5" /> Start Meeting
                </button>
                <button
                  onClick={() => setParticipantIds(new Set())}
                  disabled={participantStudents.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 transition-all px-4 py-3 text-sm font-semibold"
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <CalendarDays className="h-4 w-4 text-cyan-300" /> My Upcoming Meetings
                </div>
                {studentUpcomingMeetings.length === 0 ? (
                  <p className="text-xs text-slate-500">No upcoming meetings scheduled.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentUpcomingMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <div className="text-xs text-slate-100 truncate">{meeting.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{meeting.date.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <h3 className="text-sm font-semibold text-white mb-2">Attendance History</h3>
                {studentAttendanceHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No attendance data yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentAttendanceHistory.slice(0, 6).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-100 truncate">{entry.title}</p>
                          <p className="text-[11px] text-slate-500">{entry.date.toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${entry.status === 'Attended' ? 'text-emerald-200 border-emerald-400/30 bg-emerald-500/10' : 'text-rose-200 border-rose-400/30 bg-rose-500/10'}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <Bell className="h-4 w-4 text-amber-300" /> Personal Notifications / Reminders
                </div>
                {studentNotifications.length === 0 ? (
                  <p className="text-xs text-slate-500">No reminders yet.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-auto pr-1">
                    {studentNotifications.slice(0, 6).map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <p className="text-xs text-slate-100">{notification.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                  <Download className="h-4 w-4 text-emerald-300" /> Shared Recording / Resources
                </div>
                {studentSharedResources.length === 0 ? (
                  <p className="text-xs text-slate-500">No shared recordings/resources yet.</p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-auto pr-1">
                    {studentSharedResources.slice(0, 8).map((resource) => (
                      <div key={resource.id} className="rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2">
                        <p className="text-xs text-slate-100 truncate">{resource.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{resource.date.toLocaleDateString()}</p>
                        <div className="flex gap-2 mt-2">
                          {resource.recording && (
                            <button
                              onClick={() => onOpenRecording?.(resource.recording!)}
                              className="px-2 py-1 rounded text-[11px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-200"
                            >
                              Open
                            </button>
                          )}
                          {resource.summary && (
                            <button
                              onClick={() => onDownloadResourceSummary?.(resource.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200"
                            >
                              <FileText className="w-3 h-3" /> Summary
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ADMIN MANAGEMENT WORKSPACE (Bottom Row) */}
      {isFaculty && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
          
          <div className="p-6 md:p-8 bg-slate-900/60">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: UserPlus, title: "Enroll Student", desc: "Add a new student manually", onClick: () => setIsAddStudentOpen(true), colorClass: "bg-blue-500/20 text-blue-400" },
                  { icon: Building2, title: "Add Branch", desc: "Create a new academic branch", onClick: () => setIsAddBranchOpen(true), colorClass: "bg-purple-500/20 text-purple-400" },
                  { icon: UploadCloud, title: "Bulk Import", desc: "Upload students via CSV/Excel", onClick: () => setIsBulkImportOpen(true), colorClass: "bg-cyan-500/20 text-cyan-400" },
                  { icon: FileSpreadsheet, title: "Export Data", desc: "Download records as CSV", onClick: () => pushToast('Export feature coming soon', 'info'), colorClass: "bg-green-500/20 text-green-400" },
                  { icon: FileText, title: "Generate Report", desc: "Create academic performance report", onClick: () => pushToast('Report generation started', 'success'), colorClass: "bg-rose-500/20 text-rose-400" },
                  { icon: ArrowRightLeft, title: "Transfer Student", desc: "Move student between sections", onClick: () => pushToast('Select a student to transfer', 'info'), colorClass: "bg-indigo-500/20 text-indigo-400" }
                ].map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.onClick}
                      className="flex flex-col items-start p-6 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/20 transition-all text-left group shadow-xl"
                    >
                      <div className={`p-3.5 rounded-xl mb-4 ${action.colorClass} shadow-lg`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="text-white font-bold text-lg mb-2 group-hover:text-blue-300 transition-colors">{action.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{action.desc}</p>
                    </motion.button>
                  )
                })}
              </div>
          </div>
        </div>
      )}

      {/* ERB Modals */}
      <BulkImportModal isOpen={isBulkImportOpen} onClose={() => setIsBulkImportOpen(false)} pushToast={pushToast} />
      <BranchModal isOpen={isAddBranchOpen} onClose={() => setIsAddBranchOpen(false)} onAdd={addBranch} />
      
      {isAddStudentOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl h-[80vh]">
            <AddStudentForm branchOptions={branchOptions} onAddStudent={(p) => { addStudent(p); setIsAddStudentOpen(false); }} onCancel={() => setIsAddStudentOpen(false)} />
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className={`rounded-xl border px-4 py-2 text-sm shadow-lg backdrop-blur ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-300/30 text-emerald-100'
                  : toast.type === 'error'
                    ? 'bg-rose-500/20 border-rose-300/30 text-rose-100'
                    : 'bg-slate-700/40 border-slate-400/30 text-slate-100'
              }`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
