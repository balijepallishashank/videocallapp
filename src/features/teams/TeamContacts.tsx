import { motion } from 'framer-motion'
import { Users, Plus, Phone, Edit2, Trash2, ArrowLeft } from 'lucide-react'

export interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  avatar: string
  status: 'online' | 'offline' | 'busy'
  role: string
  year?: '1st' | '2nd' | '3rd' | '4th'
  branch?: string
  section?: string
}

interface TeamContactsProps {
  teamMembers: TeamMember[]
  onStartCall: (member: TeamMember) => void
  onSelectMultiple: () => void
  onAddMember: () => void
  onEditMember: (member: TeamMember) => void
  onDeleteMember: (id: string) => void
  canManageMembers?: boolean
  onBack?: () => void
}

export default function TeamContacts({
  teamMembers,
  onStartCall,
  onSelectMultiple,
  onAddMember,
  onEditMember,
  onDeleteMember,
  canManageMembers = true,
  onBack,
}: TeamContactsProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-500',
    busy: 'bg-red-500',
  }

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    busy: 'Busy',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-auto"
    >
      {/* Header */}
      <div className="glass-dark sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 rounded-lg glass hover:bg-white/20 text-slate-300 hover:text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Team Contacts</h1>
              <p className="text-slate-400 text-sm mt-1">Manage your team and start meetings</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!canManageMembers}
            onClick={onAddMember}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border font-semibold transition-all ${
              canManageMembers
                ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-300'
                : 'bg-slate-700/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-5 h-5" />
            Add Member
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSelectMultiple}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass hover:bg-white/20 text-white font-medium"
          >
            <Phone className="w-5 h-5" />
            Start Team Meeting
          </motion.button>
        </motion.div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative glass rounded-2xl p-6 transition-all duration-300"
            >
              {/* Member Info */}
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <motion.div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl mb-4 relative">
                  {member.avatar}

                  {/* Status Indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-900 ${
                      statusColors[member.status]
                    }`}
                  />
                </motion.div>

                {/* Name & Email */}
                <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                <p className="text-sm text-slate-400 mb-1">{member.email}</p>
                {member.phone && (
                  <p className="text-xs text-slate-500 mb-2">{member.phone}</p>
                )}

                {/* Role */}
                <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs text-blue-300 font-medium mb-4">
                  {member.role}
                </div>

                {/* Status Label */}
                <div className="text-xs text-slate-400 mb-4">
                  {statusLabels[member.status]}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartCall(member)}
                  className="w-full py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-medium text-sm transition-all"
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Call
                </motion.button>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!canManageMembers}
                    onClick={() => onEditMember(member)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      canManageMembers
                        ? 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Edit2 className="w-4 h-4 inline mr-1" />
                    Edit
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!canManageMembers}
                    onClick={() => onDeleteMember(member.id)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      canManageMembers
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                        : 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Remove
                  </motion.button>
                </div>
              </div>

              {/* Hover Overlay Badge */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/30 text-xs text-blue-200 font-semibold">
                  {member.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Users className="w-20 h-20 text-slate-600 mb-4" />
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No team members yet</h3>
            <p className="text-slate-500 mb-6">Add your first team member to get started</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              disabled={!canManageMembers}
              onClick={onAddMember}
              className={`px-6 py-3 rounded-xl border font-semibold ${
                canManageMembers
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-300'
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
              }`}
            >
              Add First Member
            </motion.button>
          </motion.div>
        )}

        {/* Stats */}
        {teamMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-4"
          >
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-300">{teamMembers.length}</div>
              <div className="text-sm text-slate-400 mt-2">Total Members</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-300">
                {teamMembers.filter(m => m.status === 'online').length}
              </div>
              <div className="text-sm text-slate-400 mt-2">Online Now</div>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-300">
                {teamMembers.filter(m => m.status === 'busy').length}
              </div>
              <div className="text-sm text-slate-400 mt-2">In Meeting</div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
