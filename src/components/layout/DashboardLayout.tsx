import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useRole } from '../../hooks/useRole'
import Toast from '../ui/Toast'
import { NotificationBell, NotificationPanel } from '../ui/NotificationsSystem'
import ProfileDropdown from '../ui/ProfileDropdown'
import FacultySidebar from './FacultySidebar'
import StudentSidebar from './StudentSidebar'
import { logActivity, subscribeToLiveMeetings, subscribeToNotifications, updateUserPresenceStatus, subscribeToClasses, deleteNotification, type LiveMeetingInvite } from '../../services/db'

interface ToastItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export default function DashboardLayout() {
  const { currentUser, logout } = useAuth()
  const { isFaculty, isStudent, role } = useRole()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [liveInvite, setLiveInvite] = useState<LiveMeetingInvite | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((previous) => [...previous, { id, message, type }])
    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  useEffect(() => {
    if (!currentUser) return

    updateUserPresenceStatus(currentUser.id, 'online').catch(() => {})
    logActivity(currentUser.id, currentUser.name, 'User Session Start', `${role} role`).catch(() => {})

    const handleUnload = () => {
      updateUserPresenceStatus(currentUser.id, 'offline').catch(() => {})
    }

    window.addEventListener('beforeunload', handleUnload)

    let isInitialLoad = true
    const unsubscribeNotifications = subscribeToNotifications(currentUser.id, (items) => {
      setNotifications(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.description,
          timestamp: item.createdAt,
        })),
      )

      if (!isInitialLoad) {
        const now = new Date()
        items.forEach((item) => {
          if (!item.read) {
            const created = item.createdAt
            const diffMs = now.getTime() - created.getTime()
            if (diffMs >= 0 && diffMs < 15000) {
              addToast(`${item.title}: ${item.description}`, item.type || 'info')
            }
          }
        })
      }
      isInitialLoad = false
    })

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      updateUserPresenceStatus(currentUser.id, 'offline').catch(() => {})
      unsubscribeNotifications()
    }
  }, [currentUser, role])

  const [enrolledClassIds, setEnrolledClassIds] = useState<string[]>([])

  useEffect(() => {
    if (!currentUser || role !== 'student') return
    const unsub = subscribeToClasses('student', currentUser.id, (classes) => {
      setEnrolledClassIds(classes.map((c) => c.id))
    })
    return () => unsub()
  }, [currentUser, role])

  useEffect(() => {
    const unsubscribeLive = subscribeToLiveMeetings((invites) => {
      if (role === 'faculty') {
        const myFacultyInvite = invites.find((invite) => invite.facultyId === currentUser?.id)
        setLiveInvite(myFacultyInvite || null)
      } else if (role === 'student') {
        const myEnrolledInvite = invites.find((invite) => invite.classId && enrolledClassIds.includes(invite.classId))
        setLiveInvite(myEnrolledInvite || null)
      } else {
        setLiveInvite(null)
      }
    })

    return () => unsubscribeLive()
  }, [enrolledClassIds, role, currentUser])

  const joinLiveInvite = useCallback(
    (invite: LiveMeetingInvite) => {
      if (invite.classId) {
        navigate(`${isFaculty ? '/faculty' : '/student'}/class/${invite.classId}?join=true`)
        return
      }

      navigate(isFaculty ? '/faculty/classes' : '/student/classes')
      addToast(`Live session available: ${invite.title}`, 'info')
    },
    [addToast, isFaculty, navigate],
  )

  const handleLogout = async () => {
    if (currentUser) {
      await updateUserPresenceStatus(currentUser.id, 'offline').catch(() => {})
      logActivity(currentUser.id, currentUser.name, 'User Logout', `${role} role`).catch(() => {})
    }

    await logout()
    navigate('/login')
  }

  const handleViewProfile = () => {
    navigate(isFaculty ? '/faculty/settings' : '/student/profile')
  }

  const handleSettingsClick = () => {
    navigate(isFaculty ? '/faculty/settings' : '/student/settings')
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex">
      {role === 'faculty' && <FacultySidebar isOpen={sidebarOpen} />}
      {role === 'student' && <StudentSidebar isOpen={sidebarOpen} />}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-200 ease-in-out ${sidebarOpen ? 'md:ml-[280px]' : ''}`}
      >
        <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen((value) => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {isFaculty ? 'Faculty Portal' : 'Student Portal'}
                </h2>
                <p className="text-base font-bold text-white">Video Pro Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell unreadCount={notifications.length} onBellClick={() => setShowNotificationPanel(true)} />
              <ProfileDropdown
                userEmail={currentUser.email}
                onViewProfile={handleViewProfile}
                onSettingsClick={handleSettingsClick}
                onLogoutClick={handleLogout}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet
              context={{
                currentUser,
                role,
                isFaculty,
                isStudent,
                sidebarOpen,
                addToast,
                notifications,
                liveInvite,
                joinLiveInvite,
              }}
            />
          </div>
        </main>
      </div>

      <NotificationPanel
        isOpen={showNotificationPanel}
        notifications={notifications}
        onClose={() => setShowNotificationPanel(false)}
        onClear={async () => {
          const itemsToClear = [...notifications]
          setNotifications([])
          try {
            await Promise.all(itemsToClear.map((item) => deleteNotification(item.id)))
            addToast('All notifications cleared', 'success')
          } catch (err) {
            console.error('Failed to clear notifications from database', err)
            addToast('Failed to clear notifications from database', 'error')
          }
        }}
      />

      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}
