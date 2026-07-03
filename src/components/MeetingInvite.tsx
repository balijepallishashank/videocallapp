import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Mail, MessageSquare, QrCode, Check, Link as LinkIcon } from 'lucide-react'
import IconButton from './IconButton'
import { QRCodeSVG } from 'qrcode.react'

interface MeetingInviteProps {
  isOpen: boolean
  onClose: () => void
  meetingId: string
  meetingTitle: string
  hostName: string
}

export default function MeetingInvite({
  isOpen,
  onClose,
  meetingId,
  meetingTitle,
  hostName,
}: MeetingInviteProps) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [emailTo, setEmailTo] = useState('')
  const [smsTo, setSmsTo] = useState('')

  const meetingLink = `${window.location.origin}${window.location.pathname}#join/${encodeURIComponent(meetingId)}`
  const inviteMessage = `Join "${meetingTitle}" meeting\n\nHost: ${hostName}\nMeeting ID: ${meetingId}\nLink: ${meetingLink}\n\nClick the link to join instantly!`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copyInviteText = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Join "${meetingTitle}" Meeting`)
    const body = encodeURIComponent(inviteMessage)
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank')
    setEmailTo('')
  }

  const sendSMS = () => {
    const body = encodeURIComponent(`Join meeting: ${meetingLink}`)
    window.open(`sms:${smsTo}?body=${body}`, '_blank')
    setSmsTo('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 flex items-center justify-center z-[60] p-4"
          >
            <div className="glass-dark rounded-2xl p-8 shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto w-full max-w-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Invite to Meeting</h2>
                  <p className="text-slate-400 text-sm">{meetingTitle}</p>
                </div>
                <IconButton onClick={onClose} ariaLabel="Close invite dialog" className="p-2 text-slate-400">
                  <X className="w-6 h-6" />
                </IconButton>
              </div>

              {/* Meeting Link */}
              <div className="space-y-4">
                <div className="glass rounded-xl p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    Meeting Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meetingLink}
                      readOnly
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium transition-all flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                </div>

                {/* Meeting ID */}
                <div className="glass rounded-xl p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Meeting ID
                  </label>
                  <p className="text-2xl font-mono font-bold text-white tracking-wider">
                    {meetingId}
                  </p>
                </div>

                {/* QR Code */}
                <div className="glass rounded-xl p-4">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQR ? 'Hide' : 'Show'} QR Code
                  </button>
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex justify-center bg-white p-4 rounded-lg"
                      >
                        <QRCodeSVG value={meetingLink} size={200} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email Invite */}
                <div className="glass rounded-xl p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Send Email Invite
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendEmail}
                      disabled={!emailTo}
                      className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </motion.button>
                  </div>
                </div>

                {/* SMS Invite */}
                <div className="glass rounded-xl p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Send SMS Invite
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={smsTo}
                      onChange={(e) => setSmsTo(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendSMS}
                      disabled={!smsTo}
                      className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </motion.button>
                  </div>
                </div>

                {/* Copy Full Invite */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyInviteText}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all shadow-lg"
                >
                  {copied ? 'Copied Full Invite!' : 'Copy Full Invite Message'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
