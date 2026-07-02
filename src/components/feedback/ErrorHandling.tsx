import { motion } from 'framer-motion'
import { AlertCircle, Wifi, Camera, RefreshCw } from 'lucide-react'

// Network error component
export function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="glass rounded-2xl p-8 border border-red-500/30 max-w-md w-full text-center"
      >
        <div className="flex justify-center mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="p-4 rounded-full bg-red-500/10"
          >
            <Wifi className="w-8 h-8 text-red-400" />
          </motion.div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Connection Lost</h3>
        <p className="text-slate-300 mb-6">Unable to connect to the server. Check your internet connection.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// Permission denied error
export function PermissionDeniedError({ type = 'camera' }: { type?: 'camera' | 'microphone' | 'both' }) {
  const messages = {
    camera: 'Camera access is required for video calls. Please enable it in your browser settings.',
    microphone: 'Microphone access is required for video calls. Please enable it in your browser settings.',
    both: 'Camera and microphone access are required. Please enable them in your browser settings.',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-orange-500/30 bg-orange-500/5"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-orange-500/20">
          <AlertCircle className="w-6 h-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-1">Permission Required</h4>
          <p className="text-sm text-slate-300">{messages[type]}</p>
          <p className="text-xs text-orange-400 mt-2">
            💡 Try refreshing the page or checking your browser's permission settings.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// Device unavailable error
export function DeviceUnavailableError() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl p-6 border border-red-500/30 bg-red-500/5 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-4"
      >
        <Camera className="w-8 h-8 text-red-400 mx-auto" />
      </motion.div>
      <h4 className="font-semibold text-white mb-1">Device Not Found</h4>
      <p className="text-sm text-slate-300">
        No camera or microphone detected. Please connect a device and try again.
      </p>
    </motion.div>
  )
}

// Generic error message
export function ErrorMessage({ 
  message, 
  onDismiss, 
  action 
}: { 
  message: string
  onDismiss?: () => void
  action?: { label: string; onClick: () => void }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed bottom-4 right-4 glass rounded-xl p-4 border border-red-500/30 max-w-sm z-40"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-slate-100">{message}</p>
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={action.onClick}
              className="text-xs text-red-400 hover:text-red-300 mt-2 font-semibold"
            >
              {action.label}
            </motion.button>
          )}
        </div>
        {onDismiss && (
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// Error boundary for sections
export function ErrorBoundarySection({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {fallback ? fallback : children || (
        <div className="glass rounded-2xl p-8 border border-red-500/30 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-slate-300">Something went wrong loading this section.</p>
        </div>
      )}
    </motion.div>
  )
}
