import { useState, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Phone, Search, Check, Filter } from 'lucide-react'
import { TeamMember } from './TeamContacts'

interface SelectMembersProps {
  teamMembers: TeamMember[]
  onBack: () => void
  onStartCall: (selectedMembers: TeamMember[]) => void
  isTeacherAdmin?: boolean
}

export default function SelectMembers({
  teamMembers,
  onBack,
  onStartCall,
  isTeacherAdmin = false,
}: SelectMembersProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('Team Meeting')
  const [yearFilter, setYearFilter] = useState<'all' | '1st' | '2nd' | '3rd' | '4th'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')

  const selectedIds = new Set(Array.from(selectedMembers))

  const teacherFilteredMembers = teamMembers.filter((member) => {
    if (!isTeacherAdmin) return true
    if (yearFilter !== 'all' && member.year !== yearFilter) return false
    if (branchFilter !== 'all' && member.branch !== branchFilter) return false
    if (sectionFilter !== 'all' && member.section !== sectionFilter) return false
    return true
  })

  const filteredMembers = teacherFilteredMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableMembers = filteredMembers.filter((member) => !selectedIds.has(member.id))
  const selectedTeamMembers = teamMembers.filter((m) => selectedIds.has(m.id))

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handleSelectAll = () => {
    if (availableMembers.length === 0) {
      return
    }

    const allAvailableSelected = availableMembers.every((m) => selectedIds.has(m.id))
    if (allAvailableSelected) {
      const newSet = new Set(selectedMembers)
      availableMembers.forEach((m) => newSet.delete(m.id))
      setSelectedMembers(newSet)
    } else {
      const newSet = new Set(selectedMembers)
      availableMembers.forEach((m) => newSet.add(m.id))
      setSelectedMembers(newSet)
    }
  }

  const handleStartCall = () => {
    if (selectedMembers.size > 0) {
      onStartCall(selectedTeamMembers)
    }
  }

  const handleDropToSelected = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const memberId = event.dataTransfer.getData('text/member-id')
    if (!memberId) return
    const newSet = new Set(selectedMembers)
    newSet.add(memberId)
    setSelectedMembers(newSet)
  }

  const handleDropToAvailable = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const memberId = event.dataTransfer.getData('text/member-id')
    if (!memberId) return
    const newSet = new Set(selectedMembers)
    newSet.delete(memberId)
    setSelectedMembers(newSet)
  }

  const branchOptions = Array.from(new Set(teamMembers.map((m) => m.branch).filter(Boolean))) as string[]
  const sectionOptions = Array.from(new Set(teamMembers.map((m) => m.section).filter(Boolean))) as string[]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-auto"
    >
      {/* Header with Back Button */}
      <div className="glass-dark sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-slate-700/30 text-slate-300 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>

            <div>
              <h1 className="text-2xl font-bold text-white">Start Team Meeting</h1>
              <p className="text-slate-400 text-sm mt-1">Select members to invite</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartCall}
            disabled={selectedMembers.size === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Phone className="w-5 h-5" />
            Start Call ({selectedMembers.size})
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Meeting Title Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 glass rounded-xl p-6"
        >
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Meeting Title
          </label>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="Enter meeting title..."
            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </motion.div>

        {isTeacherAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-6 glass rounded-xl p-4"
          >
            <div className="flex items-center gap-2 text-white font-semibold mb-3">
              <Filter className="w-4 h-4 text-blue-300" />
              Education Filters (Teacher Mode)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value as 'all' | '1st' | '2nd' | '3rd' | '4th')}
                className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white"
              >
                <option value="all">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white"
              >
                <option value="all">All Branches</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-white"
              >
                <option value="all">All Sections</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

        {/* Search and Select All */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 flex gap-4"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSelectAll}
            className="px-4 py-2 rounded-lg glass text-sm font-medium"
          >
            {availableMembers.every((m) => selectedIds.has(m.id)) && availableMembers.length > 0
              ? 'Deselect Visible'
              : 'Select All'}
          </motion.button>
        </motion.div>

        {/* Members Transfer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToAvailable}
            className="glass rounded-xl p-4 min-h-[360px]"
          >
            <h3 className="text-white font-semibold mb-3">Available Contacts ({availableMembers.length})</h3>
            <div className="space-y-3">
              {availableMembers.length > 0 ? availableMembers.map((member, index) => (
              <motion.div
                key={member.id}
                draggable
                onDragStartCapture={(event: DragEvent<HTMLDivElement>) => event.dataTransfer.setData('text/member-id', member.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleToggleMember(member.id)}
                className="glass rounded-xl p-4 cursor-pointer hover:bg-white/15 transition-all flex items-center gap-4"
              >
                <motion.div
                  animate={{
                    scale: selectedMembers.has(member.id) ? 1.1 : 1,
                  }}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedMembers.has(member.id)
                      ? 'bg-blue-500/50 border-blue-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedMembers.has(member.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </motion.div>

                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0">
                  {member.avatar}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-white">{member.name}</h4>
                  <p className="text-sm text-slate-400">{member.email}</p>
                  {isTeacherAdmin && (
                    <p className="text-xs text-slate-500 mt-1">
                      {member.year || 'N/A'} • {member.branch || 'N/A'} • Section {member.section || 'N/A'}
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'online'
                        ? 'bg-green-500/20 text-green-300'
                        : member.status === 'busy'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-600/20 text-slate-300'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </motion.div>
              )) : (
                <div className="text-center py-10 text-slate-400 text-sm">No available contacts in this filter.</div>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropToSelected}
            className="glass rounded-xl p-4 min-h-[360px]"
          >
            <h3 className="text-white font-semibold mb-3">Selected Participants ({selectedMembers.size})</h3>
            <div className="space-y-3">
              {selectedTeamMembers.length > 0 ? selectedTeamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                draggable
                onDragStartCapture={(event: DragEvent<HTMLDivElement>) => event.dataTransfer.setData('text/member-id', member.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleToggleMember(member.id)}
                className="glass rounded-xl p-4 cursor-pointer hover:bg-white/15 transition-all flex items-center gap-4"
              >
                {/* Checkbox */}
                <motion.div
                  animate={{
                    scale: selectedMembers.has(member.id) ? 1.1 : 1,
                  }}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selectedMembers.has(member.id)
                      ? 'bg-blue-500/50 border-blue-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedMembers.has(member.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </motion.div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl flex-shrink-0">
                  {member.avatar}
                </div>

                {/* Member Info */}
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{member.name}</h4>
                  <p className="text-sm text-slate-400">{member.email}</p>
                </div>

                {/* Status & Role */}
                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'online'
                        ? 'bg-green-500/20 text-green-300'
                        : member.status === 'busy'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-600/20 text-slate-300'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              </motion.div>
              )) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Drag contacts here or click to select</p>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-400 mb-2">Selected Members</div>
              <div className="text-3xl font-bold text-blue-300">{selectedMembers.size}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-2">Total Available</div>
              <div className="text-3xl font-bold text-slate-300">{teamMembers.length}</div>
            </div>
          </div>

          {selectedMembers.size === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
            >
              👆 Select at least one member to start the call
            </motion.div>
          )}
        </motion.div>

        {/* Selected Members Preview */}
        {selectedMembers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6"
          >
            <h3 className="font-semibold text-white mb-4">Selected Participants ({selectedMembers.size})</h3>
            <div className="flex flex-wrap gap-3">
              {selectedTeamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm font-medium flex items-center gap-2"
                >
                  <span>{member.avatar}</span>
                  <span>{member.name}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleMember(member.id)
                    }}
                    className="ml-1 text-blue-400 hover:text-blue-300"
                  >
                    ✕
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
