import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  GraduationCap,
  Clapperboard,
  Settings,
} from 'lucide-react'

// Types remain exported for the rest of the app to reuse
export type AcademicNavItem = 'dashboard' | 'academic-structure' | 'meetings' | 'recordings' | 'settings'

export interface StudentRecord {
  id: string
  name: string
  email: string
  attendancePct: number
  status: 'Active' | 'At Risk' | 'Inactive'
  phone?: string
  semester?: number
  yearNumber?: number
  lifecycleStatus?: 'active' | 'graduated'
}

export interface AcademicSection {
  id: string
  name: string
  students: StudentRecord[]
  subject?: string
  faculty?: string
  facultyAdvisor?: string
  classRepresentative?: string
  departmentName?: string
  branchName?: string
  yearNumber?: number
}

export interface AcademicYear {
  id: string
  yearNumber: number
  sections: AcademicSection[]
  students?: StudentRecord[]
}

export interface AcademicBranch {
  id: string
  name: string
  years?: AcademicYear[]
  sections?: AcademicSection[]
}

export interface AcademicDepartment {
  id: string
  name: string
  code?: string
  totalYears?: number
  branches?: AcademicBranch[]
  graduatedStudents?: StudentRecord[]
}

export interface AcademicFacultyRoot {
  id: string
  name: string
  departments: AcademicDepartment[]
}

interface HierarchicalSidebarProps {
  isOpen: boolean
  selected: AcademicNavItem
  onSelect: (id: AcademicNavItem) => void
  userRole: 'faculty' | 'student'
}

const NAV_ITEMS: Array<{ id: AcademicNavItem; label: string; icon: JSX.Element }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'academic-structure', label: 'Academic Structure', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
  { id: 'recordings', label: 'Recordings', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

export default function HierarchicalSidebar({ isOpen, selected, onSelect, userRole }: HierarchicalSidebarProps) {
  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-30 overflow-hidden"
      >
        <div className="h-full w-[320px] glass-dark border-r border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-lg flex flex-col">
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">UV</span>
              </div>
              <div>
                <div className="text-white font-bold leading-tight">University Meet</div>
                <div className="text-xs text-slate-400">Academic video meetings</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 flex-shrink-0">
            {NAV_ITEMS
              .filter((item) => userRole === 'faculty' || (item.id !== 'academic-structure' && item.id !== 'meetings'))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left border ${
                    selected === item.id
                      ? 'bg-blue-500/20 border-blue-400/30 text-blue-100'
                      : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={selected === item.id ? 'text-blue-300' : 'text-slate-400'}>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
          </nav>

          <div className="p-4 border-t border-white/10 text-xs text-slate-500 flex-shrink-0">
            {userRole === 'faculty' ? 'Dashboard' : 'Student Dashboard'}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
