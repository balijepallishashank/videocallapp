import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Video,
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Phone,
  Briefcase,
  Hash,
  Building2,
  UserRound,
  AlertCircle,
  Activity,
} from 'lucide-react'

export type UserRole = 'faculty' | 'student'

export interface FacultyRegistrationDetails {
  facultyName: string
  facultyDepartment: string
  facultyEmail: string
  facultyId: string
  phoneNumber: string
  designation: string
  password: string
}

export interface StudentLoginDetails {
  studentId: string
  email: string
  password: string
}

interface LoginPageProps {
  onLogin: (
    creds:
      | { role: 'faculty'; email: string; password: string }
      | { role: 'student'; studentId: string; email: string; password: string },
  ) => { success: boolean; message?: string }

  onRegisterFaculty: (details: FacultyRegistrationDetails) => { success: boolean; message?: string }
}

const FEATURES = [
  { icon: Video, label: 'HD Video Meetings', desc: 'Crystal-clear 1080p video with adaptive quality' },
  { icon: Users, label: 'Live Collaboration', desc: 'Real-time whiteboard, polls & breakout rooms' },
  { icon: GraduationCap, label: 'Smart Attendance', desc: 'Automated tracking with AI face recognition' },
  { icon: BookOpen, label: 'Academic Suite', desc: 'Course management, assignments & grading' },
]


