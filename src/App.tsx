import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/routing/ProtectedRoute'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } 
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
