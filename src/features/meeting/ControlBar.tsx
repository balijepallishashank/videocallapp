import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, Phone, Monitor, Settings, Plus, Hand, Smile, Maximize, Minimize } from 'lucide-react'

interface ControlBarProps {
  isMicOn: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  canScreenShare?: boolean
  onMicToggle: () => void
  onCameraToggle: () => void
  onScreenShare: () => void
  onEndCall: () => void
  onHandRaise?: () => void
  isHandRaised?: boolean
  handRaisedParticipants?: string[]
  onReaction?: (emoji: string) => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
}

const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Like', variant: 'burst' as const },
  { emoji: '❤️', label: 'Love', variant: 'spiral' as const },
  { emoji: '😂', label: 'Funny', variant: 'bounce' as const },
  { emoji: '🎉', label: 'Celebrate', variant: 'burst' as const },
  { emoji: '🔥', label: 'Hot', variant: 'float' as const },
  { emoji: '👏', label: 'Clap', variant: 'burst' as const },
]

const ControlButton = ({
  icon: Icon,
  onClick,
  label,
  variant = 'default',
  isActive = true,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  label: string
  variant?: 'default' | 'danger' | 'success'
  isActive?: boolean
  disabled?: boolean
}) => {
  const baseStyles = 'p-3 rounded-full flex items-center justify-center transition-all duration-300 relative'
  const variants = {
    default: `${disabled ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed' : isActive ? 'bg-gradient-to-br from-slate-600/50 to-slate-700/50 hover:from-slate-600/70 hover:to-slate-700/70 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20' : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-400'}`,
    danger: 'bg-gradient-to-br from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30',
    success: disabled ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed border border-slate-700/40' : 'bg-gradient-to-br from-green-500/40 to-emerald-500/40 hover:from-green-500/50 hover:to-emerald-500/50 border border-green-500/60 text-green-300 shadow-lg shadow-green-500/20',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} group`}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-slate-900/95 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700/50">
        {label}
      </div>
    </motion.button>
  )
}

export default function ControlBar({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  canScreenShare = true,
  onMicToggle,
  onCameraToggle,
  onScreenShare,
  onEndCall,
  onHandRaise = () => {},
  isHandRaised = false,
  handRaisedParticipants = [],
  onReaction = () => {},
  onToggleFullscreen = () => {},
  isFullscreen = false,
}: ControlBarProps) {
  const [showReactions, setShowReactions] = useState(false)

  const sendReaction = (emoji: string, variant: 'float' | 'burst' | 'spiral' | 'bounce') => {
    onReaction(emoji)
    
    // Dispatch custom event with variant info
    const event = new CustomEvent('reactionSent', {
      detail: { emoji, variant, x: Math.random() * 80 + 10, y: 100, id: `reaction-${Date.now()}-${Math.random()}` },
    })
    window.dispatchEvent(event)
    
    setShowReactions(false)
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-2xl glass px-8 py-4 rounded-2xl shadow-2xl border border-blue-500/20 bg-gradient-to-r from-slate-900/80 via-slate-900/70 to-slate-900/80 backdrop-blur-xl"
    >
      {/* Control Buttons - Perfectly centered with equal spacing */}
      <div className="flex items-center justify-center gap-4">
        {/* Mic Control */}
        <ControlButton
          icon={isMicOn ? Mic : MicOff}
          onClick={onMicToggle}
          label={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
          isActive={isMicOn}
        />

        {/* Camera Control */}
        <ControlButton
          icon={isCameraOn ? Video : VideoOff}
          onClick={onCameraToggle}
          label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          isActive={isCameraOn}
        />

        {/* Screen Share */}
        <ControlButton
          icon={Monitor}
          onClick={onScreenShare}
          label={canScreenShare ? (isScreenSharing ? 'Stop sharing' : 'Share screen') : 'Screen share disabled'}
          variant={isScreenSharing ? 'success' : 'default'}
          isActive={isScreenSharing}
          disabled={!canScreenShare}
        />

        {/* Add User */}
        <ControlButton
          icon={Plus}
          onClick={() => {}}
          label="Add participant"
          variant="default"
        />

        {/* Settings */}
        <ControlButton
          icon={Settings}
          onClick={() => {}}
          label="Settings"
          variant="default"
        />

        {/* Divider */}
        <div className="h-10 w-px bg-slate-600/50 mx-2" />

        {/* Hand Raise Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onHandRaise}
          className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 group ${
            isHandRaised
              ? 'bg-yellow-500 text-white'
              : 'bg-slate-700/50 hover:bg-slate-600/70 text-white'
          }`}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
        >
          <Hand className="w-5 h-5" />
          {handRaisedParticipants.length > 0 && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
            >
              {handRaisedParticipants.length}
            </motion.div>
          )}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isHandRaised ? 'Lower hand' : 'Raise hand'}
          </div>
        </motion.button>

        {/* Advanced Reactions Button */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowReactions(!showReactions)}
            className="p-3 rounded-full bg-gradient-to-br from-blue-500/50 to-purple-600/50 hover:from-blue-500/70 hover:to-purple-600/70 text-white flex items-center justify-center transition-all duration-300 group"
            title="Send reaction"
          >
            <Smile className="w-5 h-5" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Advanced Reactions ✨
            </div>
          </motion.button>

          {/* Advanced Reactions Picker */}
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-3 glass-dark backdrop-blur-xl rounded-xl shadow-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900/95 to-slate-900/90 w-72"
              >
                <div className="grid grid-cols-6 gap-2">
                  {QUICK_REACTIONS.map(({ emoji, label, variant }) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.3, y: -6 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => sendReaction(emoji, variant)}
                      className="aspect-square flex items-center justify-center text-2xl hover:bg-blue-500/20 rounded-lg transition-all border border-blue-500/20 hover:border-blue-500/40 relative group/reaction shadow-lg shadow-blue-500/10"
                      title={label}
                    >
                      {emoji}
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        whileHover={{ opacity: 1, y: -20 }}
                        className="absolute text-xs text-white bg-slate-900/95 px-2 py-1 rounded pointer-events-none whitespace-nowrap border border-slate-700/50"
                      >
                        {label}
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500/20 text-center">
                  <p className="text-xs text-slate-300">With 3D animations ✨</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-10 w-px bg-slate-600/50 mx-2" />

        {/* Fullscreen Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleFullscreen}
          className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 group ${
            isFullscreen
              ? 'bg-blue-500/50 text-white'
              : 'bg-slate-700/50 hover:bg-slate-600/70 text-white'
          }`}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen mode'}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" />
          ) : (
            <Maximize className="w-5 h-5" />
          )}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </div>
        </motion.button>

        {/* Divider */}
        <div className="h-10 w-px bg-slate-600/50 mx-2" />

        {/* End Call - Prominent red button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEndCall}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all duration-300 group relative shadow-lg hover:shadow-red-500/50"
          title="End call"
        >
          <Phone className="w-6 h-6 rotate-[135deg]" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            End call
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
