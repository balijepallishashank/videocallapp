import { useState, useEffect, useRef } from 'react'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  MessageSquare,
  Settings,
  Share2,
  Circle,
  Monitor,
  MoreHorizontal,
  Maximize,
  Minimize,
  Copy,
  UserPlus,
  Shield,
  Hand,
  Camera,
  Clock,
  Pencil,
  Film,
  Layers,
  LayoutGrid,
  Bell,
} from 'lucide-react'
import Whiteboard from './Whiteboard'
import BreakoutRooms from './BreakoutRooms'
import ScreenRecording from './ScreenRecording'
import VirtualBackgrounds from './VirtualBackgrounds'
import Toast from './Toast'
import FloatingReactions from './FloatingReactions'
import MeetingInvite from './MeetingInvite'
import WaitingRoom, { type WaitingParticipant } from './WaitingRoom'

interface MeetingParticipant {
  id: string
  name: string
  email: string
  avatar?: string
  isVideoOn: boolean
  isMuted: boolean
  isHost: boolean
  stream?: MediaStream
}

interface SelectedStudent {
  id: string
  name: string
  email: string
}

interface MeetingRoomProps {
  meetingId: string
  meetingTitle: string
  participants?: MeetingParticipant[]
  selectedStudents: SelectedStudent[]
  attendanceMap?: Record<string, boolean>
  currentUser: {
    id: string
    name: string
    email: string
    role: 'faculty' | 'student'
  }
  onEndMeeting: () => void
  onInviteParticipants?: () => void
  onToggleAttendance?: (studentId: string) => void
}

