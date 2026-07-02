import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Phone as PhoneIcon, User } from 'lucide-react'
import IconButton from '../../components/ui/IconButton'
import { TeamMember } from './TeamContacts'

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onAddMember: (member: Omit<TeamMember, 'id' | 'status'>) => void
  existingMember?: TeamMember
  isEditing?: boolean
}

const AVATARS = ['👨‍💼', '👩‍💼', '👨‍🎨', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬']
const ROLES = ['Manager', 'Developer', 'Designer', 'QA Engineer', 'Product Owner', 'Intern']
const YEARS = ['1st', '2nd', '3rd', '4th']
const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE']
const SECTIONS = ['A', 'B', 'C']

export default function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  existingMember,
  isEditing = false,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    name: existingMember?.name || '',
    email: existingMember?.email || '',
    phone: existingMember?.phone || '',
    avatar: existingMember?.avatar || AVATARS[0],
    role: existingMember?.role || ROLES[0],
    year: existingMember?.year || '1st',
    branch: existingMember?.branch || 'CSE',
    section: existingMember?.section || 'A',
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.email = 'Email or Phone is required'
      newErrors.phone = 'Email or Phone is required'
    } else {
      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        newErrors.email = 'Invalid email format'
      }
      if (formData.phone && !formData.phone.match(/^[\d\s+()-]{10,}$/)) {
        newErrors.phone = 'Invalid phone format (min 10 digits)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onAddMember(formData)
      setFormData({
        name: '',
        email: '',
        phone: '',
        avatar: AVATARS[0],
        role: ROLES[0],
        year: '1st',
        branch: 'CSE',
        section: 'A',
      })
      onClose()
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      avatar: AVATARS[0],
      role: ROLES[0],
      year: '1st',
      branch: 'CSE',
      section: 'A',
    })
    setErrors({})
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md"
          >
            <div className="glass-dark rounded-2xl p-8 shadow-2xl border border-white/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {isEditing ? 'Edit Member' : 'Add New Member'}
                </h2>
                <IconButton onClick={handleClose} ariaLabel="Close add member dialog" className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </IconButton>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATARS.map((avatar) => (
                      <motion.button
                        key={avatar}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar })}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                          formData.avatar === avatar
                            ? 'ring-2 ring-blue-500 bg-blue-500/20'
                            : 'hover:bg-slate-700/30'
                        }`}
                      >
                        {avatar}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) {
                        setErrors({ ...errors, name: '' })
                      }
                    }}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border transition-all text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) {
                        setErrors({ ...errors, email: '' })
                      }
                    }}
                    placeholder="john@example.com"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border transition-all text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Input */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <PhoneIcon className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (errors.phone) {
                        setErrors({ ...errors, phone: '' })
                      }
                    }}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border transition-all text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
                      errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">Email or phone is required</p>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value as NonNullable<TeamMember['year']> })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      {YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Branch</label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      {BRANCHES.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Section</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      {SECTIONS.map((section) => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 font-medium transition-all"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold transition-all shadow-lg shadow-blue-500/20"
                  >
                    {isEditing ? 'Update' : 'Add'} Member
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
