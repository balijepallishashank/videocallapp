import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, User } from 'lucide-react'

interface ProfileDropdownProps {
  userEmail: string
  onViewProfile: () => void
  onSettingsClick: () => void
  onLogoutClick: () => void
}

export default function ProfileDropdown({ userEmail, onViewProfile, onSettingsClick, onLogoutClick }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Extract name from email
  const userName = userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1)

  return (
    <div className="relative">
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/50 text-white font-medium transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold">{userName}</div>
          <div className="text-xs text-slate-400">{userEmail}</div>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-800/95 backdrop-blur-lg border border-white/20 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{userName}</p>
                  <p className="text-xs text-slate-400">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* View Profile */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                onClick={() => {
                  console.log('View Profile button clicked')
                  onViewProfile()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-blue-500/20 transition-colors text-sm"
              >
                <User className="w-4 h-4 text-blue-400" />
                <span>View Profile</span>
              </motion.button>

              {/* Settings */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
                onClick={() => {
                  console.log('Settings button clicked')
                  onSettingsClick()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-white hover:bg-purple-500/20 transition-colors text-sm"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>Settings</span>
              </motion.button>

              {/* Divider */}
              <div className="my-2 border-t border-white/10" />

              {/* Logout */}
              <motion.button
                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                onClick={() => {
                  onLogoutClick()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-red-300 hover:bg-red-500/20 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
