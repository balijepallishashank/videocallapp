import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { auth } from '../config/firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { getUserProfile, saveUserProfile } from '../services/db'

export type UserRole = 'faculty' | 'student'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  employeeId?: string
  designation?: string
  subjects?: string[]
  studentId?: string
  phone?: string
  profilePhoto?: string
  darkMode?: boolean
  createdAt?: string
  updatedAt?: string
}

interface AuthContextType {
  currentUser: UserProfile | null
  firebaseUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  register: (
    email: string,
    password: string,
    role: UserRole,
    name: string,
    extraFields: Record<string, unknown>,
  ) => Promise<UserProfile>
  updateCurrentUserProfile: (updates: Partial<UserProfile> & Record<string, unknown>) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isRegistering = useRef(false)

  useEffect(() => {
    const storedKeys = Object.keys(localStorage);
    const profileKey = storedKeys.find(k => k.startsWith('profile_'));
    if (profileKey) {
      try {
        const stored = localStorage.getItem(profileKey);
        if (stored) {
          const profile = JSON.parse(stored);
          if (profile.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (e) {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (!user) {
        setCurrentUser(null)
        setIsLoading(false)
        return
      }

      if (isRegistering.current) {
        // Registration will handle setting the user profile
        return
      }

      try {
        const profile = await getUserProfile(user.uid)
        if (profile) {
          setCurrentUser(profile)
          localStorage.setItem(`profile_${user.uid}`, JSON.stringify(profile))
          if (profile.darkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        } else {
          setCurrentUser(null)
        }
      } catch {
        setCurrentUser(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const profile = await getUserProfile(cred.user.uid)
    if (!profile) throw new Error('No profile found for this account.')
    if (!profile.role) throw new Error('User profile is incomplete: missing role.')

    setCurrentUser(profile)
    localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile))
    if (profile.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return profile
  }

  const register = async (
    email: string,
    password: string,
    role: UserRole,
    name: string,
    extraFields: Record<string, unknown>,
  ) => {
    isRegistering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const profile: UserProfile = {
      id: cred.user.uid,
      email,
      name,
      role,
      ...extraFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { id, ...profileData } = profile
    await saveUserProfile(id, profileData)
    localStorage.setItem(`profile_${cred.user.uid}`, JSON.stringify(profile))
    setCurrentUser(profile)
    if (profile.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return profile
    } finally {
      isRegistering.current = false;
    }
  }

  const updateCurrentUserProfile = (updates: Partial<UserProfile> & Record<string, unknown>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev

      const nextUser = { ...prev, ...updates }
      localStorage.setItem(`profile_${prev.id}`, JSON.stringify(nextUser))
      if (nextUser.darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return nextUser as UserProfile
    })
  }

  const logout = async () => {
    const user = auth.currentUser
    if (user) {
      localStorage.removeItem(`profile_${user.uid}`)
      document.documentElement.classList.remove('dark')
    }
    await signOut(auth)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        register,
        updateCurrentUserProfile,
        logout,
      }}
    >
      {isLoading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
            <div className="absolute inset-2 animate-spin rounded-full border-4 border-emerald-400 border-b-transparent" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
          <p className="text-slate-500 text-sm tracking-widest uppercase">Loading…</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