export default function MeetingRoom({
  meetingId,
  meetingTitle,
  participants = [],
  selectedStudents = [],
  attendanceMap = {},
  currentUser,
  onEndMeeting,
  onInviteParticipants,
  onToggleAttendance,
}: MeetingRoomProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [viewMode] = useState<'grid' | 'speaker'>('grid')
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [speakingQueue, setSpeakingQueue] = useState<string[]>([]) // Array of participant IDs in queue
  const [showSpeakingQueue, setShowSpeakingQueue] = useState(false)
  const [fullscreenParticipant, setFullscreenParticipant] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    sender: string
    message: string
    timestamp: Date
    isSystem?: boolean
  }>>([
    {
      id: '1',
      sender: 'System',
      message: `${currentUser.name} started the meeting`,
      timestamp: new Date(),
      isSystem: true
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenShareStreamRef = useRef<MediaStream | null>(null)
  const [showToolPanel, setShowToolPanel] = useState<'whiteboard' | 'breakoutRooms' | 'screenRecording' | 'virtualBg' | 'waitingRoom' | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([])
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string
    emoji: string
    x: number
    y: number
    variant?: 'burst' | 'spiral' | 'float' | 'bounce'
  }>>([])
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>(() =>
    currentUser.role === 'faculty'
      ? selectedStudents.slice(0, Math.min(2, selectedStudents.length)).map((student, index) => ({
          id: `waiting-${student.id}`,
          name: student.name,
          email: student.email,
          avatar: student.name.charAt(0).toUpperCase(),
          joinedAt: new Date(Date.now() - (index + 1) * 60000),
        }))
      : [],
  )
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlHideTimer = useRef<number | null>(null)

  // Initialize camera and microphone
  const initializeMedia = async () => {
    try {
      setMediaError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Ensure tracks reflect current UI state
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted))
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOn))

      setLocalStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
      return true
    } catch (error) {
      console.error('Failed to access media devices:', error)
      setIsVideoOn(false)

      let errorMessage = 'Unable to access camera or microphone'
      const err = error as any
      if (err && err.name) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          errorMessage = 'Permission denied. Please allow camera/microphone access in your browser.'
        } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          errorMessage = 'No camera or microphone found. Check device connection.'
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera or microphone appears to be in use by another application.'
        }
      }

      setMediaError(errorMessage)
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message: errorMessage, type: 'error' }])
      // Developer fallback on localhost: create a fake MediaStream so UI controls can be tested
      try {
        if ((typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) || process.env.NODE_ENV === 'development') {
          const fake = createDevMediaStream()
          setLocalStream(fake)
          if (videoRef.current) videoRef.current.srcObject = fake
          setToasts((prev) => [...prev, { id: `toast-${Date.now()}-${Math.random()}`, message: 'Using developer fake camera/mic for testing', type: 'info' }])
          setMediaError(null)
          return true
        }
      } catch (e) {
        console.warn('Failed to create dev media stream', e)
      }

      return false
    }
  }

  useEffect(() => {
    initializeMedia()

    return () => {
      if (localStream) localStream.getTracks().forEach((track) => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Reveal controls on movement/scroll, then hide after a short delay
  useEffect(() => {
    const scheduleHide = () => {
      if (controlHideTimer.current) window.clearTimeout(controlHideTimer.current)
      controlHideTimer.current = window.setTimeout(() => setControlsVisible(false), 2200)
    }

    const revealControls = () => {
      setControlsVisible(true)
      scheduleHide()
    }

    revealControls()
    window.addEventListener('mousemove', revealControls)
    window.addEventListener('scroll', revealControls, { passive: true })
    window.addEventListener('touchmove', revealControls, { passive: true })

    return () => {
      window.removeEventListener('mousemove', revealControls)
      window.removeEventListener('scroll', revealControls)
      window.removeEventListener('touchmove', revealControls)
      if (controlHideTimer.current) window.clearTimeout(controlHideTimer.current)
    }
  }, [])

  useEffect(() => {
    const handleReactionEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string
        emoji: string
        x?: number
        y?: number
        variant?: 'burst' | 'spiral' | 'float' | 'bounce'
      }>

      const reaction = {
        id: customEvent.detail?.id || `reaction-${Date.now()}-${Math.random()}`,
        emoji: customEvent.detail?.emoji || '👏',
        x: customEvent.detail?.x ?? 50,
        y: customEvent.detail?.y ?? 100,
        variant: customEvent.detail?.variant || 'float',
      }

      setFloatingReactions((prev) => [...prev, reaction])
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((item) => item.id !== reaction.id))
      }, 3600)
    }

    window.addEventListener('reactionSent', handleReactionEvent)
    return () => window.removeEventListener('reactionSent', handleReactionEvent)
  }, [])

  // Format meeting duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hrs > 0 
      ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Request to speak functionality
  const requestToSpeak = () => {
    if (!speakingQueue.includes(currentUser.id)) {
      setSpeakingQueue(prev => [...prev, currentUser.id])
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'System',
        message: `${currentUser.name} requested to speak`,
        timestamp: new Date(),
        isSystem: true
      }])
    }
  }

  const removeFromQueue = (participantId: string) => {
    setSpeakingQueue(prev => prev.filter(id => id !== participantId))
  }

  const clearSpeakingQueue = () => {
    setSpeakingQueue([])
  }

  // Developer helper: create a fake MediaStream (canvas video + silent audio)
  const createDevMediaStream = (): MediaStream => {
    // video via canvas
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 360
    const ctx = canvas.getContext('2d')!
    let frame = 0
    const draw = () => {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0ea5a4'
      ctx.font = '56px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Dev Camera', canvas.width / 2, canvas.height / 2)
      ctx.font = '24px sans-serif'
      ctx.fillText(`Frame ${frame++}`, canvas.width / 2, canvas.height / 2 + 40)
      requestAnimationFrame(draw)
    }
    draw()

    const videoStream = (canvas as any).captureStream(15)

    // silent audio track
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    oscillator.frequency.value = 0
    const dest = audioCtx.createMediaStreamDestination()
    oscillator.connect(dest)
    oscillator.start()

    const composed = new MediaStream()
    videoStream.getVideoTracks().forEach((t: MediaStreamTrack) => composed.addTrack(t))
    dest.stream.getAudioTracks().forEach((t) => composed.addTrack(t))
    return composed
  }

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }

  const toggleToolPanel = (panel: 'whiteboard' | 'breakoutRooms' | 'screenRecording' | 'virtualBg' | 'waitingRoom') => {
    setShowToolPanel(prev => prev === panel ? null : panel)
    setShowParticipants(false)
    setShowChat(false)
    setShowSpeakingQueue(false)
  }

  const admitParticipant = (participantId: string) => {
    setWaitingParticipants((prev) => prev.filter((participant) => participant.id !== participantId))
    addToast('Participant admitted to the meeting', 'success')
  }

  const rejectParticipant = (participantId: string) => {
    setWaitingParticipants((prev) => prev.filter((participant) => participant.id !== participantId))
    addToast('Participant removed from waiting room', 'warning')
  }

  const admitAllParticipants = () => {
    if (waitingParticipants.length === 0) return
    setWaitingParticipants([])
    addToast('All waiting participants admitted', 'success')
  }

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenShareStreamRef.current = stream
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false)
          screenShareStreamRef.current = null
        }
        setIsScreenSharing(true)
        addToast('Screen sharing started', 'success')
      } catch {
        addToast('Could not start screen sharing', 'error')
      }
    } else {
      screenShareStreamRef.current?.getTracks().forEach(t => t.stop())
      screenShareStreamRef.current = null
      setIsScreenSharing(false)
      addToast('Screen sharing stopped', 'info')
    }
  }

  // Handle video toggle
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        const newVideoOn = !isVideoOn
        videoTrack.enabled = newVideoOn
        setIsVideoOn(newVideoOn)
      }
    }
  }

  // Handle mute toggle
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        const newMuted = !isMuted
        audioTrack.enabled = !newMuted
        setIsMuted(newMuted)
      }
    }
  }

  const selectedStudentIds = new Set(selectedStudents.map((student) => student.id))

  // Create participants including current user and selected students
  const allParticipants: MeetingParticipant[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      isVideoOn: isVideoOn,
      isMuted: isMuted,
      isHost: currentUser.role === 'faculty',
      stream: localStream || undefined,
    },
    ...selectedStudents.map((student, index) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      isVideoOn: index % 2 === 0,
      isMuted: index % 3 === 0,
      isHost: false,
    })),
    ...participants,
  ]

  const sendMessage = () => {
    if (newMessage.trim()) {
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: currentUser.name,
          message: newMessage.trim(),
          timestamp: new Date(),
        },
      ])
      setNewMessage('')
    }
  }

  const handleEndMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    onEndMeeting()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-50 flex flex-col">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              {meetingTitle}
              {currentUser.role === 'faculty' && (
                <div title="Host">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
              <span>ID: {meetingId.slice(-8)}</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(meetingDuration)}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-md">
                <Circle className="w-2 h-2 text-red-400 fill-current animate-pulse" />
                <span className="text-red-300 text-xs font-medium">
                  {isRecording ? 'Recording' : 'Live'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Meeting Controls */}
          <button
            onClick={() => {
              setShowInviteModal(true)
              onInviteParticipants?.()
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 text-sm font-medium transition-colors"
            title="Invite participants"
          >
            <Copy className="w-4 h-4" />
            Invite
          </button>
          

          
          <button
            onClick={() => { setShowParticipants(!showParticipants); setShowToolPanel(null); }}
            className={`relative p-2 rounded-lg transition-colors ${
              showParticipants 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Participants"
          >
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {allParticipants.length}
            </span>
          </button>
          
          <button
            onClick={() => { setShowChat(!showChat); setShowToolPanel(null); }}
            className={`relative p-2 rounded-lg transition-colors ${
              showChat 
                ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Chat"
          >
            <MessageSquare className="w-5 h-5" />
            {chatMessages.filter(m => !m.isSystem).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {chatMessages.filter(m => !m.isSystem).length}
              </span>
            )}
          </button>

          {/* Tool Panel Buttons */}
          <button
            onClick={() => toggleToolPanel('whiteboard')}
            className={`p-2 rounded-lg transition-colors ${
              showToolPanel === 'whiteboard'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Whiteboard"
          >
            <Pencil className="w-5 h-5" />
          </button>

          <button
            onClick={() => toggleToolPanel('breakoutRooms')}
            className={`p-2 rounded-lg transition-colors ${
              showToolPanel === 'breakoutRooms'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-400/30'
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Breakout Rooms"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          <button
            onClick={() => toggleToolPanel('screenRecording')}
            className={`p-2 rounded-lg transition-colors ${
              showToolPanel === 'screenRecording'
                ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Recording Panel"
          >
            <Film className="w-5 h-5" />
          </button>

          <button
            onClick={() => toggleToolPanel('virtualBg')}
            className={`p-2 rounded-lg transition-colors ${
              showToolPanel === 'virtualBg'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                : 'hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
            title="Virtual Backgrounds"
          >
            <Layers className="w-5 h-5" />
          </button>

          {currentUser.role === 'faculty' && (
            <button
              onClick={() => toggleToolPanel('waitingRoom')}
              className={`p-2 rounded-lg transition-colors ${
                showToolPanel === 'waitingRoom'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'hover:bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Waiting Room"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {showSettings && (
              <div className="absolute top-12 right-0 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-xl p-2 min-w-48 shadow-xl z-50">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                </button>
                <button
                  onClick={toggleScreenShare}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {isScreenSharing ? 'Stop sharing' : 'Share screen'}
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                  <Camera className="w-4 h-4" />
                  Camera settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Video Area */}
        <div className="flex-1 p-4 relative">
          {/* Screen sharing indicator */}
          {isScreenSharing && (
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium z-10 backdrop-blur-sm">
              You are sharing your screen
            </div>
          )}
          
          <div className={`h-full ${fullscreenParticipant ? 'grid grid-cols-1' : viewMode === 'grid' ? 'grid gap-3' : 'flex flex-col gap-4'} ${
            fullscreenParticipant ? '' :
            allParticipants.length <= 1 ? 'grid-cols-1' :
            allParticipants.length <= 4 ? 'grid-cols-2' :
            allParticipants.length <= 6 ? 'grid-cols-2 md:grid-cols-3' :
            allParticipants.length <= 9 ? 'grid-cols-3' :
            'grid-cols-3 md:grid-cols-4'
          }`}>
            {(fullscreenParticipant ? allParticipants.filter(p => p.id === fullscreenParticipant) : allParticipants).map((participant, index) => {
              const queuePosition = speakingQueue.indexOf(participant.id)
              const isInQueue = queuePosition !== -1
              
              return (
                <div
                  className={`relative bg-slate-900 rounded-lg overflow-hidden ${
                    fullscreenParticipant ? 'h-full' : viewMode === 'speaker' && index === 0 ? 'flex-1' : viewMode === 'speaker' && index > 0 ? 'h-24 flex-shrink-0' : ''
                  } group hover:ring-2 hover:ring-blue-400/50 transition-all duration-200 cursor-pointer ${
                    participant.isHost ? 'ring-1 ring-emerald-400/30' : ''
                  } ${isInQueue ? 'ring-2 ring-yellow-400/60 animate-pulse' : ''}`}
                  onClick={() => !fullscreenParticipant && setFullscreenParticipant(participant.id)}
                >
                  {participant.isVideoOn ? (
                    <div className="w-full h-full relative">
                      {participant.id === currentUser.id && participant.stream ? (
                        <video
                          ref={participant.id === currentUser.id ? videoRef : undefined}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center relative">
                          <div className={`rounded-full bg-slate-600/80 flex items-center justify-center backdrop-blur-sm border border-slate-500/50 ${
                            fullscreenParticipant ? 'w-32 h-32' : 'w-16 h-16 md:w-20 md:h-20'
                          }`}>
                            <span className={`font-bold text-slate-200 ${
                              fullscreenParticipant ? 'text-4xl' : 'text-xl md:text-2xl'
                            }`}>
                              {participant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                      <div className="text-center">
                        <div className={`rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3 ${
                          fullscreenParticipant ? 'w-32 h-32' : 'w-16 h-16 md:w-20 md:h-20'
                        }`}>
                          <span className={`font-bold text-slate-300 ${
                            fullscreenParticipant ? 'text-4xl' : 'text-xl md:text-2xl'
                          }`}>
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <VideoOff className={`text-slate-400 mx-auto mb-2 ${
                          fullscreenParticipant ? 'w-8 h-8' : 'w-6 h-6'
                        }`} />
                        <span className={`text-slate-400 ${
                          fullscreenParticipant ? 'text-base' : 'text-sm'
                        }`}>Camera is off</span>
                      </div>
                    </div>
                  )}

                {/* Queue Number Badge */}
                {isInQueue && (
                  <div className="absolute top-3 right-3 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    #{queuePosition + 1}
                  </div>
                )}

                {/* Fullscreen controls */}
                {fullscreenParticipant && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFullscreenParticipant(null)
                    }}
                    className="absolute top-4 right-4 p-3 bg-black/60 rounded-lg hover:bg-black/80 text-white transition-colors"
                  >
                    <Minimize className="w-5 h-5" />
                  </button>
                )}

                {/* Enhanced Participant Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-white font-medium ${
                        fullscreenParticipant ? 'text-lg' : 'text-sm'
                      }`}>
                        {participant.name}
                        {participant.isHost && ' (Host)'}
                        {participant.id === currentUser.id && ' (You)'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Connection quality indicator */}
                      <div className="flex gap-1">
                        <div className="w-1 h-3 bg-green-400 rounded-full"></div>
                        <div className="w-1 h-2 bg-green-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                      </div>
                      
                      {/* Audio indicator */}
                      {!participant.isMuted ? (
                        <div className={`bg-green-500/80 rounded-full flex items-center justify-center ${
                          fullscreenParticipant ? 'w-8 h-8' : 'w-6 h-6'
                        }`}>
                          <Mic className={`text-white ${
                            fullscreenParticipant ? 'w-4 h-4' : 'w-3 h-3'
                          }`} />
                        </div>
                      ) : (
                        <div className={`bg-red-500/80 rounded-full flex items-center justify-center ${
                          fullscreenParticipant ? 'w-8 h-8' : 'w-6 h-6'
                        }`}>
                          <MicOff className={`text-white ${
                            fullscreenParticipant ? 'w-4 h-4' : 'w-3 h-3'
                          }`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})}

            {mediaError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-6">
                <div className="bg-slate-900/95 text-slate-100 rounded-xl p-6 max-w-md text-center">
                  <p className="mb-4 font-semibold">{mediaError}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => initializeMedia()}
                      className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    >
                      How to allow access
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">If using Windows, also check OS privacy settings: Settings → Privacy & security → Camera / Microphone.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Side Panel */}
        {(showParticipants || showChat || (currentUser.role === 'faculty' && showSpeakingQueue) || showToolPanel !== null) && (
          <div className="w-80 bg-slate-900/90 backdrop-blur-sm border-l border-white/10 flex flex-col">
            {/* Tab Headers */}
            <div className="flex border-b border-white/10">
              {showParticipants && (
                <button
                  onClick={() => { setShowParticipants(true); setShowChat(false); setShowSpeakingQueue(false); }}
                  className={`flex-1 p-3 text-sm font-medium transition-colors ${
                    showParticipants && !showChat && !showSpeakingQueue
                      ? 'text-white border-b-2 border-blue-400 bg-blue-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Participants ({allParticipants.length})
                </button>
              )}
              {showChat && (
                <button
                  onClick={() => { setShowChat(true); setShowParticipants(false); setShowSpeakingQueue(false); }}
                  className={`flex-1 p-3 text-sm font-medium transition-colors ${
                    showChat && !showParticipants && !showSpeakingQueue
                      ? 'text-white border-b-2 border-green-400 bg-green-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Chat ({chatMessages.filter(m => !m.isSystem).length})
                </button>
              )}
              {currentUser.role === 'faculty' && speakingQueue.length > 0 && (
                <button
                  onClick={() => { setShowSpeakingQueue(true); setShowParticipants(false); setShowChat(false); }}
                  className={`flex-1 p-3 text-sm font-medium transition-colors relative ${
                    showSpeakingQueue && !showParticipants && !showChat
                      ? 'text-white border-b-2 border-yellow-400 bg-yellow-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Speaking Queue ({speakingQueue.length})
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-black font-bold animate-pulse">
                    {speakingQueue.length}
                  </div>
                </button>
              )}
              {showToolPanel !== null && !showParticipants && !showChat && (
                <button
                  className="flex-1 p-3 text-sm font-medium text-white border-b-2 border-indigo-400 bg-indigo-500/10 flex items-center justify-center gap-2"
                >
                  {showToolPanel === 'whiteboard' && <><Pencil className="w-4 h-4" /> Whiteboard</>}
                  {showToolPanel === 'breakoutRooms' && <><LayoutGrid className="w-4 h-4" /> Breakout Rooms</>}
                  {showToolPanel === 'screenRecording' && <><Film className="w-4 h-4" /> Recording</>}
                  {showToolPanel === 'virtualBg' && <><Layers className="w-4 h-4" /> Virtual BG</>}
                  {showToolPanel === 'waitingRoom' && <><Bell className="w-4 h-4" /> Waiting Room</>}
                </button>
              )}
            </div>

            {/* Speaking Queue Panel (Faculty only) */}
            {currentUser.role === 'faculty' && showSpeakingQueue && (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Speaking Queue</h3>
                  <button
                    onClick={clearSpeakingQueue}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                
                {speakingQueue.length === 0 ? (
                  <div className="text-center text-slate-400 mt-8">
                    <Hand className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No speaking requests</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {speakingQueue.map((participantId, index) => {
                      const participant = allParticipants.find(p => p.id === participantId)
                      if (!participant) return null
                      
                      return (
                        <div key={participantId} className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/20">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-sm">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{participant.name}</div>
                              <div className="text-xs text-slate-400">Waiting to speak</div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromQueue(participantId)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {showParticipants && (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">In this meeting</h3>
                  <button
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                    title="Invite more people"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {allParticipants
                    .sort((a, b) => {
                      if (a.isHost && !b.isHost) return -1;
                      if (!a.isHost && b.isHost) return 1;
                      if (a.id === currentUser.id) return -1;
                      if (b.id === currentUser.id) return 1;
                      return 0;
                    })
                    .map((participant) => {
                      const queuePosition = speakingQueue.indexOf(participant.id)
                      const isInQueue = queuePosition !== -1
                      const isStudentParticipant = selectedStudentIds.has(participant.id)
                      const isMarkedAttended = attendanceMap[participant.id] || false
                      
                      return (
                      <div 
                        key={participant.id} 
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer ${
                          isInQueue ? 'bg-yellow-500/10 border border-yellow-400/30' : ''
                        }`}
                        onClick={() => setFullscreenParticipant(participant.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {participant.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {participant.isVideoOn && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-slate-900"></div>
                            )}
                            {isInQueue && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 text-black rounded-full flex items-center justify-center text-xs font-bold">
                                {queuePosition + 1}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white flex items-center gap-2">
                              {participant.name}
                              {participant.isHost && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded border border-emerald-400/30">
                                  Host
                                </span>
                              )}
                              {participant.id === currentUser.id && (
                                <span className="text-xs text-slate-400">(You)</span>
                              )}
                              {isInQueue && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-400/30">
                                  Wants to speak
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{participant.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Audio/Video Status */}
                          <div className="flex items-center gap-1">
                            {!participant.isMuted ? (
                              <div className="p-1 bg-green-500/20 rounded">
                                <Mic className="w-3 h-3 text-green-400" />
                              </div>
                            ) : (
                              <div className="p-1 bg-red-500/20 rounded">
                                <MicOff className="w-3 h-3 text-red-400" />
                              </div>
                            )}
                            {participant.isVideoOn ? (
                              <div className="p-1 bg-green-500/20 rounded">
                                <Video className="w-3 h-3 text-green-400" />
                              </div>
                            ) : (
                              <div className="p-1 bg-red-500/20 rounded">
                                <VideoOff className="w-3 h-3 text-red-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* More options for host */}
                          {currentUser.role === 'faculty' && participant.id !== currentUser.id && (
                            <div className="flex items-center gap-1">
                              {isStudentParticipant && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleAttendance?.(participant.id)
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                                    isMarkedAttended
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                                  }`}
                                  title={isMarkedAttended ? 'Marked attended - click to mark absent' : 'Marked absent - click to mark attended'}
                                >
                                  {isMarkedAttended ? 'Attended' : 'Absent'}
                                </button>
                              )}
                              <button 
                                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                </div>
              </div>
            )}

            {showChat && (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Messages</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare className="w-3 h-3" />
                    <span>Live chat</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-64">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-400 mt-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                      <p className="text-xs mt-1">Say hello to get the conversation started!</p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div key={message.id} className={`text-sm ${message.isSystem ? 'text-center' : ''}`}>
                        {message.isSystem ? (
                          <div className="text-slate-400 italic px-3 py-2 bg-slate-800/50 rounded-lg">
                            {message.message}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-300">{message.sender}</span>
                              <span className="text-xs text-slate-500">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-slate-400 break-words bg-slate-800/30 p-2 rounded-lg">
                              {message.message}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Send a message to everyone"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Tool Panels */}
            {showToolPanel === 'whiteboard' && (
              <div className="flex-1 overflow-y-auto p-3">
                <Whiteboard onToast={addToast} />
              </div>
            )}

            {showToolPanel === 'breakoutRooms' && (
              <div className="flex-1 overflow-y-auto p-3">
                <BreakoutRooms
                  mainParticipants={allParticipants.map(p => p.name)}
                  onToast={addToast}
                />
              </div>
            )}

            {showToolPanel === 'screenRecording' && (
              <div className="flex-1 overflow-y-auto p-3">
                <ScreenRecording videoStream={localStream} onToast={addToast} />
              </div>
            )}

            {showToolPanel === 'virtualBg' && (
              <div className="flex-1 overflow-y-auto p-3">
                <VirtualBackgrounds videoRef={videoRef} onToast={addToast} />
              </div>
            )}

            {showToolPanel === 'waitingRoom' && currentUser.role === 'faculty' && (
              <div className="flex-1 overflow-y-auto p-3">
                <WaitingRoom
                  waitingParticipants={waitingParticipants}
                  onAdmit={admitParticipant}
                  onReject={rejectParticipant}
                  onAdmitAll={admitAllParticipants}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Control Bar */}
      <div
        className={`fixed left-0 right-0 bottom-0 px-6 py-4 transition-all duration-300 ease-out backdrop-blur-lg border-t border-white/10 ${
          controlsVisible ? 'opacity-100 translate-y-0 bg-slate-900/40' : 'opacity-0 translate-y-4 pointer-events-none bg-slate-900/20'
        }`}
        onMouseEnter={() => setControlsVisible(true)}
        onMouseMove={() => setControlsVisible(true)}
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Left Side - Meeting Info */}
          <div className="flex items-center gap-4 text-sm text-slate-300 min-w-0 flex-1">
            {speakingQueue.length > 0 && currentUser.role === 'faculty' && (
              <div className="flex items-center gap-2 text-yellow-400">
                <Hand className="w-4 h-4" />
                <span>{speakingQueue.length} waiting to speak</span>
              </div>
            )}
          </div>

          {/* Center - Main Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className={`relative p-4 rounded-full transition-all duration-200 ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
              }`}
              title={isMuted ? 'Unmute (⌘+D)' : 'Mute (⌘+D)'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {!isMuted && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all duration-200 ${
                !isVideoOn
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
              }`}
              title={isVideoOn ? 'Stop video (⌘+E)' : 'Start video (⌘+E)'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all duration-200 ${
                isScreenSharing
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
              }`}
              title="Share screen"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Request to Speak (Students only) */}
            {currentUser.role === 'student' && (
              <button
                onClick={requestToSpeak}
                disabled={speakingQueue.includes(currentUser.id)}
                className={`p-4 rounded-full transition-all duration-200 ${
                  speakingQueue.includes(currentUser.id)
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25 cursor-not-allowed'
                    : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
                }`}
                title={speakingQueue.includes(currentUser.id) ? 'Request sent' : 'Request to speak'}
              >
                <Hand className="w-5 h-5" />
              </button>
            )}

            {/* Speaking Queue Toggle (Faculty only) */}
            {currentUser.role === 'faculty' && speakingQueue.length > 0 && (
              <button
                onClick={() => setShowSpeakingQueue(!showSpeakingQueue)}
                className={`relative p-4 rounded-full transition-all duration-200 ${
                  showSpeakingQueue
                    ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                    : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
                }`}
                title="View speaking queue"
              >
                <Hand className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                  {speakingQueue.length}
                </div>
              </button>
            )}

            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-4 rounded-full transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Circle className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Right Side - Settings and End Meeting */}
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 rounded-full bg-slate-700/80 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 transition-all duration-200"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-16 right-0 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-xl p-2 min-w-56 shadow-xl z-50">
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                      {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                      Camera settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                      <Mic className="w-4 h-4" />
                      Audio settings
                    </button>
                    <div className="border-t border-slate-600 my-2"></div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                      <Monitor className="w-4 h-4" />
                      Display settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-colors">
                      <Shield className="w-4 h-4" />
                      Meeting security
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleEndMeeting}
              className="px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
              title="Leave meeting"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-20 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      <FloatingReactions reactions={floatingReactions} />

      <MeetingInvite
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        meetingId={meetingId}
        meetingTitle={meetingTitle}
        hostName={currentUser.name}
      />
    </div>
  )
}
