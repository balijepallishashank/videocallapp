import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Moon, Sun, HelpCircle } from 'lucide-react'
import { useState } from 'react'

// Confirmation Dialog
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass rounded-2xl p-6 border border-slate-700/50 max-w-sm w-full"
          >
            <div className="flex items-start gap-4 mb-4">
              {isDanger && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 rounded-full bg-red-500/20"
                >
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </motion.div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-slate-300 text-sm mt-1">{message}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
              >
                {cancelText}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all ${
                  isDanger
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
                }`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Theme Toggle
export function ThemeToggle({ 
  isDark = true, 
  onChange 
}: { 
  isDark?: boolean
  onChange: (isDark: boolean) => void 
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange(!isDark)}
      className="p-2.5 rounded-lg glass border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white transition-all"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.div>
    </motion.button>
  )
}

// Tooltip Component
export function Tooltip({ 
  content, 
  children 
}: { 
  content: string
  children: React.ReactNode 
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative group">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs whitespace-nowrap z-50"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rounded-sm bg-slate-900 border-r border-b border-slate-700" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Notification Badge
export function NotificationBadge({ 
  count, 
  children 
}: { 
  count: number
  children: React.ReactNode 
}) {
  return (
    <div className="relative inline-block">
      {children}
      {count > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
        >
          {count > 9 ? '9+' : count}
        </motion.div>
      )}
    </div>
  )
}

// Keyboard Shortcuts Dialog
export function KeyboardShortcutsDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const shortcuts = [
    { key: 'M', description: 'Toggle microphone' },
    { key: 'V', description: 'Toggle camera' },
    { key: 'S', description: 'Start screen share' },
    { key: 'H', description: 'Raise hand' },
    { key: 'Esc', description: 'Close dialog' },
    { key: '?', description: 'Show shortcuts' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl p-6 border border-slate-700/50 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Keyboard Shortcuts
              </h3>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </motion.button>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30 transition-all"
                >
                  <span className="text-slate-300">{shortcut.description}</span>
                  <kbd className="px-3 py-1 rounded-md bg-slate-700/50 border border-slate-600 text-white text-sm font-mono font-semibold">
                    {shortcut.key}
                  </kbd>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Info Toast with action
export function InfoToast({ 
  icon, 
  title, 
  description, 
  action,
  onDismiss 
}: { 
  icon?: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  onDismiss: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass rounded-xl p-4 border border-blue-500/30 max-w-md mx-auto"
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-blue-400 flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{title}</h4>
          <p className="text-xs text-slate-300 mt-1">{description}</p>
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={action.onClick}
              className="text-xs text-blue-400 hover:text-blue-300 mt-2 font-semibold"
            >
              {action.label}
            </motion.button>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 flex-shrink-0"
        >
          ✕
        </motion.button>
      </div>
    </motion.div>
  )
}
