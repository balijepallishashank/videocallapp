import { motion } from 'framer-motion'
import { Check, AlertCircle, Info, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export default function Toast({ message, type }: ToastProps) {
  const variants = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400',
    },
    success: {
      icon: Check,
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      textColor: 'text-green-300',
      iconColor: 'text-green-400',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      textColor: 'text-yellow-300',
      iconColor: 'text-yellow-400',
    },
    error: {
      icon: X,
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
      textColor: 'text-red-300',
      iconColor: 'text-red-400',
    },
  }

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = variants[type]

  return (
    <motion.div
      initial={{ x: 100, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border glass ${bgColor} ${borderColor}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
    </motion.div>
  )
}
