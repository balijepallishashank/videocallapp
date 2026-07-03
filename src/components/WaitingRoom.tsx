import { motion, AnimatePresence } from 'framer-motion'
import { Users, Check, X, UserPlus } from 'lucide-react'

export interface WaitingParticipant {
  id: string
  name: string
  email: string
  avatar: string
  joinedAt: Date
}

interface WaitingRoomProps {
  waitingParticipants: WaitingParticipant[]
  onAdmit: (id: string) => void
  onReject: (id: string) => void
  onAdmitAll: () => void
  customMessage?: string
}

export default function WaitingRoom({
  waitingParticipants,
  onAdmit,
  onReject,
  onAdmitAll,
  customMessage = 'Please wait, the host will let you in soon...',
}: WaitingRoomProps) {

  const getTimeWaiting = (joinedAt: Date) => {
    const seconds = Math.floor((Date.now() - joinedAt.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Users className="w-5 h-5 text-yellow-400" />
            {waitingParticipants.length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
              >
                {waitingParticipants.length}
              </motion.div>
            )}
          </div>
          <span className="font-semibold text-white">
            Waiting Room ({waitingParticipants.length})
          </span>
        </div>

        {waitingParticipants.length > 1 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdmitAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all text-sm"
            aria-label="Admit all participants"
            >
            <UserPlus className="w-4 h-4" />
            Admit All
          </motion.button>
        )}
      </div>

      {/* Custom Message */}
      <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-200">{customMessage}</p>
      </div>

      {/* Waiting Participants */}
      {waitingParticipants.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No one in waiting room</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {waitingParticipants.map((participant) => (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                    {participant.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{participant.name}</p>
                    <p className="text-xs text-slate-400 truncate">{participant.email}</p>
                    <p className="text-xs text-slate-500">{getTimeWaiting(participant.joinedAt)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onAdmit(participant.id)}
                      className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
                      title="Admit"
                      aria-label={`Admit ${participant.name}`}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onReject(participant.id)}
                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                      title="Reject"
                      aria-label={`Reject ${participant.name}`}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
