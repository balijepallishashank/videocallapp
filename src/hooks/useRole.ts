import { useAuth } from '../context/AuthContext'

export function useRole() {
  const { currentUser, isLoading } = useAuth()
  const role = currentUser?.role
  return {
    role,
    isFaculty: role === 'faculty',
    isStudent: role === 'student',
    isLoading,
  }
}
