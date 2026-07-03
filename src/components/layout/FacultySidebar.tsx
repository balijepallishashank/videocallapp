import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Video, CalendarClock, BarChart3, Settings } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
}

const NAV_ITEMS = [
  { path: '/faculty/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: '/faculty/classes', label: 'My Classes', icon: <BookOpen className="w-5 h-5" /> },
  { path: '/faculty/meetings', label: 'Meetings', icon: <Video className="w-5 h-5" /> },
  { path: '/faculty/scheduled-meetings', label: 'Scheduled Meetings', icon: <CalendarClock className="w-5 h-5" /> },
  { path: '/faculty/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { path: '/faculty/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

export default function FacultySidebar({ isOpen }: SidebarProps) {
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">VP</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Video Pro</div>
                <div className="text-[10px] text-slate-500 font-medium">Faculty Portal</div>
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-medium ${isActive ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20 shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'}`}
                >
                  <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-white/5 text-[11px] text-slate-600">
            Video Pro · Faculty Portal
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}
