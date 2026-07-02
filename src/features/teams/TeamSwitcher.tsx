import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Plus, Check, LogOut } from 'lucide-react'

export interface Team {
  id: string
  name: string
  description: string
  icon: string
  memberCount: number
  role: 'owner' | 'admin' | 'member'
  color: string
}

interface TeamSwitcherProps {
  teams: Team[]
  activeTeamId: string
  onSwitchTeam: (teamId: string) => void
  onCreateTeam: () => void
  onLeaveTeam?: (teamId: string) => void
}

export default function TeamSwitcher({
  teams,
  activeTeamId,
  onSwitchTeam,
  onCreateTeam,
  onLeaveTeam,
}: TeamSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeTeam = teams.find(t => t.id === activeTeamId)

  if (!activeTeam) return null

  return (
    <div className="relative">
      {/* Active Team Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/20 text-white transition-all border border-white/10 min-w-[240px]"
      >
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${activeTeam.color} flex items-center justify-center text-xl flex-shrink-0`}>
          {activeTeam.icon}
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold">{activeTeam.name}</div>
          <div className="text-xs text-slate-400">{activeTeam.memberCount} members</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 mt-2 w-full min-w-[320px] glass-dark rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
            >
              {/* Current Team Section */}
              <div className="p-3 border-b border-white/10">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Current Workspace</div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/20 border border-blue-400/30">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${activeTeam.color} flex items-center justify-center text-xl flex-shrink-0`}>
                    {activeTeam.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{activeTeam.name}</div>
                    <div className="text-xs text-slate-400">{activeTeam.description}</div>
                  </div>
                  <Check className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className={`px-2 py-0.5 rounded-full ${
                    activeTeam.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
                    activeTeam.role === 'admin' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-slate-500/20 text-slate-300'
                  }`}>
                    {activeTeam.role.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{activeTeam.memberCount} members</span>
                </div>
              </div>

              {/* Other Teams */}
              {teams.filter(t => t.id !== activeTeamId).length > 0 && (
                <div className="p-3 border-b border-white/10">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Switch Workspace</div>
                  <div className="space-y-1">
                    {teams.filter(t => t.id !== activeTeamId).map((team) => (
                      <motion.button
                        key={team.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onSwitchTeam(team.id)
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-left group"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${team.color} flex items-center justify-center text-xl flex-shrink-0`}>
                          {team.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{team.name}</div>
                          <div className="text-xs text-slate-400">{team.memberCount} members</div>
                        </div>
                        {onLeaveTeam && team.role !== 'owner' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onLeaveTeam(team.id)
                              setIsOpen(false)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                            title="Leave team"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Team */}
              <div className="p-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onCreateTeam()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-400/30 text-blue-300 font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Workspace</span>
                </motion.button>
              </div>

              {/* Team Stats */}
              <div className="p-3 bg-slate-800/50 border-t border-white/10">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{teams.length}</div>
                    <div className="text-xs text-slate-400">Total Workspaces</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {teams.reduce((sum, t) => sum + t.memberCount, 0)}
                    </div>
                    <div className="text-xs text-slate-400">Total Members</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
