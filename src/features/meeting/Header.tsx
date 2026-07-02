import { motion } from 'framer-motion'
import { Users, Circle, Clock, MessageSquare } from 'lucide-react'

interface HeaderProps {
  callTimer?: string
  participantCount?: number
  onToggleParticipants?: () => void
  onToggleChat?: () => void
  showParticipants?: boolean
  showChat?: boolean
  onInvite?: () => void
  canInvite?: boolean
  isVisible?: boolean
}

export default function Header({ 
  callTimer = '00:00', 
  participantCount = 5,
  onToggleParticipants = () => {},
  onToggleChat = () => {},
  showParticipants = false,
  showChat = false,
  onInvite = () => {},
  canInvite = true,
  isVisible = true
}: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : -120, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="glass-dark px-6 py-3 border-b border-blue-500/20 bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-lg"
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <div className="max-w-full mx-auto flex items-center justify-between gap-8">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">VC</span>
          </div>
          <h1 className="text-lg font-bold text-white whitespace-nowrap">Design Critique Meeting</h1>
        </div>

        {/* Right: All Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Invite Button */}
          <motion.button
            disabled={!canInvite}
            onClick={onInvite}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all h-10 ${
              canInvite
                ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50 text-blue-400'
                : 'bg-slate-700/20 border-slate-600/40 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span className="text-base">📧</span>
            <span className="text-sm font-medium">Invite</span>
          </motion.button>

          {/* Call Timer */}
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 h-10 shadow-lg shadow-amber-500/10"
          >
            <Clock className="w-4 h-4 text-amber-300" />
            <span className="text-sm font-mono font-bold tracking-wider text-amber-100">{callTimer}</span>
          </motion.div>

          {/* Recording Indicator */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50 h-10"
          >
            <Circle className="w-2 h-2 fill-red-500 text-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-red-400">REC</span>
          </motion.div>

          {/* Participant Count - Clickable */}
          <motion.button
            onClick={onToggleParticipants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all h-10 ${
              showParticipants 
                ? 'bg-blue-500/30 border border-blue-400/50 shadow-lg shadow-blue-500/30' 
                : 'glass hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium whitespace-nowrap">{participantCount} participants</span>
          </motion.button>

          {/* Chat Button - Clickable */}
          <motion.button
            onClick={onToggleChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all h-10 ${
              showChat 
                ? 'bg-purple-500/30 border border-purple-400/50 shadow-lg shadow-purple-500/30' 
                : 'glass hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Chat</span>
          </motion.button>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass h-10">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-sm font-medium text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
