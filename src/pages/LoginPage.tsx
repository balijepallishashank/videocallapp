import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import IconButton from '../components/ui/IconButton'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export type UserRole = 'faculty' | 'student'

export interface FacultyRegistrationDetails {
  facultyName: string
  facultyDepartment: string
  facultyEmail: string
  facultyId: string
  phoneNumber: string
  designation: string
  password?: string
}


export default function LoginPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')

  // Faculty registration fields
  const [facultyName, setFacultyName] = useState('')
  const [facultyDepartment, setFacultyDepartment] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [designation, setDesignation] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (selectedRole === 'student' && !studentId.trim()) {
      setError('Student ID is required')
      return
    }

    if (!email.trim()) {
      setError(selectedRole === 'faculty' ? 'Faculty Email is required' : 'Email is required')
      return
    }

    if (!password) {
      setError('Password is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (isSignUp && selectedRole === 'faculty') {
      if (!facultyName.trim()) return setError('Faculty Name is required')
      if (!facultyDepartment.trim()) return setError('Faculty Department is required')
      if (!facultyId.trim()) return setError('Faculty ID is required')
      if (!phoneNumber.trim()) return setError('Phone Number is required')
      if (!designation.trim()) return setError('Designation is required')
    }

    // Simulate API call
    setIsLoading(true)
    try {
      const normalizedEmail = email.trim().toLowerCase()
      if (isSignUp && selectedRole === 'faculty') {
        await register(normalizedEmail, password, 'faculty', facultyName, facultyId)
      } else if (selectedRole === 'faculty') {
        await login(normalizedEmail, password)
      } else {
        await login(normalizedEmail, password)
      }
      setIsLoading(false)
      navigate('/')
    } catch (err: unknown) {
      setIsLoading(false)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <main role="main" aria-label="Login" className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-start md:items-center justify-center relative overflow-x-hidden overflow-y-auto p-4 md:py-8">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -top-20 -left-20"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -bottom-20 -right-20"
        />
      </div>

      {/* Login Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VideoCall Pro</h1>
          <p className="text-slate-400">University video meetings & academic management</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass rounded-2xl p-8 border border-white/10 shadow-2xl"
        >
          {/* Tab Selection */}
          <div className="flex gap-2 mb-8 bg-slate-800/50 p-1 rounded-lg">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsSignUp(false)
                setError('')
                setConfirmPassword('')
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${!isSignUp
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Login
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsSignUp(true)
                setError('')
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${isSignUp
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Sign Up
            </motion.button>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Continue As</label>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setSelectedRole('faculty')
                  setError('')
                }}
                className={`py-2 rounded-lg font-medium transition-all border ${selectedRole === 'faculty'
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'text-slate-400 border-white/10 hover:text-slate-300'
                  }`}
              >
                Faculty
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setSelectedRole('student')
                  setError('')
                }}
                className={`py-2 rounded-lg font-medium transition-all border ${selectedRole === 'student'
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                    : 'text-slate-400 border-white/10 hover:text-slate-300'
                  }`}
              >
                Student
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Student ID (Student only) */}
            {selectedRole === 'student' && (
              <div className="relative">
                <label htmlFor="student-id" className="block text-sm font-medium text-slate-300 mb-2">Student ID</label>
                <input
                  id="student-id"
                  name="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., STU20250123"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            )}

            {/* Faculty registration fields (Sign up + Faculty only) */}
            {isSignUp && selectedRole === 'faculty' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Faculty Name</label>
                  <input
                    type="text"
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="Dr. Jane Doe"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Faculty Department</label>
                  <input
                    type="text"
                    value={facultyDepartment}
                    onChange={(e) => setFacultyDepartment(e.target.value)}
                    placeholder="CSE"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Faculty ID</label>
                  <input
                    type="text"
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    placeholder="FAC-102"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Assistant Professor"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {selectedRole === 'faculty' ? 'Faculty Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <IconButton
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  ariaLabel={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </IconButton>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Remember Me / Forgot Password */}
            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    className="rounded bg-slate-800 border-white/10 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-slate-400">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {isSignUp
                      ? selectedRole === 'faculty'
                        ? 'Create Faculty Profile'
                        : 'Create Student Account'
                      : `Login as ${selectedRole === 'faculty' ? 'Faculty' : 'Student'}`}
                  </span>
                </>
              )}
            </motion.button>
          </form>


        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-slate-400 text-sm mt-8"
        >
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setConfirmPassword('')
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            {isSignUp ? 'Login' : 'Sign up'}
          </button>
        </motion.p>
      </motion.div>
    </main>
  )
}
