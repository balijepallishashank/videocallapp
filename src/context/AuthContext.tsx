import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { getUserProfile, saveUserProfile } from '../services/db';

export type UserRole = 'faculty' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  studentId?: string;
  facultyProfile?: Record<string, unknown>;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, name: string, studentId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch real profile from Firestore to get accurate role, name, and studentId
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setCurrentUser(profile);
            // Also update localStorage as a tiny cache (optional)
            localStorage.setItem(`profile_${user.uid}`, JSON.stringify(profile));
          } else {
            // Fallback for extremely fresh accounts or mock dev users
            const fallbackProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              name: user.displayName || 'User',
              role: user.email?.includes('faculty') ? 'faculty' : 'student',
            };
            setCurrentUser(fallbackProfile);
            localStorage.setItem(`profile_${user.uid}`, JSON.stringify(fallbackProfile));
          }
        } catch (err) {
          console.error("Failed to fetch user profile", err);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // In a real app, you would verify the role against Firestore after login
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, role: UserRole, name: string, studentId?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = {
      id: userCredential.user.uid,
      email,
      name,
      role,
      ...(studentId && { studentId }),
    };
    
    // Save to Firestore so role persists across sessions
    try {
      const { id, ...profileData } = profile;
      await saveUserProfile(id, profileData);
    } catch (err) {
      console.error("Failed to save profile to Firestore during registration", err);
    }
    
    // Store in localStorage as cache
    localStorage.setItem(`profile_${userCredential.user.uid}`, JSON.stringify(profile));
    setCurrentUser(profile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    firebaseUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
