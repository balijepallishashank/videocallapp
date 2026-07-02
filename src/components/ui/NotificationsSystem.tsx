import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import IconButton from './IconButton'
import { EmptyState } from '../feedback/EmptyStates'

// Browser notification service
export function useBrowserNotification() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      setPermission('granted')
      return true
    }

    if (Notification.permission === 'denied') {
      setPermission('denied')
      return false
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }

  const sendNotification = (
    title: string,
    options?: NotificationOptions
  ) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/video-pro-icon.png',
        ...options,
      })
    }
  }

  return { permission, requestPermission, sendNotification }
}

// In-app notification toast
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    notification: Omit<Notification, 'id'>
  ) => {
    const id = Date.now().toString()
    const fullNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000,
    }

    setNotifications((prev) => [...prev, fullNotification])

    if (fullNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, fullNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notifications, addNotification, removeNotification }
}

// Notification item component
function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification
  onDismiss: () => void
}) {
  const iconClasses = {
    success: 'text-green-400 bg-green-500/10',
    error: 'text-red-400 bg-red-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    info: 'text-blue-400 bg-blue-500/10',
  }

  const borderClasses = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    warning: 'border-yellow-500/30',
    info: 'border-blue-500/30',
  }

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: Info,
  }

  const Icon = icons[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 400 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className={`glass rounded-lg p-4 border ${borderClasses[notification.type]} max-w-sm`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconClasses[notification.type]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
          <p className="text-xs text-slate-300 mt-1">{notification.message}</p>
          {notification.action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={notification.action.onClick}
              className="text-xs font-semibold mt-2 text-blue-400 hover:text-blue-300"
            >
              {notification.action.label}
            </motion.button>
          )}
        </div>
          <IconButton onClick={onDismiss} ariaLabel="Dismiss notification" className="text-slate-400 hover:text-slate-200 flex-shrink-0 p-2">
            <X className="w-4 h-4" />
          </IconButton>
      </div>
    </motion.div>
  )
}

// Notification container to display all notifications
export function NotificationContainer({
  notifications,
  onDismiss,
}: {
  notifications: Notification[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-auto">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Meeting reminder notification
export function useMeetingReminder() {
  const { sendNotification } = useBrowserNotification()

  const setMeetingReminder = (
    meetingTitle: string,
    meetingTime: Date,
    minutesBefore = 5
  ) => {
    const now = new Date()
    const reminderTime = new Date(meetingTime.getTime() - minutesBefore * 60000)
    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    if (timeUntilReminder > 0) {
      const timeout = setTimeout(() => {
        sendNotification(`Meeting Reminder`, {
          body: `${meetingTitle} starts in ${minutesBefore} minutes`,
          tag: 'meeting-reminder',
          requireInteraction: true,
        })
      }, timeUntilReminder)

      return () => clearTimeout(timeout)
    }

    return () => {}
  }

  return { setMeetingReminder }
}

// Call notification
export function CallNotification({
  isOpen,
  callerName,
  onAccept,
  onDecline,
}: {
  isOpen: boolean
  callerName: string
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          <motion.div
            className="glass rounded-3xl p-8 border border-slate-700/50 max-w-sm mx-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center"
            >
              <Bell className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white text-center mb-2">
              {callerName}
            </h2>
            <p className="text-center text-slate-300 mb-8">is calling you...</p>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDecline}
                className="flex-1 px-6 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 font-semibold transition-all"
              >
                Decline
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className="flex-1 px-6 py-3 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 font-semibold transition-all"
              >
                Accept
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Notification bell with badge
export function NotificationBell({
  unreadCount,
  onBellClick,
}: {
  unreadCount: number
  onBellClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onBellClick}
      className="relative p-2 rounded-lg glass border border-slate-700/50 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 transition-all"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
    </motion.button>
  )
}

// Notification panel
export function NotificationPanel({
  isOpen,
  notifications,
  onClose,
  onClear,
}: {
  isOpen: boolean
  notifications: Array<{ id: string; title: string; message: string; timestamp: Date }>
  onClose: () => void
  onClear: () => void
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 h-full w-80 glass border-l border-slate-700/50 p-4 z-50 overflow-y-auto"
            role="region"
            aria-label="Notifications panel"
          >
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <p className="text-xs text-slate-400 mt-1">Meeting invites, reminders, and recent activity appear here.</p>
              </div>
              <IconButton onClick={onClose} ariaLabel="Close notifications panel" className="text-slate-400 p-2">
                ✕
              </IconButton>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  message="No notifications yet"
                  subMessage="New meeting invites, reminders, and activity updates will show up here."
                />
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/50"
                  >
                    <h4 className="font-semibold text-white text-sm">{notif.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {notif.timestamp.toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={onClear}
                className="w-full px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 text-sm font-semibold transition-all"
              >
                Clear all
              </motion.button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
