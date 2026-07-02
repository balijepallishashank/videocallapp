import { motion } from 'framer-motion'

// Skeleton loader for cards
export function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="glass rounded-2xl p-6 border border-slate-700/50"
    >
      <div className="space-y-4">
        <div className="h-4 bg-slate-700/50 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-700/50 rounded-lg w-full" />
        <div className="h-4 bg-slate-700/50 rounded-lg w-2/3" />
      </div>
    </motion.div>
  )
}

// Skeleton for meeting list items
export function SkeletonMeetingItem() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="glass rounded-xl p-4 border border-slate-700/50"
    >
      <div className="space-y-3">
        <div className="h-5 bg-slate-700/50 rounded-lg w-2/3" />
        <div className="flex gap-4">
          <div className="h-4 bg-slate-700/50 rounded-lg w-1/3" />
          <div className="h-4 bg-slate-700/50 rounded-lg w-1/3" />
        </div>
      </div>
    </motion.div>
  )
}

// Skeleton for avatar
export function SkeletonAvatar() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-12 h-12 bg-slate-700/50 rounded-full"
    />
  )
}

// Skeleton for stats
export function SkeletonStat() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="glass rounded-2xl p-6 border border-slate-700/50"
    >
      <div className="space-y-4">
        <div className="w-12 h-12 bg-slate-700/50 rounded-lg" />
        <div className="h-6 bg-slate-700/50 rounded-lg w-1/2" />
        <div className="h-4 bg-slate-700/50 rounded-lg w-3/4" />
      </div>
    </motion.div>
  )
}

// Loading shimmer effect
export function LoadingShimmer() {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="inline-flex items-center gap-2"
    >
      <div className="w-2 h-2 rounded-full bg-blue-400" />
      <span className="text-sm text-slate-400">Loading...</span>
    </motion.div>
  )
}

// Video initialization loader
export function VideoInitLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 z-10"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 mb-4"
      />
      <p className="text-slate-300 font-medium">Initializing camera...</p>
      <p className="text-sm text-slate-500 mt-2">Please allow camera access</p>
    </motion.div>
  )
}

// File upload progress
export function FileUploadProgress({ progress }: { progress: number }) {
  return (
    <motion.div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-300">Uploading file...</span>
        <span className="text-blue-400 font-semibold">{progress}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
        />
      </div>
    </motion.div>
  )
}

// Skeleton grid loader
export function SkeletonGridLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
