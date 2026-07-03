import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles, User, GraduationCap, BadgeInfo } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { joinClassByCode } from '../services/db'

export type UserRole = 'faculty' | 'student'

export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pendingJoinCode = searchParams.get('join')?.trim().toUpperCase() || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentProfilePhoto, setStudentProfilePhoto] = useState('')

  const [facultyName, setFacultyName] = useState('')
  const [facultyEmployeeId, setFacultyEmployeeId] = useState('')
  const [facultyDesignation, setFacultyDesignation] = useState('')
  const [facultySubjects, setFacultySubjects] = useState('')
  const [facultyProfilePhoto, setFacultyProfilePhoto] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()

      if (isSignUp) {
        if (selectedRole === 'student') {
          if (!studentName.trim()) throw new Error('Student name is required.')

          const profile = await register(normalizedEmail, password, 'student', studentName.trim(), {
            studentId: studentId.trim() || undefined,
            profilePhoto: studentProfilePhoto.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentName.trim())}`,
          })

          if (pendingJoinCode) {
            const result = await joinClassByCode(profile.id, profile.name, profile.email, pendingJoinCode)
            navigate(`/student/class/${result.classId}`)
            return
          }

          navigate('/student/dashboard')
          return
        }

        if (!facultyName.trim()) throw new Error('Faculty name is required.')
        if (!facultyEmployeeId.trim()) throw new Error('Faculty employee ID is required.')
        if (!facultyDesignation.trim()) throw new Error('Designation is required.')

        const subjectList = facultySubjects.split(',').map((subject) => subject.trim()).filter(Boolean)

        await register(normalizedEmail, password, 'faculty', facultyName.trim(), {
          employeeId: facultyEmployeeId.trim(),
          designation: facultyDesignation.trim(),
          subjects: subjectList,
          profilePhoto: facultyProfilePhoto.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(facultyName.trim())}`,
        })

        navigate('/faculty/dashboard')
        return
      }

      const profile = await login(normalizedEmail, password)

      if (pendingJoinCode && profile.role === 'student') {
        const result = await joinClassByCode(profile.id, profile.name, profile.email, pendingJoinCode)
        navigate(`/student/class/${result.classId}`)
        return
      }

      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An authentication error occurred.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_52%,_#020617)] flex items-center justify-center p-4 py-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-10 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-100 text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Video Pro class workspace
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight max-w-xl">
            A cleaner login flow for the redesigned class hub.
          </h1>
          <p className="mt-4 max-w-xl text-slate-300 text-sm md:text-base leading-7">
            Sign in or create a faculty/student profile without the old branch, year, or section fields. The workspace now keys everything off classes and memberships.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="font-semibold text-white">Unified access</p>
              <p className="mt-1 text-slate-400">One entry point for both roles.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="font-semibold text-white">Class-first design</p>
              <p className="mt-1 text-slate-400">No academic hierarchy fields.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <p className="font-semibold text-white">Fast navigation</p>
              <p className="mt-1 text-slate-400">Dashboards open directly to work.</p>
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 md:p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl"
        >
          <div className="flex gap-2 mb-6 bg-slate-900/80 p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false)
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${!isSignUp ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true)
                setError('')
              }}
              className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${isSignUp ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Register
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('student')
                  setError('')
                }}
                className={`py-2 rounded-lg font-semibold text-sm border transition-all ${selectedRole === 'student' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'text-slate-400 border-white/5 bg-slate-950/30 hover:bg-slate-950/60'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('faculty')
                  setError('')
                }}
                className={`py-2 rounded-lg font-semibold text-sm border transition-all ${selectedRole === 'faculty' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'text-slate-400 border-white/5 bg-slate-950/30 hover:bg-slate-950/60'}`}
              >
                Faculty
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex gap-2 items-start">
              <BadgeInfo className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp ? (
              selectedRole === 'student' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Student Registration ID</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. STU12345"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Profile Photo URL</label>
                    <input
                      type="url"
                      value={studentProfilePhoto}
                      onChange={(e) => setStudentProfilePhoto(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={facultyName}
                        onChange={(e) => setFacultyName(e.target.value)}
                        placeholder="Prof. Jane Smith"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Faculty Employee ID</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={facultyEmployeeId}
                        onChange={(e) => setFacultyEmployeeId(e.target.value)}
                        placeholder="FAC123"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Designation</label>
                    <input
                      type="text"
                      value={facultyDesignation}
                      onChange={(e) => setFacultyDesignation(e.target.value)}
                      placeholder="Assistant Professor"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Subjects Taught (comma separated)</label>
                    <input
                      type="text"
                      value={facultySubjects}
                      onChange={(e) => setFacultySubjects(e.target.value)}
                      placeholder="Data Structures, DBMS"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1">Profile Photo URL</label>
                    <input
                      type="url"
                      value={facultyProfilePhoto}
                      onChange={(e) => setFacultyProfilePhoto(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 text-sm transition-all"
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </motion.section>
      </div>
    </main>
  )
}
