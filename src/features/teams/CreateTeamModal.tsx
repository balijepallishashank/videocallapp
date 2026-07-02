import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import IconButton from '../../components/ui/IconButton'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTeam: (team: {
    name: string
    description: string
    icon: string
    color: string
  }) => void
}

const TEAM_ICONS = [
  { icon: '🏢', color: 'from-blue-500 to-blue-600' },
  { icon: '🚀', color: 'from-purple-500 to-purple-600' },
  { icon: '⚡', color: 'from-yellow-500 to-orange-500' },
  { icon: '🎯', color: 'from-red-500 to-pink-500' },
  { icon: '💎', color: 'from-cyan-500 to-blue-500' },
  { icon: '🌟', color: 'from-indigo-500 to-purple-500' },
  { icon: '🔥', color: 'from-orange-500 to-red-500' },
  { icon: '🌈', color: 'from-pink-500 to-purple-500' },
  { icon: '⚙️', color: 'from-slate-500 to-slate-600' },
  { icon: '🎨', color: 'from-green-500 to-emerald-500' },
  { icon: '📱', color: 'from-blue-400 to-cyan-400' },
  { icon: '💼', color: 'from-violet-500 to-purple-500' },
]

export default function CreateTeamModal({
  isOpen,
  onClose,
  onCreateTeam,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIcon, setSelectedIcon] = useState(TEAM_ICONS[0])
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  const handleSubmit = () => {
    const newErrors: { name?: string; description?: string } = {}

    if (!teamName.trim()) {
      newErrors.name = 'Team name is required'
    } else if (teamName.trim().length < 3) {
      newErrors.name = 'Team name must be at least 3 characters'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onCreateTeam({
      name: teamName.trim(),
      description: description.trim(),
      icon: selectedIcon.icon,
      color: selectedIcon.color,
    })

    // Reset form
    setTeamName('')
    setDescription('')
    setSelectedIcon(TEAM_ICONS[0])
    setErrors({})
    onClose()
  }

  const handleClose = () => {
    setTeamName('')
    setDescription('')
    setSelectedIcon(TEAM_ICONS[0])
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-2xl"
          >
            <div className="glass-dark rounded-2xl p-8 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Create New Workspace</h2>
                  <p className="text-slate-400 text-sm">Set up a new team workspace to collaborate</p>
                </div>
                <IconButton onClick={handleClose} ariaLabel="Close create team dialog" className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </IconButton>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Team Icon Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Choose Workspace Icon
                  </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {TEAM_ICONS.map((iconData, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedIcon(iconData)}
                        className={`w-full aspect-square rounded-xl bg-gradient-to-br ${iconData.color} flex items-center justify-center text-3xl transition-all ${
                          selectedIcon === iconData
                            ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                            : 'opacity-50 hover:opacity-100'
                        }`}
                      >
                        {iconData.icon}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Team Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value)
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    placeholder="e.g., Marketing Team, Engineering, Sales..."
                    className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border ${
                      errors.name ? 'border-red-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) setErrors({ ...errors, description: undefined })
                    }}
                    placeholder="Brief description of your workspace..."
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-800/50 border ${
                      errors.description ? 'border-red-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none`}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Preview */}
                <div className="glass rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Preview</div>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedIcon.color} flex items-center justify-center text-3xl flex-shrink-0`}>
                      {selectedIcon.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-lg">
                        {teamName || 'Your Workspace Name'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {description || 'Your workspace description will appear here'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 rounded-xl glass hover:bg-white/20 text-white font-medium transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg transition-all"
                >
                  Create Workspace
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
