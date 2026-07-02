import { motion } from 'framer-motion'
import { Users, X, Plus } from 'lucide-react'

interface Participant {
  id: string
  name: string
}

interface ParticipantsPanelProps {
  participants: Participant[]
  onAddClick: () => void
  onRemove: (id: string) => void
}

export default function ParticipantsPanel({
  participants,
  onAddClick,
  onRemove,
}: ParticipantsPanelProps) {
  const displayParticipants = [
    { id: 'you', name: 'You', avatar: '👨‍💼', isActive: true },
    ...participants.map((p, i) => ({
      ...p,
      avatar: ['👩‍💼', '👨‍🎨', '👩‍🎓', '👨‍💻'][i % 4],
      isActive: true,
    })),
  ]
  
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full flex flex-col gap-4 glass-dark rounded-2xl p-5 shadow-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/80 to-slate-900/60"
    >
      {/* Header - Participants count */}
      <div className="flex items-center justify-between pb-4 border-b border-blue-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/40 shadow-lg shadow-blue-500/10">
            <Users className="w-4 h-4 text-blue-200" />
          </div>
          <h3 className="text-base font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">Participants</h3>
        </div>
        <span className="text-xs bg-gradient-to-r from-blue-500/40 to-purple-500/40 text-blue-100 px-3 py-1.5 rounded-full font-bold border border-blue-500/40 shadow-lg shadow-blue-500/20">
          {displayParticipants.length}
        </span>
      </div>

      {/* Participants Grid - 3 columns for better use of space */}
      <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-64 pr-1 custom-scrollbar">
        {displayParticipants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative group rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${
              participant.isActive
                ? 'ring-2 ring-green-400/70 shadow-green-500/20'
                : 'ring-1 ring-slate-600 hover:ring-slate-500'
            }`}
          >
            {/* Avatar Container - Square aspect */}
            <div
              className={`w-full aspect-square flex items-center justify-center text-3xl transition-all duration-300 ${
                participant.isActive
                  ? 'bg-gradient-to-br from-blue-500/40 to-purple-600/40 backdrop-blur-sm'
                  : 'bg-gradient-to-br from-slate-700/40 to-slate-800/40'
              }`}
            >
              {participant.avatar}
            </div>

            {/* Remove button overlay for non-self participants */}
            {participant.id !== 'you' && (
              <motion.button
                initial={false}
                whileHover={{ scale: 1.05 }}
                onClick={() => onRemove(participant.id)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-1.5 rounded-xl"
                aria-label={`Remove ${participant.name}`}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full bg-red-500/30 border border-red-400/50"
                >
                  <X className="w-5 h-5 text-red-300" />
                </motion.div>
                <span className="text-xs text-red-300 font-semibold drop-shadow-lg">Remove</span>
              </motion.button>
            )}

            {/* Self indicator badge */}
            {participant.id === 'you' && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-[10px] font-bold text-white shadow-lg border border-white/20">
                YOU
              </div>
            )}

            {/* Name label - Always visible at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 py-2">
              <p className="text-[11px] text-white font-semibold text-center truncate drop-shadow-lg">
                {participant.name}
              </p>
            </div>

            {/* Active indicator dot */}
            {participant.isActive && (
              <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-pulse border border-white/30" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Participant Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddClick}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-sm font-semibold flex items-center justify-center gap-2 transition-all border border-blue-500/40 hover:border-blue-400/60 shadow-lg hover:shadow-blue-500/30 text-white"
      >
        <Plus className="w-5 h-5" />
        <span>Add Participant</span>
      </motion.button>
    </motion.div>
  )
}
