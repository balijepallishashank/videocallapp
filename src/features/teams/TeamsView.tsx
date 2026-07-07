import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trash2, UserPlus, UserMinus, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react'
import {
  subscribeToAllTeams,
  subscribeToClasses,
  subscribeToClassMembers,
  createTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  type Team,
} from '../../services/db'

interface OutletContext {
  currentUser: any
  isFaculty: boolean
  addToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

const TEAM_COLORS = [
  'from-cyan-500/20 border-cyan-500/30',
  'from-violet-500/20 border-violet-500/30',
  'from-emerald-500/20 border-emerald-500/30',
  'from-rose-500/20 border-rose-500/30',
  'from-amber-500/20 border-amber-500/30',
  'from-fuchsia-500/20 border-fuchsia-500/30',
]
const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-fuchsia-500 to-purple-600',
]

export default function TeamsView() {
  const { currentUser, isFaculty, addToast } = useOutletContext<OutletContext>()

  const [teams, setTeams] = useState<Team[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [classMembersMap, setClassMembersMap] = useState<Record<string, any[]>>({})
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState<string | null>(null) // teamId

  // Create form
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formSelectedStudents, setFormSelectedStudents] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const unsub = subscribeToAllTeams(currentUser.id, currentUser.role, (list) => setTeams(list))
    const unsubClasses = subscribeToClasses(currentUser.role, currentUser.id, (list) => setClasses(list))
    return () => {
      unsub()
      unsubClasses()
    }
  }, [currentUser])

  // Load class members for all enrolled classes
  useEffect(() => {
    if (classes.length === 0) return
    const unsubs: (() => void)[] = []
    classes.forEach((cls) => {
      const unsub = subscribeToClassMembers(cls.id, (members) => {
        setClassMembersMap((prev) => ({ ...prev, [cls.id]: members }))
      })
      unsubs.push(unsub)
    })
    return () => unsubs.forEach((u) => u())
  }, [classes])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formClassId) {
      addToast('Please fill in all required fields.', 'warning')
      return
    }
    setIsSaving(true)
    try {
      const cls = classes.find((c) => c.id === formClassId)
      await createTeam({
        name: formName.trim(),
        description: formDesc.trim(),
        classId: formClassId,
        className: cls?.name || '',
        facultyId: currentUser.id,
        memberIds: formSelectedStudents.map((s) => s.id),
        memberNames: formSelectedStudents.map((s) => s.name),
      })
      addToast(`Team "${formName}" created!`, 'success')
      setFormName('')
      setFormDesc('')
      setFormClassId('')
      setFormSelectedStudents([])
      setShowCreateModal(false)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create team.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Delete team "${teamName}"? This cannot be undone.`)) return
    try {
      await deleteTeam(teamId)
      addToast('Team deleted.', 'success')
    } catch {
      addToast('Failed to delete team.', 'error')
    }
  }

  const handleAddMember = async (teamId: string, student: any) => {
    try {
      await addTeamMember(teamId, student.id, student.name)
      addToast(`${student.name} added to team.`, 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to add member.', 'error')
    }
  }

  const handleRemoveMember = async (teamId: string, studentId: string, studentName: string) => {
    try {
      await removeTeamMember(teamId, studentId)
      addToast(`${studentName} removed from team.`, 'success')
    } catch {
      addToast('Failed to remove member.', 'error')
    }
  }

  // Available students for a team (from that class, not already in team)
  const getAvailableStudents = (team: Team) => {
    const classMembers = classMembersMap[team.classId] || []
    return classMembers.filter((m) => !team.memberIds.includes(m.id))
  }

  const activeAddMemberTeam = showAddMemberModal ? teams.find((t) => t.id === showAddMemberModal) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Teams</h1>
          <p className="mt-1 text-slate-400">
            {isFaculty ? 'Create and manage student teams within your classes.' : 'View the teams you belong to.'}
          </p>
        </div>
        {isFaculty && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition"
          >
            <Plus className="w-4 h-4" />
            New Team
          </motion.button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Teams', value: teams.length, color: 'text-cyan-300' },
          { label: 'Classes', value: classes.length, color: 'text-violet-300' },
          { label: 'Total Members', value: teams.reduce((s, t) => s + t.memberIds.length, 0), color: 'text-emerald-300' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</div>
            <div className={`mt-2 text-2xl font-black ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/40 p-12 text-center flex flex-col items-center space-y-4">
          <div className="rounded-full bg-slate-900 p-4 border border-white/5">
            <Users className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No teams yet</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1">
              {isFaculty ? 'Create teams to organize students into groups for projects or assignments.' : 'You have not been added to any team yet.'}
            </p>
          </div>
          {isFaculty && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              Create First Team
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team, idx) => {
            const isExpanded = expandedTeam === team.id
            const colorClass = TEAM_COLORS[idx % TEAM_COLORS.length]
            const cls = classes.find((c) => c.id === team.classId)

            return (
              <motion.div
                key={team.id}
                layout
                className={`rounded-[1.75rem] border bg-gradient-to-br to-slate-950/50 p-5 flex flex-col gap-4 ${colorClass}`}
              >
                {/* Team header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white truncate">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{team.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs text-slate-500">{cls?.name || team.className || 'Unknown Class'}</span>
                    </div>
                  </div>
                  {isFaculty && (
                    <button
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Member count & expand */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Avatar stack */}
                    <div className="flex -space-x-2">
                      {(team.memberNames || []).slice(0, 4).map((name, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white border border-slate-950 ring-1 ring-white/10`}
                          title={name}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {team.memberIds.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-950">
                          +{team.memberIds.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{team.memberIds.length} member{team.memberIds.length !== 1 ? 's' : ''}</span>
                  </div>

                  <button
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {isExpanded ? 'Less' : 'Details'}
                  </button>
                </div>

                {/* Expanded members list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        {team.memberIds.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-2">No members yet.</p>
                        ) : (
                          team.memberIds.map((memberId, i) => {
                            const memberName = team.memberNames?.[i] || memberId
                            return (
                              <div key={memberId} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                                    {memberName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs text-slate-300 truncate">{memberName}</span>
                                </div>
                                {isFaculty && (
                                  <button
                                    onClick={() => handleRemoveMember(team.id, memberId, memberName)}
                                    className="text-slate-600 hover:text-rose-400 transition flex-shrink-0"
                                    title="Remove member"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>

                      {isFaculty && (
                        <button
                          onClick={() => setShowAddMemberModal(team.id)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add Member
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">Create New Team</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Team Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Group A, Alpha Team"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Class *</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name} ({cls.subject})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea
                    placeholder="What is this team working on?"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                {formClassId && classMembersMap[formClassId] && classMembersMap[formClassId].length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Students</label>
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/60 p-2 space-y-1">
                      {classMembersMap[formClassId].map((student: any) => {
                        const isSelected = formSelectedStudents.some(s => s.id === student.id)
                        return (
                          <label key={student.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormSelectedStudents(prev => [...prev, student])
                                } else {
                                  setFormSelectedStudents(prev => prev.filter(s => s.id !== student.id))
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{student.name || student.studentName}</div>
                              <div className="text-[11px] text-slate-500 truncate">{student.email || 'Student'}</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{formSelectedStudents.length} student(s) selected</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-950 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
                  >
                    {isSaving ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && activeAddMemberTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddMemberModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white">Add Member</h2>
                <button onClick={() => setShowAddMemberModal(null)} className="text-slate-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">Select a student from <strong className="text-slate-200">{activeAddMemberTeam.className}</strong> to add to <strong className="text-slate-200">{activeAddMemberTeam.name}</strong>.</p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getAvailableStudents(activeAddMemberTeam).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">All class members are already in this team.</p>
                ) : (
                  getAvailableStudents(activeAddMemberTeam).map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleAddMember(activeAddMemberTeam.id, student)}
                      className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left hover:bg-cyan-500/10 hover:border-cyan-500/20 transition"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{student.name}</div>
                        <div className="text-[11px] text-slate-500">{student.email}</div>
                      </div>
                      <UserPlus className="w-4 h-4 text-slate-500 ml-auto" />
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowAddMemberModal(null)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
