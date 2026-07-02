import { motion, AnimatePresence } from 'framer-motion'

interface Reaction {
  id: string
  emoji: string
  x: number
  y: number
  variant?: 'burst' | 'spiral' | 'float' | 'bounce'
}

interface FloatingReactionsProps {
  reactions: Reaction[]
}

export default function FloatingReactions({ reactions }: FloatingReactionsProps) {
  const getAnimationVariant = (variant: Reaction['variant'] = 'float') => {
    const randomX = (Math.random() - 0.5) * 40
    const randomRotation = Math.random() * 360
    
    const variants = {
      float: {
        initial: { y: 0, opacity: 0, scale: 0, rotateZ: -45 },
        animate: {
          y: -400,
          opacity: [0, 1, 1, 1, 0],
          scale: [0, 1, 1.3, 1, 0],
          x: randomX,
          rotateZ: randomRotation,
          rotateX: [0, 360],
          rotateY: [0, 180],
        },
        transition: { duration: 3.5, ease: 'easeOut' },
      },
      burst: {
        initial: { y: 0, opacity: 0, scale: 0 },
        animate: {
          y: -500,
          opacity: [0, 1, 0.8, 0],
          scale: [0, 1.5, 1.2, 0.5],
          x: randomX * 1.5,
          rotateZ: randomRotation,
        },
        transition: { duration: 2.8, ease: 'easeOut' },
      },
      spiral: {
        initial: { y: 0, opacity: 0, scale: 0 },
        animate: {
          y: -450,
          opacity: [0, 1, 1, 0],
          scale: [0, 1.2, 1.1, 0],
          x: Math.sin(Date.now() / 1000) * 150,
          rotateZ: randomRotation + 360,
        },
        transition: { duration: 3.2, ease: 'circOut' },
      },
      bounce: {
        initial: { y: 0, opacity: 0, scale: 0 },
        animate: {
          y: [-20, -100, -150, -250, -400],
          opacity: [0, 1, 1, 1, 0],
          scale: [0, 1.3, 1.1, 1.2, 0.8],
          x: [0, randomX * 0.5, randomX, randomX * 1.2],
        },
        transition: {
          duration: 3,
          times: [0, 0.2, 0.4, 0.7, 1],
          ease: 'easeOut',
        },
      },
    }
    
    return variants[variant]
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-30 perspective">
      <style>{`
        .perspective {
          perspective: 1200px;
        }
        .reaction-emoji {
          filter: drop-shadow(0 0 16px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 32px rgba(147, 51, 234, 0.3));
          text-shadow: 0 0 30px rgba(59, 130, 246, 0.5), 
                       0 0 60px rgba(147, 51, 234, 0.3),
                       0 0 90px rgba(99, 102, 241, 0.2);
          font-weight: bold;
          letter-spacing: 2px;
          filter-brightness: 1.2;
        }
      `}</style>
      <AnimatePresence>
        {reactions.map((reaction) => {
          const animation = getAnimationVariant(reaction.variant)
          
          return (
            <motion.div
              key={reaction.id}
              initial={animation.initial}
              animate={animation.animate}
              exit={{ opacity: 0, scale: 0 }}
              transition={animation.transition}
              style={{
                position: 'absolute',
                left: `${reaction.x}%`,
                bottom: 0,
                transformStyle: 'preserve-3d',
              }}
              className="reaction-emoji text-6xl will-change-transform"
            >
              {reaction.emoji}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export type { Reaction }
