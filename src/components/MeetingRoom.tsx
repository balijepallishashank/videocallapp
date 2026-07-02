import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
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
  Maximize,
  Minimize,
  Copy,
  UserPlus,
  Shield,
  Hand,
  Camera,
  Clock,
  Pencil,
  Layers,
  LayoutGrid,
  Bell,
  BarChart2,
  File as FileIcon,
  Subtitles,
  AlertTriangle,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import Whiteboard from './Whiteboard'
import BreakoutRooms from './BreakoutRooms'
import VirtualBackgrounds from './VirtualBackgrounds'
import Toast from './Toast'
import FloatingReactions from './FloatingReactions'
import MeetingInvite from './MeetingInvite'
import WaitingRoom, { type WaitingParticipant } from './WaitingRoom'
import { sendSyncMessage, registerSyncListener } from '../services/syncChannel'

const ScreenRecording = lazy(() => import('./ScreenRecording'))

// Layout view system imports
import VideoGrid from './VideoGrid'
import ViewMenu from './ViewMenu'
import { useActiveSpeakerDetection } from './ActiveSpeakerManager'
import { useLayoutStore } from './MeetingLayoutManager'

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
  isPipMode?: boolean
  onTogglePip?: () => void
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
  isPipMode = false,
  onTogglePip,
}: MeetingRoomProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [activePeers, setActivePeers] = useState<Record<string, MeetingParticipant>>({})
  
  const isVideoOnRef = useRef(isVideoOn)
  const isMutedRef = useRef(isMuted)
  useEffect(() => {
    isVideoOnRef.current = isVideoOn
  }, [isVideoOn])
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const [isCaptionsOn, setIsCaptionsOn] = useState(false)
  const { compactMode, accessibilityMode, pinnedParticipantId, setPinnedParticipantId } = useLayoutStore()
  const [showParticipants, setShowParticipants] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPolls, setShowPolls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [speakingQueue, setSpeakingQueue] = useState<string[]>([]) // Array of participant IDs in queue
  const [showSpeakingQueue, setShowSpeakingQueue] = useState(false)
  const [showToolPanel, setShowToolPanel] = useState<string | null>(null)
  
  const toggleToolPanel = useCallback((panel: string) => {
    setShowToolPanel(prev => prev === panel ? null : panel)
    setShowParticipants(false)
    setShowChat(false)
    setShowSpeakingQueue(false)
  }, [])

  const isRecording = showToolPanel === 'recording'
  const handleRecordingClick = () => {
    toggleToolPanel('recording')
  }
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    sender: string
    message: string
    timestamp: Date
    isSystem?: boolean
    recipient?: string
    file?: string
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
  const [chatRecipient, setChatRecipient] = useState<string>('everyone')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [liveCaption, setLiveCaption] = useState('')
  const [subtitleLang, setSubtitleLang] = useState('en')
  const recognitionRef = useRef<any>(null)
  const [inattentiveUsers, setInattentiveUsers] = useState<Set<string>>(new Set())
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)
  
  // Media & Segmentation specific refs
  const rawStreamRef = useRef<MediaStream | null>(null)
  const processedStreamRef = useRef<MediaStream | null>(null)
  const processorCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const rawVideoRef = useRef<HTMLVideoElement | null>(null)
  const selfieSegmentationRef = useRef<any>(null)
  const isProcessingRef = useRef(false)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const isModelLoadingRef = useRef(false)

  // Real-time Speech Recognition & Translation
  useEffect(() => {
    if (!isCaptionsOn) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setLiveCaption('')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setLiveCaption("⚠️ Speech recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    // Let the browser auto-detect the spoken language, or enforce a specific one if required
    recognition.lang = window.navigator.language || 'en-US'

    // Mock translation function - replace with your actual API call (e.g., Google Cloud Translate)
    const translateText = async (text: string, targetLang: string) => {
      if (targetLang === 'en' || !text.trim()) return text;
      // Simulated translation delay & formatting to prove the pipeline works
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`[${targetLang.toUpperCase()}]: ${text}`), 150)
      })
    }

    recognition.onresult = async (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const textToProcess = finalTranscript || interimTranscript
      if (textToProcess) {
        try {
          // Breaks long sentences gracefully and translates
          const translated = await translateText(textToProcess, subtitleLang)
          setLiveCaption(translated)
        } catch (error) {
          setLiveCaption(`${textToProcess} (Translation unavailable)`)
        }
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setLiveCaption("[Unrecognized speech]")
      }
    }

    recognition.onend = () => {
      // Restart automatically to keep continuous listening alive
      if (isCaptionsOn && recognitionRef.current) {
        try { recognition.start() } catch (e) {}
      }
    }

    try {
      recognition.start()
      setLiveCaption("Listening...")
    } catch (e) {
      console.error("Speech recognition error:", e)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null // Prevent restart loop on unmount
        recognitionRef.current.stop()
      }
    }
  }, [isCaptionsOn, subtitleLang])

  // Simulated Live Polls
  interface Poll {
    id: string;
    question: string;
    options: { id: string; text: string; votes: number }[];
    isActive: boolean;
    votedBy: string[];
  }
  const [polls, setPolls] = useState<Poll[]>([])
  const [newPollQuestion, setNewPollQuestion] = useState('')
  const [newPollOptions, setNewPollOptions] = useState(['', ''])
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenShareStreamRef = useRef<MediaStream | null>(null)
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

  // Virtual background state: listens for selections from the VirtualBackgrounds panel
  const [virtualBg, setVirtualBg] = useState<{ id: string; blur?: number; url?: string }>({ id: 'none' })
  const virtualBgRef = useRef(virtualBg)

  const [controlsVisible, setControlsVisible] = useState(true)
  const controlHideTimer = useRef<number | null>(null)

  const selectedStudentIds = new Set(selectedStudents.map((student) => student.id))

  // Create participants including current user, selected students, and active BroadcastChannel peers
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
    ...selectedStudents.map((student, index) => {
      const active = activePeers[student.id]
      if (active) {
        return {
          id: student.id,
          name: student.name,
          email: student.email,
          isVideoOn: active.isVideoOn,
          isMuted: active.isMuted,
          isHost: false,
        }
      }
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        isVideoOn: index % 2 === 0,
        isMuted: index % 3 === 0,
        isHost: false,
      }
    }),
    ...participants.map(p => {
      const active = activePeers[p.id]
      if (active) {
        return { ...p, isVideoOn: active.isVideoOn, isMuted: active.isMuted }
      }
      return p
    }),
    // Include other active peers not in the props roster
    ...Object.values(activePeers).filter(
      p => p.id !== currentUser.id &&
           !selectedStudents.some(s => s.id === p.id) &&
           !participants.some(op => op.id === p.id)
    )
  ]

  useActiveSpeakerDetection(localStream, isMuted, allParticipants, currentUser.id)

  // MediaPipe Processing Hooks
  const onResults = useCallback((results: any) => {
    const canvas = processorCanvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the segmentation mask
    ctx.globalCompositeOperation = 'copy';
    ctx.filter = 'blur(1px)'; // Anti-alias the harsh edges of the segmentation mask
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // Draw the user over the mask
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Draw the background behind the user
    ctx.globalCompositeOperation = 'destination-over';
    const currentBg = virtualBgRef.current;

    if (currentBg.id === 'blur') {
      ctx.filter = `blur(${currentBg.blur || 10}px)`;
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    } else if (bgImageRef.current && bgImageRef.current.complete) {
      const img = bgImageRef.current;
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let sWidth = img.width;
      let sHeight = img.height;
      let sx = 0;
      let sy = 0;

      if (imgRatio > canvasRatio) {
        sWidth = sHeight * canvasRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = sWidth / canvasRatio;
        sy = (img.height - sHeight) / 2;
      }
      ctx.filter = 'none';
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1e293b'; // Fallback slate color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  }, []);

  const processVideo = useCallback(async () => {
    if (!isProcessingRef.current) return;
    const video = rawVideoRef.current;
    const segmenter = selfieSegmentationRef.current;
    
    if (video && video.readyState >= 2 && segmenter) {
      const track = rawStreamRef.current?.getVideoTracks()[0];
      if (track && track.enabled) {
        try {
          await segmenter.send({ image: video });
        } catch (err) {
          // ignore transient processing errors
        }
      } else if (processorCanvasRef.current) {
        const ctx = processorCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, processorCanvasRef.current.width, processorCanvasRef.current.height);
        }
      }
    }
    
    if (isProcessingRef.current) {
      requestAnimationFrame(processVideo);
    }
  }, []);

  const startProcessing = useCallback(async () => {
    if (!rawStreamRef.current || virtualBgRef.current.id === 'none') return;
    
    isProcessingRef.current = false; 

    if (!selfieSegmentationRef.current && !isModelLoadingRef.current) {
      isModelLoadingRef.current = true;
      try {
        selfieSegmentationRef.current = new SelfieSegmentation({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
        });
        selfieSegmentationRef.current.setOptions({
          modelSelection: 1, 
        });
      } catch (err) {
        console.error('Failed to initialize MediaPipe', err);
        setToasts(prev => [...prev, { id: `toast-${Date.now()}`, message: 'Virtual background system failed to load', type: 'error' }]);
      }
      isModelLoadingRef.current = false;
    }
    
    // Setup background image
    if (virtualBgRef.current.id !== 'blur' && virtualBgRef.current.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = virtualBgRef.current.url;
      bgImageRef.current = img;
    } else {
      bgImageRef.current = null;
    }

    if (!selfieSegmentationRef.current) return;
    
    selfieSegmentationRef.current.onResults(onResults);

    const videoTrack = rawStreamRef.current.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    const width = settings?.width || 1280;
    const height = settings?.height || 720;

    if (!processorCanvasRef.current) {
      processorCanvasRef.current = document.createElement('canvas');
    }
    processorCanvasRef.current.width = width;
    processorCanvasRef.current.height = height;

    if (!rawVideoRef.current) {
      rawVideoRef.current = document.createElement('video');
      rawVideoRef.current.autoplay = true;
      rawVideoRef.current.playsInline = true;
      rawVideoRef.current.muted = true;
    }
    rawVideoRef.current.width = width;
    rawVideoRef.current.height = height;
    
    if (rawVideoRef.current.srcObject !== rawStreamRef.current) {
      rawVideoRef.current.srcObject = rawStreamRef.current;
      await rawVideoRef.current.play().catch(() => {});
    }

    isProcessingRef.current = true;
    processVideo();

    if (!processedStreamRef.current) {
      processedStreamRef.current = processorCanvasRef.current.captureStream(30);
    }
    
    const audioTrack = rawStreamRef.current.getAudioTracks()[0];
    const outStream = new MediaStream([
      ...processedStreamRef.current.getVideoTracks(),
    ]);
    if (audioTrack) {
      outStream.addTrack(audioTrack);
    }
    
    setLocalStream(outStream);
    if (videoRef.current) {
      videoRef.current.srcObject = outStream;
    }
  }, [onResults, processVideo]);

  const stopProcessing = useCallback(() => {
    isProcessingRef.current = false;
    if (rawVideoRef.current) {
      rawVideoRef.current.pause();
    }
    if (rawStreamRef.current) {
      setLocalStream(rawStreamRef.current);
      if (videoRef.current) {
        videoRef.current.srcObject = rawStreamRef.current;
      }
    }
  }, []);

  useEffect(() => {
    virtualBgRef.current = virtualBg;
    if (virtualBg.id === 'none') {
      stopProcessing();
    } else {
      startProcessing();
    }
  }, [virtualBg, startProcessing, stopProcessing]);

  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      if (selfieSegmentationRef.current) {
        try { selfieSegmentationRef.current.close(); } catch (e) {}
      }
    }
  }, []);

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      setMediaError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      // Ensure tracks reflect current UI state
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted))
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOn))

      rawStreamRef.current = stream
      localStreamRef.current = stream
      
      if (virtualBgRef.current.id === 'none') {
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      } else {
        startProcessing()
      }
      return true
    } catch (error) {
      console.error('Failed to access media devices:', error)
      setIsVideoOn(false)

      let errorMessage = 'Unable to access camera or microphone'
      const err = error as unknown as { name?: string }
      if (err?.name) {
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
        if ((typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) || (import.meta as any).env?.MODE === 'development') {
          const fake = createDevMediaStream()
          rawStreamRef.current = fake
          localStreamRef.current = fake
          if (virtualBgRef.current.id === 'none') {
            setLocalStream(fake)
            if (videoRef.current) videoRef.current.srcObject = fake
          } else {
            startProcessing()
          }
          setToasts((prev) => [...prev, { id: `toast-${Date.now()}-${Math.random()}`, message: 'Using developer fake camera/mic for testing', type: 'info' }])
          setMediaError(null)
          return true
        }
      } catch (e) {
        console.warn('Failed to create dev media stream', e)
      }

      return false
    }
  }, [isMuted, isVideoOn, startProcessing])

  useEffect(() => {
    initializeMedia()

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [initializeMedia])

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  // Sync state with BroadcastChannel
  useEffect(() => {
    // 1. Send our initial join state to others
    sendSyncMessage('PEER_JOIN', {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      isVideoOn: isVideoOnRef.current,
      isMuted: isMutedRef.current,
      isHost: currentUser.role === 'faculty'
    })

    // 2. Listen to messages from other tabs
    const unsubscribe = registerSyncListener((type, payload) => {
      if (type === 'PEER_JOIN') {
        setActivePeers(prev => ({
          ...prev,
          [payload.id]: payload
        }))
        // Acknowledge their join and send our current info to them
        sendSyncMessage('PEER_JOIN_ACK', {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          isVideoOn: isVideoOnRef.current,
          isMuted: isMutedRef.current,
          isHost: currentUser.role === 'faculty'
        })
      } else if (type === 'PEER_JOIN_ACK') {
        setActivePeers(prev => ({
          ...prev,
          [payload.id]: payload
        }))
      } else if (type === 'PEER_UPDATE') {
        setActivePeers(prev => {
          if (!prev[payload.id]) return prev
          return {
            ...prev,
            [payload.id]: {
              ...prev[payload.id],
              isVideoOn: payload.isVideoOn,
              isMuted: payload.isMuted
            }
          }
        })
      } else if (type === 'PEER_LEAVE') {
        setActivePeers(prev => {
          const next = { ...prev }
          delete next[payload.id]
          return next
        })
      } else if (type === 'CHAT_MESSAGE') {
        setChatMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev
          return [
            ...prev,
            {
              id: payload.id,
              sender: payload.sender,
              message: payload.message,
              timestamp: new Date(payload.timestamp),
              recipient: payload.recipient,
              file: payload.file,
              isSystem: payload.isSystem
            }
          ]
        })
      } else if (type === 'POLL_CREATED') {
        setPolls(prev => {
          if (prev.some(p => p.id === payload.id)) return prev
          return [payload, ...prev]
        })
        addToast(`New poll: "${payload.question}"`, 'info')
      } else if (type === 'POLL_VOTE') {
        setPolls(prev => prev.map(p => {
          if (p.id !== payload.pollId) return p
          if (p.votedBy.includes(payload.voterId)) return p
          return {
            ...p,
            votedBy: [...p.votedBy, payload.voterId],
            options: p.options.map(o => o.id === payload.optionId ? { ...o, votes: o.votes + 1 } : o)
          }
        }))
      } else if (type === 'REACTION') {
        const reaction = {
          id: payload.id,
          emoji: payload.emoji,
          x: payload.x,
          y: payload.y,
          variant: payload.variant
        }
        setFloatingReactions(prev => [...prev, reaction])
        setTimeout(() => {
          setFloatingReactions(prev => prev.filter(item => item.id !== reaction.id))
        }, 3600)
      } else if (type === 'SPEAKING_QUEUE_JOIN') {
        setSpeakingQueue(prev => {
          if (prev.includes(payload.id)) return prev
          return [...prev, payload.id]
        })
        setChatMessages(prev => [...prev, {
          id: `queue-${Date.now()}-${Math.random()}`,
          sender: 'System',
          message: `${payload.name} requested to speak`,
          timestamp: new Date(),
          isSystem: true
        }])
      } else if (type === 'SPEAKING_QUEUE_LEAVE') {
        setSpeakingQueue(prev => prev.filter(id => id !== payload.id))
      } else if (type === 'SPEAKING_QUEUE_CLEAR') {
        setSpeakingQueue([])
      }
    })

    return () => {
      sendSyncMessage('PEER_LEAVE', { id: currentUser.id })
      unsubscribe()
    }
  }, [currentUser.id, currentUser.name, currentUser.email, currentUser.role])



  // Attention Tracking (local visibility API & simulated remote inattention)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setInattentiveUsers(prev => {
        const next = new Set(prev)
        if (document.hidden) {
          next.add(currentUser.id)
        } else {
          next.delete(currentUser.id)
        }
        return next
      })
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Simulate remote student navigating to a different tab periodically
    const interval = setInterval(() => {
      const remoteStudents = allParticipants.filter(p => !p.isHost && p.id !== currentUser.id)
      if (remoteStudents.length > 0) {
        const randomStudent = remoteStudents[Math.floor(Math.random() * remoteStudents.length)]
        setInattentiveUsers(prev => {
          const next = new Set(prev)
          next.has(randomStudent.id) ? next.delete(randomStudent.id) : next.add(randomStudent.id)
          return next
        })
      }
    }, 12000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [allParticipants, currentUser.id])



  // Mobile Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null)
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return
    const distance = touchStartX - touchEndX
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (window.innerWidth < 768) {
      if (isLeftSwipe && !showChat && !showParticipants && !showToolPanel && !showPolls && !showSpeakingQueue) {
        setShowChat(true) // Swipe left opens chat by default
      } else if (isRightSwipe) {
        setShowChat(false)
        setShowParticipants(false)
        setShowToolPanel(null)
        setShowPolls(false)
        setShowSpeakingQueue(false)
      }
    }
  }

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

    let lastCall = 0;
    const throttledReveal = () => {
      const now = Date.now();
      if (now - lastCall > 200) {
        revealControls();
        lastCall = now;
      }
    };

    revealControls()
    window.addEventListener('mousemove', throttledReveal)
    window.addEventListener('scroll', throttledReveal, { passive: true })
    window.addEventListener('touchmove', throttledReveal, { passive: true })

    return () => {
      window.removeEventListener('mousemove', throttledReveal)
      window.removeEventListener('scroll', throttledReveal)
      window.removeEventListener('touchmove', throttledReveal)
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
      sendSyncMessage('REACTION', reaction)
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((item) => item.id !== reaction.id))
      }, 3600)
    }

    window.addEventListener('reactionSent', handleReactionEvent)

    return () => {
      window.removeEventListener('reactionSent', handleReactionEvent)
    }
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
      sendSyncMessage('SPEAKING_QUEUE_JOIN', { id: currentUser.id, name: currentUser.name })
    }
  }

  const removeFromQueue = (participantId: string) => {
    setSpeakingQueue(prev => prev.filter(id => id !== participantId))
    sendSyncMessage('SPEAKING_QUEUE_LEAVE', { id: participantId })
  }

  const clearSpeakingQueue = () => {
    setSpeakingQueue([])
    sendSyncMessage('SPEAKING_QUEUE_CLEAR', {})
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

    const canvasWithCapture = canvas as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }
    const videoStream = canvasWithCapture.captureStream?.(15)
    if (!videoStream) {
      throw new Error('Canvas captureStream is not supported in this browser')
    }

    const AudioContextConstructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) {
      throw new Error('AudioContext is not supported in this browser')
    }
    const audioCtx = new AudioContextConstructor()
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
    if (rawStreamRef.current) {
      const videoTrack = rawStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        const newVideoOn = !isVideoOn
        videoTrack.enabled = newVideoOn
        setIsVideoOn(newVideoOn)
        sendSyncMessage('PEER_UPDATE', { id: currentUser.id, isVideoOn: newVideoOn, isMuted })
      }
    }
  }

  // Handle mute toggle
  const toggleMute = () => {
    if (rawStreamRef.current) {
      const audioTrack = rawStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        const newMuted = !isMuted
        audioTrack.enabled = !newMuted
        setIsMuted(newMuted)
        sendSyncMessage('PEER_UPDATE', { id: currentUser.id, isVideoOn, isMuted: newMuted })
      }
    }
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      const msgId = Date.now().toString()
      const chatMsg = {
        id: msgId,
        sender: currentUser.name,
        message: newMessage.trim(),
        timestamp: Date.now(),
        recipient: chatRecipient,
      }
      setChatMessages(prev => [
        ...prev,
        {
          id: chatMsg.id,
          sender: chatMsg.sender,
          message: chatMsg.message,
          timestamp: new Date(chatMsg.timestamp),
          recipient: chatMsg.recipient,
        },
      ])
      sendSyncMessage('CHAT_MESSAGE', chatMsg)
      setNewMessage('')
    }
  }

  const handleEndMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    onEndMeeting()
  }

  const handleCreatePoll = () => {
    if (!newPollQuestion.trim() || newPollOptions.some(o => !o.trim())) {
      addToast('Fill out all poll fields', 'error')
      return
    }
    const poll: Poll = {
      id: Date.now().toString(),
      question: newPollQuestion,
      options: newPollOptions.map((opt, i) => ({ id: `opt-${i}`, text: opt, votes: 0 })),
      isActive: true,
      votedBy: [],
    }
    setPolls(prev => [poll, ...prev])
    sendSyncMessage('POLL_CREATED', poll)
    setNewPollQuestion('')
    setNewPollOptions(['', ''])
    addToast('Poll launched!', 'success')
  }



  const iconSizeClass = accessibilityMode ? 'w-6 h-6' : compactMode ? 'w-4 h-4' : 'w-5 h-5'

  const controlBtnClass = (active: boolean, activeColor: string = 'bg-blue-500 hover:bg-blue-600') => {
    const base = "rounded-full transition-all duration-200 flex items-center justify-center border"
    const size = compactMode 
      ? "p-2.5" 
      : accessibilityMode 
        ? "p-5 scale-105 border-2 text-lg font-bold" 
        : "p-4"
    const colors = active
      ? `${activeColor} text-white border-transparent shadow-lg`
      : 'bg-slate-700/80 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white'
    return `${base} ${size} ${colors}`
  }

  return (
    <div
      className={`fixed z-[100] flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
        isPipMode
          ? 'bottom-6 right-6 w-80 h-48 rounded-2xl border border-white/20 shadow-2xl cursor-pointer bg-slate-900 hover:ring-2 hover:ring-blue-500'
          : 'inset-0 bg-[#0a0e1a]'
      }`}
      onClick={(e) => {
        if (isPipMode && onTogglePip) {
          e.stopPropagation()
          onTogglePip()
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Premium Meeting Header ── */}
      {!isPipMode && (
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950/95 backdrop-blur-md border-b border-white/6 z-30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${
              isRecording
                ? 'bg-red-500/15 border-red-500/35 text-red-300'
                : 'bg-emerald-500/12 border-emerald-500/25 text-emerald-400'
            }`}>
              <Circle className={`w-2 h-2 fill-current ${isRecording ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
              {isRecording ? 'REC' : 'Live'}
            </div>
            <div className="w-px h-5 bg-white/8 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-[320px]" title={meetingTitle}>
                  {meetingTitle}
                </h1>
                {currentUser.role === 'faculty' && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/25 flex-shrink-0">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">Host</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                <span className="font-mono">{meetingId.slice(-8).toUpperCase()}</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono tabular-nums">{formatDuration(meetingDuration)}</span>
                </div>
                <span>·</span>
                <span>{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {speakingQueue.length > 0 && currentUser.role === 'faculty' && (
              <button
                onClick={() => { setShowSpeakingQueue(!showSpeakingQueue); setShowParticipants(false); setShowChat(false); setShowPolls(false); setShowToolPanel(null) }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/12 border border-amber-400/25 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-colors animate-pulse"
              >
                <Hand className="w-3.5 h-3.5" />
                {speakingQueue.length} hand{speakingQueue.length !== 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => { setShowInviteModal(true); onInviteParticipants?.() }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/12 hover:bg-blue-500/22 border border-blue-400/25 rounded-xl text-blue-300 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isPipMode && showToolPanel === 'whiteboard' ? (
          <div className="flex-1 overflow-hidden bg-slate-900 flex flex-col">
            <Whiteboard onToast={addToast} onClose={() => toggleToolPanel('whiteboard')} />
          </div>
        ) : (
          <div className={`flex-1 relative overflow-hidden ${!isPipMode ? 'pb-[82px]' : ''}`}>
            {isScreenSharing && !isPipMode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/90 text-white text-xs font-semibold z-20 backdrop-blur-sm shadow-lg border border-blue-400/30">
                <Share2 className="w-3.5 h-3.5" />
                You are sharing your screen
              </div>
            )}
            <VideoGrid
              participants={allParticipants}
              localUserId={currentUser.id}
              localStream={localStream}
              isScreenSharing={isScreenSharing}
              isPipMode={isPipMode}
            />
            {mediaError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 z-30 backdrop-blur-sm">
                <div className="bg-slate-900/98 text-slate-100 border border-white/10 rounded-2xl p-8 max-w-md text-center shadow-2xl">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                  <p className="mb-2 font-semibold text-base">{mediaError}</p>
                  <p className="text-xs text-slate-400 mb-6">Check your browser and OS permissions for camera and microphone.</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => initializeMedia()} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">Try Again</button>
                    <button onClick={() => window.open('https://support.google.com/chrome/answer/2693767', '_blank')} className="px-5 py-2 rounded-xl bg-white/6 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">Help</button>
                  </div>
                </div>
              </div>
            )}
            {isPipMode && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl z-20">
                <Maximize className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            )}
            {isCaptionsOn && !isPipMode && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[85%] z-30 flex flex-col items-center gap-2">
                <div className="bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center text-base font-medium shadow-2xl border border-white/10 min-w-[280px] min-h-[52px] flex items-center justify-center">
                  {liveCaption || '…'}
                </div>
                <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                  <Subtitles className="w-3.5 h-3.5 text-blue-400" />
                  <select value={subtitleLang} onChange={(e) => setSubtitleLang(e.target.value)} className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer">
                    <option value="en">English</option>
                    <option value="te">Telugu</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Side Panel ── */}
        {!isPipMode && (showParticipants || showChat || showPolls || (currentUser.role === 'faculty' && showSpeakingQueue) || (showToolPanel !== null && showToolPanel !== 'whiteboard')) && (
          <div className="fixed inset-0 md:top-[57px] md:bottom-[82px] md:right-3 md:left-auto md:w-[360px] z-40 bg-slate-950/97 md:backdrop-blur-xl border border-white/8 md:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-white/8 bg-slate-900/60 px-2 flex-shrink-0">
              <div className="flex-1 flex overflow-x-auto gap-0.5 py-1" style={{ scrollbarWidth: 'none' }}>
                {showParticipants && (
                  <button onClick={() => { setShowParticipants(true); setShowChat(false); setShowPolls(false); setShowSpeakingQueue(false) }}
                    className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap text-white border-b-2 border-blue-400 bg-blue-500/10 transition-colors">
                    People ({allParticipants.length})
                  </button>
                )}
                {showChat && (
                  <button onClick={() => { setShowChat(true); setShowParticipants(false); setShowPolls(false); setShowSpeakingQueue(false) }}
                    className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap text-white border-b-2 border-emerald-400 bg-emerald-500/10 transition-colors">
                    Chat ({chatMessages.filter(m => !m.isSystem).length})
                  </button>
                )}
                {showPolls && (
                  <button onClick={() => { setShowPolls(true); setShowParticipants(false); setShowChat(false); setShowSpeakingQueue(false) }}
                    className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap text-white border-b-2 border-orange-400 bg-orange-500/10 transition-colors">
                    Polls ({polls.length})
                  </button>
                )}
                {currentUser.role === 'faculty' && speakingQueue.length > 0 && showSpeakingQueue && (
                  <button onClick={() => { setShowSpeakingQueue(true); setShowParticipants(false); setShowChat(false); setShowPolls(false) }}
                    className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap text-white border-b-2 border-amber-400 bg-amber-500/10 transition-colors">
                    Queue ({speakingQueue.length})
                  </button>
                )}
                {showToolPanel !== null && showToolPanel !== 'whiteboard' && !showParticipants && !showChat && !showPolls && (
                  <button className="px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap text-white border-b-2 border-indigo-400 bg-indigo-500/10">
                    {showToolPanel === 'breakoutRooms' ? 'Breakout Rooms' : showToolPanel === 'virtualBg' ? 'Virtual BG' : showToolPanel === 'waitingRoom' ? 'Waiting Room' : 'Recording'}
                  </button>
                )}
              </div>
              <button
                onClick={() => { setShowParticipants(false); setShowChat(false); setShowPolls(false); setShowSpeakingQueue(false); setShowToolPanel(null) }}
                className="p-1.5 ml-1 text-slate-500 hover:text-white rounded-lg hover:bg-white/8 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Speaking Queue */}
            {currentUser.role === 'faculty' && showSpeakingQueue && (
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Speaking Queue</h3>
                  <button onClick={clearSpeakingQueue} className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs font-medium transition-colors">Clear All</button>
                </div>
                {speakingQueue.length === 0 ? (
                  <div className="text-center text-slate-600 mt-8"><Hand className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No speaking requests</p></div>
                ) : (
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {speakingQueue.map((participantId, index) => {
                      const participant = allParticipants.find(p => p.id === participantId)
                      if (!participant) return null
                      return (
                        <div key={participantId} className="flex items-center justify-between p-3 rounded-xl bg-amber-500/8 border border-amber-400/20">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full flex items-center justify-center font-bold text-xs">#{index + 1}</div>
                            <div>
                              <div className="text-sm font-medium text-white">{participant.name}</div>
                              <div className="text-xs text-slate-500">Waiting to speak</div>
                            </div>
                          </div>
                          <button onClick={() => removeFromQueue(participantId)} className="px-2 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs transition-colors">Remove</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Participants */}
            {showParticipants && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <p className="text-xs text-slate-500 font-medium">In this meeting — {allParticipants.length}</p>
                  <button className="p-1 hover:bg-white/8 rounded-lg text-slate-400 hover:text-white transition-colors"><UserPlus className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                  {allParticipants.sort((a, b) => {
                    if (a.isHost && !b.isHost) return -1
                    if (!a.isHost && b.isHost) return 1
                    if (a.id === currentUser.id) return -1
                    if (b.id === currentUser.id) return 1
                    return 0
                  }).map((participant) => {
                    const queuePosition = speakingQueue.indexOf(participant.id)
                    const isInQueue = queuePosition !== -1
                    const isStudentParticipant = selectedStudentIds.has(participant.id)
                    const isMarkedAttended = attendanceMap[participant.id] || false
                    const isInattentive = inattentiveUsers.has(participant.id)
                    return (
                      <div key={participant.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer ${isInQueue ? 'bg-amber-500/8 border border-amber-400/20' : ''}`}
                        onClick={() => setPinnedParticipantId(pinnedParticipantId === participant.id ? null : participant.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">{participant.name.charAt(0).toUpperCase()}</span>
                            </div>
                            {participant.isVideoOn && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-white truncate max-w-[110px]">{participant.name}</span>
                              {participant.isHost && <span className="px-1 py-0.5 bg-emerald-500/15 text-emerald-300 text-[9px] rounded font-bold border border-emerald-400/25">Host</span>}
                              {participant.id === currentUser.id && <span className="text-xs text-slate-500">(You)</span>}
                              {isInQueue && <span className="px-1 py-0.5 bg-amber-500/15 text-amber-300 text-[9px] rounded font-bold border border-amber-400/25">#{queuePosition + 1}</span>}
                              {isInattentive && <span className="px-1 py-0.5 bg-amber-500/15 text-amber-300 text-[9px] rounded border border-amber-400/25 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" />Away</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{participant.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {participant.isMuted ? (
                            <div className="p-1 bg-red-500/15 rounded-md"><MicOff className="w-3 h-3 text-red-400" /></div>
                          ) : (
                            <div className="p-1 bg-emerald-500/15 rounded-md"><Mic className="w-3 h-3 text-emerald-400" /></div>
                          )}
                          {!participant.isVideoOn && <div className="p-1 bg-red-500/15 rounded-md"><VideoOff className="w-3 h-3 text-red-400" /></div>}
                          {currentUser.role === 'faculty' && participant.id !== currentUser.id && (
                            <div className="flex items-center gap-1">
                              {isStudentParticipant && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onToggleAttendance?.(participant.id) }}
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${isMarkedAttended ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/25' : 'bg-rose-500/15 text-rose-300 border-rose-400/25'}`}
                                >
                                  {isMarkedAttended ? '✓' : '✗'}
                                </button>
                              )}
                              <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/8 rounded-md text-slate-500 hover:text-white transition-all" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Chat */}
            {showChat && (
              <div className="flex-1 flex flex-col overflow-hidden"
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true) }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDraggingFile(false)
                  if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0]
                    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: currentUser.name, message: `Shared a file: ${file.name}`, timestamp: new Date(), recipient: chatRecipient, file: file.name }])
                    addToast(`Shared ${file.name}`, 'success')
                  }
                }}
              >
                {isDraggingFile && (
                  <div className="absolute inset-4 z-20 border-2 border-dashed border-blue-500/60 bg-slate-900/90 flex items-center justify-center rounded-2xl backdrop-blur-sm">
                    <p className="text-blue-400 font-semibold text-sm pointer-events-none">Drop file to share</p>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
                  <p className="text-xs text-slate-500 font-medium">Messages</p>
                  <select value={chatRecipient} onChange={(e) => setChatRecipient(e.target.value)} className="bg-slate-800/80 border border-white/8 text-xs text-slate-300 px-2 py-1 rounded-lg outline-none cursor-pointer">
                    <option value="everyone">Everyone</option>
                    {allParticipants.filter(p => p.id !== currentUser.id).map(p => (
                      <option key={p.id} value={p.id}>→ {p.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-600 mt-10"><MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No messages yet</p></div>
                  ) : (
                    chatMessages.filter(m => m.isSystem || !m.recipient || m.recipient === 'everyone' || m.recipient === currentUser.id || m.sender === currentUser.name).map((message) => (
                      <div key={message.id} className={`text-sm ${message.isSystem ? 'text-center' : ''}`}>
                        {message.isSystem ? (
                          <div className="text-slate-600 italic text-xs py-1">{message.message}</div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-300">{message.sender}</span>
                              {message.recipient !== 'everyone' && <span className="text-[9px] bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/20">DM</span>}
                              <span className="text-[10px] text-slate-600">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`break-words px-3 py-2 rounded-xl text-sm ${message.recipient !== 'everyone' ? 'bg-purple-900/20 text-purple-200 border border-purple-500/15' : 'bg-white/5 text-slate-300'}`}>
                              {message.file && <FileIcon className="inline w-3.5 h-3.5 mr-1.5 text-blue-400" />}
                              {message.message}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="px-3 pb-3 pt-2 flex-shrink-0">
                  <div className="flex gap-2 bg-slate-900/80 border border-white/8 rounded-xl p-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message everyone…" className="flex-1 bg-transparent px-2 py-1 text-sm text-white focus:outline-none placeholder-slate-600" />
                    <button onClick={sendMessage} disabled={!newMessage.trim()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg text-white text-xs font-semibold transition-colors">Send</button>
                  </div>
                </div>
              </div>
            )}

            {/* Polls */}
            {showPolls && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex-shrink-0"><p className="text-xs text-slate-500 font-medium">Live Polls</p></div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
                  {currentUser.role === 'faculty' && (
                    <div className="bg-white/4 border border-white/8 p-4 rounded-2xl">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Create New Poll</h4>
                      <input value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} placeholder="Ask a question…" className="w-full bg-slate-900/80 border border-white/8 rounded-xl px-3 py-2 text-sm text-white mb-2 outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600" />
                      {newPollOptions.map((opt, i) => (
                        <input key={i} value={opt} onChange={e => { const newOpts = [...newPollOptions]; newOpts[i] = e.target.value; setNewPollOptions(newOpts) }} placeholder={`Option ${i + 1}`} className="w-full bg-slate-900/80 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white mb-2 outline-none focus:border-blue-500/50 transition-colors placeholder-slate-600" />
                      ))}
                      <button onClick={() => setNewPollOptions([...newPollOptions, ''])} className="text-xs text-blue-400 hover:text-blue-300 mb-3 font-medium transition-colors block">+ Add Option</button>
                      <button onClick={handleCreatePoll} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">Launch Poll</button>
                    </div>
                  )}
                  {polls.length === 0 && currentUser.role === 'student' && (
                    <div className="text-center text-slate-600 mt-8"><BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No active polls</p></div>
                  )}
                  {polls.map((poll) => {
                    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0)
                    const hasVoted = poll.votedBy.includes(currentUser.id)
                    return (
                      <div key={poll.id} className="bg-white/4 border border-white/8 p-4 rounded-2xl">
                        <h4 className="font-semibold text-white mb-3 text-sm">{poll.question}</h4>
                        <div className="space-y-2">
                          {poll.options.map(opt => {
                            const pct = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
                            return (
                              <div key={opt.id} className="relative">
                                <button
                                  disabled={hasVoted}
                                  onClick={() => {
                                    setPolls(prev => prev.map(p => {
                                      if (p.id !== poll.id) return p
                                      return { ...p, votedBy: [...p.votedBy, currentUser.id], options: p.options.map(o => o.id === opt.id ? { ...o, votes: o.votes + 1 } : o) }
                                    }))
                                    sendSyncMessage('POLL_VOTE', { pollId: poll.id, voterId: currentUser.id, optionId: opt.id })
                                    addToast('Vote submitted', 'success')
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-xl border relative overflow-hidden transition-all text-sm ${hasVoted ? 'border-white/5 bg-slate-950/30 cursor-default' : 'border-white/8 hover:border-orange-500/40 hover:bg-white/5 bg-white/3'}`}
                                >
                                  <div className="flex justify-between relative z-10">
                                    <span className="text-slate-200">{opt.text}</span>
                                    {hasVoted && <span className="text-xs text-slate-400 font-semibold">{pct}%</span>}
                                  </div>
                                  {hasVoted && <div className="absolute inset-y-0 left-0 bg-orange-500/12 pointer-events-none transition-all duration-500" style={{ width: `${pct}%` }} />}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-600 text-right font-medium">{totalVotes} votes</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tool Panels */}
            {showToolPanel === 'breakoutRooms' && (
              <div className="flex-1 overflow-y-auto p-3"><BreakoutRooms mainParticipants={allParticipants.map(p => p.name)} onToast={addToast} /></div>
            )}
            {showToolPanel === 'virtualBg' && (
              <div className="flex-1 overflow-y-auto p-3"><VirtualBackgrounds activeBg={virtualBg} onToast={addToast} onBackgroundChange={(bg) => setVirtualBg(bg)} /></div>
            )}
            {showToolPanel === 'waitingRoom' && currentUser.role === 'faculty' && (
              <div className="flex-1 overflow-y-auto p-3"><WaitingRoom waitingParticipants={waitingParticipants} onAdmit={admitParticipant} onReject={rejectParticipant} onAdmitAll={admitAllParticipants} /></div>
            )}
            {showToolPanel === 'recording' && (
              <div className="flex-1 overflow-y-auto p-3">
                <Suspense fallback={<div className="p-4 text-slate-400 text-sm">Loading recorder…</div>}>
                  <ScreenRecording videoStream={localStream} onToast={addToast} />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Premium Control Bar ── */}
      {!isPipMode && showToolPanel !== 'whiteboard' && (
        <div
          className={`fixed left-0 right-0 bottom-0 z-50 transition-all duration-300 ease-out ${
            controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          onMouseEnter={() => setControlsVisible(true)}
          onMouseMove={() => setControlsVisible(true)}
        >
          <div className="h-10 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
          <div className="bg-slate-950/95 backdrop-blur-xl border-t border-white/6 px-4 py-3">
            <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">

              {/* Left — Core controls */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={toggleMute} className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isMuted ? 'bg-red-500/20 border-red-500/35 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 border-white/8 text-white hover:bg-slate-700'}`} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    {!isMuted && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">{isMuted ? 'Unmute' : 'Mute'}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={toggleVideo} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${!isVideoOn ? 'bg-red-500/20 border-red-500/35 text-red-400 hover:bg-red-500/30' : 'bg-slate-800 border-white/8 text-white hover:bg-slate-700'}`} title={isVideoOn ? 'Stop video' : 'Start video'}>
                    {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Camera</span>
                </div>
                <div className="w-px h-7 bg-white/8 mx-0.5" />
                <div className="flex flex-col items-center gap-1">
                  <button onClick={toggleScreenShare} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isScreenSharing ? 'bg-blue-500/20 border-blue-400/35 text-blue-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Share screen">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Share</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => { toggleToolPanel('whiteboard'); setShowSettings(false) }} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${showToolPanel === 'whiteboard' ? 'bg-indigo-500/20 border-indigo-400/35 text-indigo-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Whiteboard">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Board</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setIsCaptionsOn(!isCaptionsOn)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isCaptionsOn ? 'bg-blue-500/20 border-blue-400/35 text-blue-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Live captions">
                    <Subtitles className="w-5 h-5" />
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Caption</span>
                </div>
                {currentUser.role === 'student' && (
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={requestToSpeak} disabled={speakingQueue.includes(currentUser.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border disabled:opacity-60 ${speakingQueue.includes(currentUser.id) ? 'bg-amber-500/20 border-amber-400/35 text-amber-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Raise hand">
                      <Hand className="w-5 h-5" />
                    </button>
                    <span className="text-[9px] text-slate-600 hidden sm:block">Hand</span>
                  </div>
                )}
              </div>

              {/* Center — View Menu */}
              <div className="flex-shrink-0">
                <ViewMenu />
              </div>

              {/* Right — Panels + Leave */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); setShowPolls(false); setShowSpeakingQueue(false); setShowToolPanel(null) }} className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${showParticipants ? 'bg-blue-500/20 border-blue-400/35 text-blue-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Participants">
                    <Users className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-blue-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-slate-950 px-0.5">{allParticipants.length}</span>
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">People</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); setShowPolls(false); setShowSpeakingQueue(false); setShowToolPanel(null) }} className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${showChat ? 'bg-emerald-500/20 border-emerald-400/35 text-emerald-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Chat">
                    <MessageSquare className="w-5 h-5" />
                    {chatMessages.filter(m => !m.isSystem).length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-emerald-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-slate-950 px-0.5">{chatMessages.filter(m => !m.isSystem).length}</span>}
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Chat</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => { setShowPolls(!showPolls); setShowParticipants(false); setShowChat(false); setShowSpeakingQueue(false); setShowToolPanel(null) }} className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${showPolls ? 'bg-orange-500/20 border-orange-400/35 text-orange-300' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="Polls">
                    <BarChart2 className="w-5 h-5" />
                    {polls.filter(p => p.isActive).length > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-slate-950 px-0.5">{polls.filter(p => p.isActive).length}</span>}
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Polls</span>
                </div>
                <div className="flex flex-col items-center gap-1 relative">
                  <button onClick={() => setShowSettings(!showSettings)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 border ${showSettings ? 'bg-slate-700 border-white/15 text-white' : 'bg-slate-800 border-white/8 text-slate-300 hover:bg-slate-700 hover:text-white'}`} title="More options">
                    <Settings className="w-5 h-5" />
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">More</span>
                  {showSettings && (
                    <div className="absolute bottom-16 right-0 bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl p-2 min-w-[220px] shadow-2xl z-50">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Activities</div>
                      {[
                        { label: 'Whiteboard', icon: Pencil, panel: 'whiteboard' },
                        { label: 'Breakout Rooms', icon: LayoutGrid, panel: 'breakoutRooms' },
                        { label: 'Virtual Backgrounds', icon: Layers, panel: 'virtualBg' },
                        ...(currentUser.role === 'faculty' ? [{ label: 'Waiting Room', icon: Bell, panel: 'waitingRoom' }] : []),
                      ].map(({ label, icon: Icon, panel }) => (
                        <button key={panel} onClick={() => { toggleToolPanel(panel); setShowSettings(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${showToolPanel === panel ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white hover:bg-white/6'}`}>
                          <Icon className="w-4 h-4" /><span>{label}</span>
                        </button>
                      ))}
                      <button onClick={() => { handleRecordingClick(); setShowSettings(false) }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isRecording ? 'text-red-300 bg-red-500/12' : 'text-slate-300 hover:text-white hover:bg-white/6'}`}>
                        <Circle className={`w-4 h-4 ${isRecording ? 'text-red-400 animate-pulse' : ''}`} /><span>{isRecording ? 'Stop Recording' : 'Record Session'}</span>
                      </button>
                      <div className="my-1.5 border-t border-white/8" />
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Options</div>
                      <button onClick={() => { setIsFullscreen(!isFullscreen); setShowSettings(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}<span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                        <Camera className="w-4 h-4" /><span>Camera settings</span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-colors">
                        <Mic className="w-4 h-4" /><span>Audio settings</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-px h-7 bg-white/8 mx-0.5" />
                <div className="flex flex-col items-center gap-1">
                  <button onClick={handleEndMeeting} className="h-11 px-4 rounded-2xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-600/25 flex items-center gap-2" title="Leave meeting">
                    <PhoneOff className="w-4 h-4" /><span className="hidden sm:inline">Leave</span>
                  </button>
                  <span className="text-[9px] text-slate-600 hidden sm:block">Leave</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {!isPipMode && (
        <div className="fixed bottom-24 right-5 z-50 space-y-2 pointer-events-none">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} />
          ))}
        </div>
      )}

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