function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  rightElement,
  autoComplete,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  icon?: React.ElementType
  rightElement?: React.ReactNode
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-300">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors duration-200 pointer-events-none" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full h-11 ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-11' : 'pr-4'} bg-slate-900/80 border border-white/8 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-blue-500/60 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/20 hover:border-white/15`}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage({ onLogin, onRegisterFaculty }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [rememberMe, setRememberMe] = useState(false)

  // Faculty registration fields
  const [facultyName, setFacultyName] = useState('')
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [designation, setDesignation] = useState('')

  const resetForm = () => {
    setError('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (selectedRole === 'student' && !studentId.trim()) return setError('Student ID is required')
    if (!email.trim()) return setError('Email address is required')
    if (!password) return setError('Password is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (isSignUp && password !== confirmPassword) return setError('Passwords do not match')

    if (isSignUp && selectedRole === 'faculty') {
      if (!facultyName.trim()) return setError('Full name is required')
      if (!facultyDepartment.trim()) return setError('Department is required')
      if (!facultyId.trim()) return setError('Faculty ID is required')
      if (!phoneNumber.trim()) return setError('Phone number is required')
      if (!designation.trim()) return setError('Designation is required')
    }

    setIsLoading(true)
    setTimeout(() => {
      const result =
        isSignUp && selectedRole === 'faculty'
          ? onRegisterFaculty({ facultyName, facultyDepartment, facultyEmail: email, facultyId, phoneNumber, designation, password })
          : selectedRole === 'faculty'
          ? onLogin({ role: 'faculty', email, password })
          : onLogin({ role: 'student', studentId, email, password })

      setIsLoading(false)
      if (!result.success) setError(result.message || 'Invalid credentials. Please try again.')
    }, 900)
  }

  return (
    <div className="min-h-screen w-full flex bg-slate-950">
      {/* ── Left Branding Panel ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0d1424] to-slate-900">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.3, 0.18] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/25 blur-[120px] -top-32 -left-32"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px] bottom-0 right-0"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
            className="absolute w-[280px] h-[280px] rounded-full bg-violet-600/20 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-start gap-8 xl:gap-10 h-full px-10 xl:px-14 py-10 overflow-y-auto custom-scrollbar">
          {/* Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">VideoCall Pro</span>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4 shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
              <p className="text-[11px] font-semibold text-blue-300/80 uppercase tracking-widest">
                Trusted by the Jain University Community
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:gap-4">
              {[
                { label: 'Students', value: '25,000+', icon: Users, color: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20', hoverBorder: 'group-hover:border-blue-400/40' },
                { label: 'Faculty Members', value: '1,800+', icon: Briefcase, color: 'from-indigo-500/10 to-indigo-500/5', border: 'border-indigo-500/20', hoverBorder: 'group-hover:border-indigo-400/40' },
                { label: 'Academic Programs', value: '150+', icon: BookOpen, color: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20', hoverBorder: 'group-hover:border-purple-400/40' },
                { label: 'Platform Uptime', value: '99.9%', icon: Activity, color: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', hoverBorder: 'group-hover:border-emerald-400/40' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  whileHover={{ y: -2 }}
                  className={`group relative p-3.5 xl:p-4 rounded-2xl bg-gradient-to-br ${stat.color} border ${stat.border} ${stat.hoverBorder} backdrop-blur-md transition-all duration-300 overflow-hidden shadow-lg shadow-black/20`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center gap-3 xl:gap-3.5">
                    <div className="p-2 xl:p-2.5 rounded-xl bg-slate-900/60 text-slate-300 group-hover:text-white group-hover:bg-slate-800/80 transition-all shadow-inner border border-white/5 group-hover:border-white/10">
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-lg xl:text-xl font-bold text-white tracking-tight drop-shadow-sm group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all">
                        {stat.value}
                      </div>
                      <div className="text-[10px] xl:text-[11px] font-medium text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Hero Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col shrink-0"
          >
            <span className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
              Jain University Edition • 2026
            </span>
            <h1 className="text-[34px] xl:text-[40px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              The academic<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                video platform
              </span>
              <br />built for learning.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              HD video meetings, smart attendance, live collaboration, and a complete academic management suite — all in one place.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3.5 shrink-0 mb-4"
          >
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right Auth Panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-10 relative bg-slate-950 overflow-y-auto">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 self-start">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">VideoCall Pro</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {isSignUp
                ? 'Join thousands of students and faculty.'
                : 'Sign in to access your academic workspace.'}
            </p>
          </div>

          {/* Sign In / Sign Up tabs */}
          <div className="flex gap-1 mb-6 p-1 bg-white/4 rounded-xl border border-white/6">
            {(['Login', 'Sign Up'] as const).map((label) => {
              const active = label === 'Login' ? !isSignUp : isSignUp
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setIsSignUp(label === 'Sign Up')
                    resetForm()
                  }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-slate-800 text-white shadow-sm border border-white/8'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Role Toggle */}
          <div className="mb-6">
            <p id="role-group-label" className="text-[13px] font-medium text-slate-400 mb-2">
              I am a
            </p>
            <div role="group" aria-labelledby="role-group-label" className="grid grid-cols-2 gap-2">
              {(
                [
                  { role: 'student' as UserRole, label: 'Student', emoji: '🎓', color: 'blue' },
                  { role: 'faculty' as UserRole, label: 'Faculty', emoji: '👨‍🏫', color: 'amber' },
                ] as const
              ).map(({ role, label, emoji, color }) => {
                const active = selectedRole === role
                const colorMap = {
                  blue: active
                    ? 'bg-blue-500/12 border-blue-500/40 text-blue-300'
                    : 'border-white/6 text-slate-500 hover:border-white/12 hover:text-slate-300',
                  amber: active
                    ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
                    : 'border-white/6 text-slate-500 hover:border-white/12 hover:text-slate-300',
                }
                return (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setSelectedRole(role); setError('') }}
                    className={`flex items-center justify-center gap-2.5 py-2.5 rounded-xl border transition-all duration-200 text-sm font-medium ${colorMap[color]}`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    {label}
                    {active && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${isSignUp}-${selectedRole}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Student ID */}
                {selectedRole === 'student' && (
                  <InputField
                    id="student-id"
                    label="Student ID"
                    value={studentId}
                    onChange={setStudentId}
                    placeholder="e.g. STU20250123"
                    icon={Hash}
                    autoComplete="username"
                  />
                )}

                {/* Faculty Sign-Up Extra Fields */}
                {isSignUp && selectedRole === 'faculty' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3.5"
                  >
                    <InputField
                      id="faculty-name"
                      label="Full Name"
                      value={facultyName}
                      onChange={setFacultyName}
                      placeholder="Dr. Jane Doe"
                      icon={UserRound}
                      autoComplete="name"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        id="faculty-dept"
                        label="Department"
                        value={facultyDepartment}
                        onChange={setFacultyDepartment}
                        placeholder="e.g. CSE"
                        icon={Building2}
                      />
                      <InputField
                        id="faculty-id"
                        label="Faculty ID"
                        value={facultyId}
                        onChange={setFacultyId}
                        placeholder="FAC-102"
                        icon={Hash}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        id="faculty-phone"
                        label="Phone Number"
                        type="tel"
                        value={phoneNumber}
                        onChange={setPhoneNumber}
                        placeholder="+1 555 0100"
                        icon={Phone}
                        autoComplete="tel"
                      />
                      <InputField
                        id="faculty-designation"
                        label="Designation"
                        value={designation}
                        onChange={setDesignation}
                        placeholder="Asst. Professor"
                        icon={Briefcase}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Email */}
                <InputField
                  id="email"
                  label={selectedRole === 'faculty' ? 'Institutional Email' : 'Email Address'}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@university.edu"
                  icon={Mail}
                  autoComplete="email"
                />

                {/* Password */}
                <InputField
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  icon={Lock}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                {/* Confirm Password */}
                {isSignUp && (
                  <InputField
                    id="confirm-password"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    icon={Lock}
                    autoComplete="new-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                )}

                {/* Remember / Forgot */}
                {!isSignUp && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer group">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-900 border-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:ring-offset-0"
                      />
                      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                        Stay signed in
                      </span>
                    </label>
                    <a
                      href="#"
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Forgot password?
                    </a>
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.985 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full mt-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? selectedRole === 'faculty'
                            ? 'Create Faculty Account'
                            : 'Create Student Account'
                          : `Continue as ${selectedRole === 'faculty' ? 'Faculty' : 'Student'}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-[11px] text-slate-600 font-medium tracking-wide uppercase">or sign in with</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Social / SSO Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                label: 'Google',
                svg: (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                ),
              },
              {
                label: 'Microsoft',
                svg: (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022"/>
                    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00"/>
                    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF"/>
                    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900"/>
                  </svg>
                ),
              },
            ].map(({ label, svg }) => (
              <button
                key={label}
                type="button"
                className="flex items-center justify-center gap-2.5 h-10 rounded-xl border border-white/8 bg-white/4 hover:bg-white/7 hover:border-white/14 text-slate-300 text-sm font-medium transition-all duration-200"
                onClick={() => setError(`${label} SSO coming soon`)}
              >
                {svg}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Demo credentials */}
          {!isSignUp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-5 p-3.5 rounded-xl bg-white/3 border border-white/6"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Demo Credentials
              </p>
              <div className="space-y-1.5 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Faculty</span>
                  <span className="font-mono text-slate-400">faculty@demo.com · any 6+ chars</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">Student</span>
                  <span className="font-mono text-slate-400">STU001 · student@demo.com · any 6+ chars</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-5 mt-6">
            {[
              { icon: ShieldCheck, label: 'SOC 2 Type II' },
              { icon: Lock, label: 'End-to-end encrypted' },
              { icon: Users, label: 'FERPA Compliant' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Toggle Sign In / Sign Up */}
          <p className="text-center text-[13px] text-slate-500 mt-5">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); resetForm() }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Footer links */}
          <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-white/5">
            {['Privacy Policy', 'Terms of Use', 'Help Center', 'Contact'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-700 mt-3">
            © 2025 VideoCall Pro · All rights reserved
          </p>
        </motion.div>
      </div>
    </div>
  )
}
