import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  GraduationCap,
  Users,
  CheckCircle2,
  Clapperboard,
  Settings,
} from 'lucide-react'

export type AcademicNavItem =
  | 'dashboard'
  | 'meetings'
  | 'academic-structure'
  | 'students'
  | 'attendance'
  | 'recordings'
  | 'settings'

const NAV_ITEMS: Array<{ id: AcademicNavItem; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
  { id: 'academic-structure', label: 'Academic Structure', icon: <GraduationCap className="w-5 h-5" /> },
  { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
  { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 className="w-5 h-5" /> },
  { id: 'recordings', label: 'Recordings', icon: <Clapperboard className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

interface AcademicSidebarProps {
  isOpen: boolean
  selected: AcademicNavItem
  onSelect: (id: AcademicNavItem) => void
  onClose?: () => void
}

export default function AcademicSidebar({ isOpen, selected, onSelect, onClose }: AcademicSidebarProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-20 md:hidden"
        />
      )}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-30 overflow-hidden shadow-2xl md:shadow-none"
      >
        <div className="h-full w-[280px] glass-dark border-r border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/70 backdrop-blur-lg">
          <div className="px-5 py-5 border-b border-white/10">
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

          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
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

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 text-xs text-slate-500">
            Sidebar stays fixed; content updates in the middle.
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
