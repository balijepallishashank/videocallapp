import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hand, Smile, X } from 'lucide-react'

interface Reaction {
  id: string
  emoji: string
  x: number
  y: number
  variant?: 'burst' | 'spiral' | 'float' | 'bounce'
}

interface ReactionsProps {
  onHandRaise: () => void
  isHandRaised: boolean
  handRaisedParticipants: string[]
  onSendReaction?: (emoji: string) => void
}

const QUICK_REACTIONS = [
  { emoji: '👍', label: 'Like', variant: 'burst' as const },
  { emoji: '❤️', label: 'Love', variant: 'spiral' as const },
  { emoji: '😂', label: 'Funny', variant: 'bounce' as const },
  { emoji: '🎉', label: 'Celebrate', variant: 'burst' as const },
  { emoji: '🔥', label: 'Hot', variant: 'float' as const },
  { emoji: '👏', label: 'Clap', variant: 'burst' as const },
  { emoji: '💯', label: 'Perfect', variant: 'float' as const },
  { emoji: '🚀', label: 'Awesome', variant: 'spiral' as const },
  { emoji: '✨', label: 'Wow', variant: 'burst' as const },
  { emoji: '🤔', label: 'Think', variant: 'float' as const },
  { emoji: '😍', label: 'Love It', variant: 'burst' as const },
  { emoji: '🙌', label: 'Hands Up', variant: 'bounce' as const },
]

export default function Reactions({
  onHandRaise,
  isHandRaised,
  handRaisedParticipants,
  onSendReaction,
}: ReactionsProps) {
  const [showReactions, setShowReactions] = useState(false)

  const sendReaction = (emoji: string, variant: Reaction['variant']) => {
    if (onSendReaction) {
      onSendReaction(emoji)
    }
    
    const id = `reaction-${Date.now()}-${Math.random()}`
    const x = Math.random() * 80 + 10

    // Emit event for parent component to handle
    const event = new CustomEvent('reactionSent', {
      detail: { id, emoji, x, y: 100, variant },
    })
    window.dispatchEvent(event)

    setShowReactions(false)
  }

  return (
    <>
      {/* Controls */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-2">
        {/* Reactions Panel Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowReactions(!showReactions)}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
            showReactions
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'glass-dark text-slate-300 hover:text-white'
          }`}
          title="Reactions"
          aria-label="Open reactions"
        >
          <Smile className="w-5 h-5" />
        </motion.button>

        {/* Hand Raise Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onHandRaise}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isHandRaised
              ? 'bg-yellow-500 text-white'
              : 'glass-dark text-slate-300 hover:text-white'
          }`}
          title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          aria-label={isHandRaised ? 'Lower hand' : 'Raise hand'}
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
        </motion.button>
      </div>

      {/* Reactions Panel */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-40 right-4 z-40 glass-dark backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl w-80"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Smile className="w-4 h-4 text-purple-400" />
                Quick Reactions
              </h3>
              <button
                onClick={() => setShowReactions(false)}
                className="text-slate-400 hover:text-white transition"
                aria-label="Close reactions panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reactions Grid */}
            <div className="grid grid-cols-6 gap-2">
              {QUICK_REACTIONS.map(({ emoji, label, variant }) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendReaction(emoji, variant)}
                  className="aspect-square rounded-lg glass-dark hover:bg-white/20 flex items-center justify-center text-3xl transition-all border border-white/10 hover:border-white/30 relative group"
                  title={label}
                >
                  {emoji}
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileHover={{ opacity: 1, y: -24 }}
                    className="absolute whitespace-nowrap text-xs text-white bg-slate-900/90 px-2 py-1 rounded pointer-events-none"
                  >
                    {label}
                  </motion.div>
                </motion.button>
              ))}
            </div>

            {/* Info Text */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 text-center">
                Click any reaction to send! ✨
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
