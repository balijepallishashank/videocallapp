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
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isRegistering = useRef(false)

  useEffect(() => {
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
    return profile
    } finally {
      isRegistering.current = false;
    }
  }

  const logout = async () => {
    const user = auth.currentUser
    if (user) localStorage.removeItem(`profile_${user.uid}`)
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
        logout,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
