import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/routing/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import FacultyDashboardView from './features/dashboard/FacultyDashboardView'
import StudentDashboardView from './features/dashboard/StudentDashboardView'
import ClassDetailView from './features/dashboard/ClassDetailView'
import { joinClassByCode } from './services/db'
import {
  AttendanceView,
  ClassesView,
  FacultyMeetingsView,
  ScheduledMeetingsView,
  JoinMeetingView,
  AnalyticsView,
  MeetingHistoryView,
  ProfileView,
  RecordingsView,
  SettingsPageWrapper,
} from './pages/SubViews'

function HomeRedirect() {
  const { isAuthenticated, currentUser, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={currentUser.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />
}

function LoginPageRedirect() {
  const { isAuthenticated, currentUser, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>
  }

  if (isAuthenticated && currentUser) {
    return <Navigate to={currentUser.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />
  }

  return <LoginPage />
}

function JoinClassLinkRoute() {
  const { classCode } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, currentUser, isLoading } = useAuth()

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>
  }

  if (!classCode) {
    return <Navigate to="/" replace />
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to={`/login?join=${encodeURIComponent(classCode)}`} replace />
  }

  if (currentUser.role !== 'student') {
    return <Navigate to="/faculty/classes" replace />
  }

  void joinClassByCode(currentUser.id, currentUser.name, currentUser.email, classCode)
    .then((result) => navigate(`/student/class/${result.classId}`, { replace: true }))
    .catch(() => navigate('/student/classes', { replace: true }))

  return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" /></div>
}

export default function App() {
  return (
    <Routes>
      <Route path="/join/:classCode" element={<JoinClassLinkRoute />} />
      <Route path="/login" element={<LoginPageRedirect />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboardView />} />
        <Route path="classes" element={<ClassesView />} />
        <Route path="class/:classId" element={<ClassDetailView />} />
        <Route path="meetings" element={<FacultyMeetingsView />} />
        <Route path="scheduled-meetings" element={<ScheduledMeetingsView />} />
        <Route path="analytics" element={<AnalyticsView />} />
        <Route path="profile" element={<ProfileView />} />
        <Route path="settings" element={<SettingsPageWrapper />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardView />} />
        <Route path="classes" element={<ClassesView />} />
        <Route path="class/:classId" element={<ClassDetailView />} />
        <Route path="meetings" element={<JoinMeetingView />} />
        <Route path="meeting-history" element={<MeetingHistoryView />} />
        <Route path="recordings" element={<RecordingsView />} />
        <Route path="attendance" element={<AttendanceView />} />
        <Route path="profile" element={<ProfileView />} />
        <Route path="settings" element={<SettingsPageWrapper />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
