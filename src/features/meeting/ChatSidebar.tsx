import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, MessageCircle, Users, File as FileIcon } from 'lucide-react'

interface Message {
  id: number
  author: string
  avatar: string
  content: string
  timestamp: string
  isOwn: boolean
  recipient?: string
  file?: string
}

interface ChatSidebarProps {
  onAddToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

const initialMessages: Message[] = [
  {
    id: 1,
    author: 'Sarah Chen',
    avatar: '👩‍💼',
    content: 'Great presentation so far!',
    timestamp: '10:30 AM',
    isOwn: false,
    recipient: 'everyone'
  },
  {
    id: 2,
    author: 'You',
    avatar: '👨‍💼',
    content: 'Thanks! The design feedback is really helpful.',
    timestamp: '10:31 AM',
    isOwn: true,
    recipient: 'everyone'
  },
  {
    id: 3,
    author: 'Alex Rivera',
    avatar: '👨‍🎨',
    content: 'I love the color scheme. Any thoughts on accessibility?',
    timestamp: '10:32 AM',
    isOwn: false,
    recipient: 'everyone'
  },
  {
    id: 4,
    author: 'You',
    avatar: '👨‍💼',
    content: 'Good point! We should test with screen readers.',
    timestamp: '10:33 AM',
    isOwn: true,
    recipient: 'everyone'
  },
]

export default function ChatSidebar({ onAddToast }: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'participants'>('messages')
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [chatRecipient, setChatRecipient] = useState<string>('everyone')
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        author: 'You',
        avatar: '👨‍💼',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        recipient: chatRecipient
      }
      setMessages([...messages, newMessage])
      setInputValue('')
      onAddToast('Message sent', 'success')
    }
  }

  const handleAttachment = () => {
    onAddToast('File attachment selected', 'info')
  }

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full flex flex-col glass-dark rounded-2xl p-5 shadow-xl"
    >
      {/* Tabs - Message and Participants switcher */}
      <div className="flex gap-2 mb-5 pb-4 border-b border-white/20">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all flex-1 justify-center font-semibold shadow-lg ${
            activeTab === 'messages'
              ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50 shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">Chat</span>
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('participants')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all flex-1 justify-center font-semibold shadow-lg ${
            activeTab === 'participants'
              ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50 shadow-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-sm">People</span>
        </motion.button>
      </div>

      {/* Content Area - Flexible height */}
      {activeTab === 'messages' ? (
        <div 
          className="flex-1 flex flex-col relative"
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files.length > 0) {
              const file = e.dataTransfer.files[0];
              const newMessage: Message = { id: messages.length + 1, author: 'You', avatar: '👨‍💼', content: `Shared a file: ${file.name}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isOwn: true, recipient: chatRecipient, file: file.name };
              setMessages([...messages, newMessage]);
              onAddToast(`Shared ${file.name}`, 'success');
            }
          }}
        >
          {isDraggingFile && (
            <div className="absolute inset-0 z-20 mb-16 border-2 border-dashed border-blue-500 bg-slate-900/90 flex items-center justify-center rounded-xl backdrop-blur-sm">
              <p className="text-blue-400 font-bold text-lg pointer-events-none">Drop file to share</p>
            </div>
          )}
          <select value={chatRecipient} onChange={(e) => setChatRecipient(e.target.value)} className="bg-slate-800 border border-slate-700 text-xs text-slate-300 p-1.5 rounded-md mb-3 w-full outline-none cursor-pointer">
            <option value="everyone">Everyone</option>
            <option value="sarah">To: Sarah Chen (Direct)</option>
            <option value="alex">To: Alex Rivera (Direct)</option>
          </select>
          {/* Messages - Scrollable area */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-5 pr-2 custom-scrollbar">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ x: message.isOwn ? 50 : -50, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-lg flex-shrink-0 border border-white/10 shadow-lg">{message.avatar}</div>
                  <div className={`flex flex-col ${message.isOwn ? 'items-end' : ''} max-w-[75%]`}>
                    <div className="text-[11px] text-slate-400 mb-1.5 px-1">
                      <span className="font-bold text-slate-300">{message.author}</span>
                      {message.recipient !== 'everyone' && <span className="ml-1 px-1 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] uppercase tracking-wider">Direct</span>}
                      <span className="ml-2 text-slate-500">{message.timestamp}</span>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`px-4 py-2.5 rounded-2xl text-sm break-words shadow-lg ${
                        message.isOwn
                          ? message.recipient !== 'everyone' ? 'bg-gradient-to-br from-purple-600/50 to-purple-700/50 border border-purple-400/50 text-white shadow-purple-500/20' : 'bg-gradient-to-br from-blue-600/50 to-blue-700/50 border border-blue-400/50 text-white shadow-blue-500/20'
                          : 'bg-slate-800/60 backdrop-blur-sm border border-white/10 text-slate-100 shadow-black/20'
                      }`}
                    >
                      {message.file && <FileIcon className="inline w-4 h-4 mr-1 text-blue-400" />}
                      {message.content}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input - Fixed at bottom */}
          <div className="flex items-center gap-3 pt-4 pb-2 border-t border-white/20 px-1">
            <motion.button
              whileHover={{ scale: 1.08, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAttachment}
              className="flex-shrink-0 p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-all border border-white/10 shadow-lg hover:shadow-md flex items-center justify-center"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-slate-300" />
            </motion.button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-white/10 placeholder-slate-500 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition-all shadow-lg"
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-r from-blue-500/60 to-purple-500/60 text-white hover:from-blue-500/80 hover:to-purple-500/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-blue-400/50 shadow-lg shadow-blue-500/30 flex items-center justify-center"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar">
          {[
            { name: 'You', avatar: '👨‍💼', status: 'Host', color: 'from-blue-500 to-cyan-500' },
            { name: 'Sarah Chen', avatar: '👩‍💼', status: 'Active', color: 'from-green-500 to-emerald-500' },
            { name: 'Alex Rivera', avatar: '👨‍🎨', status: 'Active', color: 'from-purple-500 to-pink-500' },
            { name: 'Emma Wilson', avatar: '👩‍🎓', status: 'Idle', color: 'from-amber-500 to-orange-500' },
            { name: 'James Park', avatar: '👨‍💻', status: 'Active', color: 'from-indigo-500 to-violet-500' },
          ].map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4, scale: 1.02 }}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 transition-all group border border-white/10 hover:border-white/20 shadow-lg cursor-pointer"
            >
              <div className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl bg-gradient-to-br ${p.color} bg-opacity-30 border border-white/10 shadow-lg`}>
                {p.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{p.name}</div>
                <div className={`text-xs flex items-center gap-1.5 mt-1 font-semibold ${
                  p.status === 'Host' ? 'text-blue-300' : 
                  p.status === 'Active' ? 'text-green-300' : 
                  'text-amber-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full shadow-lg ${
                    p.status === 'Host' ? 'bg-blue-400 shadow-blue-500/50' : 
                    p.status === 'Active' ? 'bg-green-400 animate-pulse shadow-green-500/50' : 
                    'bg-amber-400 shadow-amber-500/50'
                  }`} />
                  {p.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
