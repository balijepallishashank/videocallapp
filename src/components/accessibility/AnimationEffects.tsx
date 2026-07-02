import { motion } from 'framer-motion'

// Hover card effect
export function HoverCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, translateY: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`glass rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Hover button with ripple effect
export function HoverButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
    secondary: 'bg-slate-700/50 hover:bg-slate-600',
    danger: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 hover:border-red-400',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-semibold text-white
        transition-all relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.2 }}
        className="absolute inset-0 bg-white"
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// Staggered list animation
export function StaggeredList<T>({
  items,
  children,
  delay = 0.1,
}: {
  items: T[]
  children: (item: T, index: number) => React.ReactNode
  delay?: number
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delay,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants}>
          {children(item, index)}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Fade in on scroll animation
export function FadeInOnScroll({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// Pulse effect
export function PulseEffect({
  children,
  intensity = 0.3,
}: {
  children: React.ReactNode
  intensity?: number
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.02, 1], opacity: [1, 1 - intensity, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.div>
  )
}

// Shimmer loading effect
export function Shimmer({
  width = 'w-full',
  height = 'h-4',
}: {
  width?: string
  height?: string
}) {
  return (
    <motion.div
      className={`${width} ${height} rounded bg-gradient-to-r from-slate-700/50 via-slate-600/50 to-slate-700/50 bg-[200%_100%]`}
      animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// Floating animation
export function FloatingElement({
  children,
  duration = 3,
  distance = 20,
}: {
  children: React.ReactNode
  duration?: number
  distance?: number
}) {
  return (
    <motion.div
      animate={{ y: [0, -distance, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  )
}

// Slide in from side animation
export function SlideInFromSide({
  children,
  direction = 'left',
  delay = 0,
}: {
  children: React.ReactNode
  direction?: 'left' | 'right'
  delay?: number
}) {
  const initialX = direction === 'left' ? -100 : 100

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
    >
      {children}
    </motion.div>
  )
}

// Scale in animation
export function ScaleIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

// Rotate animation
export function RotateAnimation({
  children,
  duration = 4,
}: {
  children: React.ReactNode
  duration?: number
}) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.div>
  )
}

// Bounce animation
export function BounceAnimation({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 0.6, repeat: Infinity }}
    >
      {children}
    </motion.div>
  )
}

// Gradient shift animation
export function GradientShift({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 bg-[200%_100%] ${className}`}
      animate={{ backgroundPosition: ['0% 0', '100% 0', '0% 0'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      {children}
    </motion.div>
  )
}

// Glow effect hover
export function GlowOnHover({
  children,
  glowColor = 'blue',
}: {
  children: React.ReactNode
  glowColor?: 'blue' | 'purple' | 'cyan' | 'green' | 'red'
}) {
  const glowClasses = {
    blue: 'hover:shadow-lg hover:shadow-blue-500/50',
    purple: 'hover:shadow-lg hover:shadow-purple-500/50',
    cyan: 'hover:shadow-lg hover:shadow-cyan-500/50',
    green: 'hover:shadow-lg hover:shadow-green-500/50',
    red: 'hover:shadow-lg hover:shadow-red-500/50',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`transition-all ${glowClasses[glowColor]}`}
    >
      {children}
    </motion.div>
  )
}

// Underline animation on hover
export function UnderlineHover({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  return (
    <motion.div className={`relative inline-block ${className}`}>
      {text}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
        initial={{ width: 0 }}
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

// Countdown timer animation
export function CountdownTimer({
  seconds,
  onComplete,
}: {
  seconds: number
  onComplete: () => void
}) {
  return (
    <motion.div
      className="relative w-20 h-20 flex items-center justify-center border-4 border-blue-500 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: seconds, ease: 'linear', onComplete }}
    >
      <motion.span
        key={seconds}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        className="text-2xl font-bold text-blue-400"
      >
        {seconds}
      </motion.span>
    </motion.div>
  )
}

// Marquee scrolling text
export function MarqueeText({
  text,
  speed = 100,
}: {
  text: string
  speed?: number
}) {
  const textWidth = text.length * 8

  return (
    <motion.div
      className="overflow-hidden whitespace-nowrap"
      animate={{ x: [-textWidth, 0] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
    >
      <span className="inline-block">{text}</span>
      <span className="inline-block ml-8">{text}</span>
    </motion.div>
  )
}
