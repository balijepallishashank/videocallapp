import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, User, Settings } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

const NAV_ITEMS = [
  { path: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/student/classes', label: 'My Classes', icon: <BookOpen className="w-5 h-5" /> },
  { path: '/student/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  { path: '/student/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

export default function StudentSidebar({ isOpen }: SidebarProps) {
  const location = useLocation()

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-30 overflow-hidden"
      >
        <div className="h-full w-[280px] border-r border-white/10 bg-slate-950/90 backdrop-blur-xl flex flex-col">
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">VP</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Video Pro</div>
                <div className="text-[10px] text-slate-500 font-medium">Student Portal</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                >
                  <span className={isActive ? 'text-violet-400' : 'text-slate-500'}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/5 text-[11px] text-slate-600">
            Video Pro · Student Portal
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
