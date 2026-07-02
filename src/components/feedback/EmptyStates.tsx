import { motion } from 'framer-motion'
import { MessageSquare, Users, Phone, FileText } from 'lucide-react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

function EmptyStateBase({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="relative mb-8">
        {/* Background decorative elements to make it look like a rich illustration */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-xl transform scale-150"
        />
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl flex items-center justify-center shadow-blue-500/10"
        >
          <div className="text-blue-400 scale-[2] drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            {icon}
          </div>
        </motion.div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-sm mb-6">{description}</p>
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

// No meetings empty state
export function NoMeetingsEmptyState({ onSchedule }: { onSchedule: () => void }) {
  return (
    <EmptyStateBase
      icon={
        <svg className="w-24 h-24" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="40" width="120" height="120" rx="20" className="fill-slate-800 border border-slate-700" strokeWidth="4" stroke="#475569" />
          <path d="M40 80 H160" stroke="#475569" strokeWidth="4" />
          <rect x="60" y="20" width="20" height="40" rx="10" className="fill-blue-500" />
          <rect x="120" y="20" width="20" height="40" rx="10" className="fill-blue-500" />
          <circle cx="80" cy="120" r="10" className="fill-slate-600" />
          <circle cx="120" cy="120" r="10" className="fill-slate-600" />
        </svg>
      }
      title="No Meetings Scheduled"
      description="You haven't scheduled any meetings yet. Start planning your next call!"
      action={{ label: 'Schedule a Meeting', onClick: onSchedule }}
    />
  )
}

// No meeting history
export function NoMeetingHistoryEmptyState() {
  return (
    <EmptyStateBase
      icon={
        <svg className="w-24 h-24" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="70" className="fill-slate-800" stroke="#475569" strokeWidth="4" />
          <path d="M100 50 V100 L130 130" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="100" cy="100" r="10" className="fill-blue-500" />
        </svg>
      }
      title="No Call History"
      description="Your meeting history will appear here after you complete your first call."
    />
  )
}

// No contacts
export function NoContactsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyStateBase
      icon={<Users className="w-10 h-10" />}
      title="No Team Members"
      description="Add team members to start collaborating and scheduling meetings together."
      action={{ label: 'Add Team Member', onClick: onAdd }}
    />
  )
}

// No messages
export function NoMessagesEmptyState() {
  return (
    <EmptyStateBase
      icon={<MessageSquare className="w-10 h-10" />}
      title="No Messages"
      description="Start a conversation with your team. Messages will appear here."
    />
  )
}

// No files
export function NoFilesEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyStateBase
      icon={<FileText className="w-10 h-10" />}
      title="No Files Shared"
      description="Share documents and files with your team during meetings."
      action={{ label: 'Upload File', onClick: onUpload }}
    />
  )
}

// No active calls
export function NoActiveCallsEmptyState({ onStartCall }: { onStartCall: () => void }) {
  return (
    <EmptyStateBase
      icon={<Phone className="w-10 h-10" />}
      title="No Active Calls"
      description="Start a quick call with your team to begin collaborating right now."
      action={{ label: 'Start Quick Call', onClick: onStartCall }}
    />
  )
}

// Search results empty
export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-slate-400 mb-2">No results found for "{query}"</p>
      <p className="text-sm text-slate-500">Try a different search term</p>
    </div>
  )
}

// Generic empty state
export function EmptyState({ 
  message, 
  subMessage, 
  action 
}: { 
  message: string
  subMessage?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12 px-4"
    >
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{message}</h3>
      {subMessage && <p className="text-sm text-slate-500 mb-6">{subMessage}</p>}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium transition-all"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

// Container for empty states
export function EmptyStateContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      {children}
    </motion.div>
  )
}
