import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, MessageSquare,
  Settings, Share2, Circle, MoreVertical, Maximize, Minimize,
  UserPlus, Shield, Hand, Clock, Pencil, Film, Layers,
  LayoutGrid, Bell, X, Lock, Unlock, Info, UserX, FolderOpen
} from 'lucide-react'
import Whiteboard from '../features/meeting/Whiteboard'
import BreakoutRooms from '../features/meeting/BreakoutRooms'
import VirtualBackgrounds from '../features/meeting/VirtualBackgrounds'
import Toast from '../components/ui/Toast'
import FloatingReactions from '../features/meeting/FloatingReactions'
import MeetingInvite from '../features/meeting/MeetingInvite'
import WaitingRoom, { type WaitingParticipant } from '../features/meeting/WaitingRoom'
import AgoraVideoTile from '../components/ui/AgoraVideoTile'
import ScreenRecording from '../features/meeting/ScreenRecording'
import FileSharing, { type SharedFile } from '../features/meeting/FileSharing'
import {
  joinChannel,
  leaveChannel,
  getAgoraClient,
  APP_ID,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type RemoteParticipant,
} from '../services/video'
import {
  sendChatMessage,
  subscribeToChatMessages,
  recordStudentJoin,
  recordStudentLeave,
  subscribeToSharedFiles,
  addSharedFile,
  deleteSharedFile,
  uploadFileToStorage,
} from '../services/db'

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
  meetingSessionId?: string
  meetingStartedAt?: Date | null
  meetingTitle: string
  selectedStudents: SelectedStudent[]
  attendanceMap?: Record<string, boolean>
  currentUser: {
    id: string
    name: string
    email: string
    role: 'faculty' | 'student'
  }
  onEndMeeting: () => void
  onToggleAttendance?: (studentId: string) => void
}

export default function MeetingRoom({
  meetingId,
  meetingSessionId = '',
  meetingStartedAt = null,
  meetingTitle,
  selectedStudents = [],
  attendanceMap = {},
  currentUser,
  onEndMeeting,
  onToggleAttendance,
}: MeetingRoomProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  // Drawer & Panel state
  const [activeDrawer, setActiveDrawer] = useState<'chat' | 'participants' | 'virtualBg' | 'breakoutRooms' | 'waitingRoom' | 'settings' | 'speakingQueue' | 'files' | null>(null)
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Agora tracks
  const [agoraVideoTrack, setAgoraVideoTrack] = useState<ICameraVideoTrack | null>(null)
  const [agoraAudioTrack, setAgoraAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const agoraVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const agoraAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)

  // Device lists & selection
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideoId, setSelectedVideoId] = useState<string>('')
  const [selectedAudioId, setSelectedAudioId] = useState<string>('')

  // Shared Files state
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])

  // Load devices and listen for changes
  useEffect(() => {
    async function getDevices() {
      try {
        const list = await navigator.mediaDevices.enumerateDevices()
        const video = list.filter(d => d.kind === 'videoinput')
        const audio = list.filter(d => d.kind === 'audioinput')
        setVideoDevices(video)
        setAudioDevices(audio)
        if (video.length > 0 && !selectedVideoId) setSelectedVideoId(video[0].deviceId)
        if (audio.length > 0 && !selectedAudioId) setSelectedAudioId(audio[0].deviceId)
      } catch (err) {
        console.error('Failed to list media devices:', err)
      }
    }
    getDevices()
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices)
  }, [activeDrawer])

  // Subscribe to files shared in this meeting
  useEffect(() => {
    if (!meetingId) return
    const unsubscribe = subscribeToSharedFiles(meetingId, (files) => {
      setSharedFiles(files)
    })
    return () => unsubscribe()
  }, [meetingId])

  const changeVideoDevice = async (deviceId: string) => {
    setSelectedVideoId(deviceId)
    if (agoraVideoTrack) {
      try {
        await agoraVideoTrack.setDevice(deviceId)
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts((prev) => [...prev, { id, message: 'Camera switched successfully', type: 'success' }])
      } catch (err) {
        console.error('Failed to change camera device:', err)
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts((prev) => [...prev, { id, message: 'Failed to switch camera', type: 'error' }])
      }
    }
  }

  const changeAudioDevice = async (deviceId: string) => {
    setSelectedAudioId(deviceId)
    if (agoraAudioTrack) {
      try {
        await agoraAudioTrack.setDevice(deviceId)
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts((prev) => [...prev, { id, message: 'Microphone switched successfully', type: 'success' }])
      } catch (err) {
        console.error('Failed to change microphone device:', err)
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts((prev) => [...prev, { id, message: 'Failed to switch microphone', type: 'error' }])
      }
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message: 'Uploading file...', type: 'info' }])

      const result = await uploadFileToStorage(file, `shared-files/${meetingId}`)
      await addSharedFile(meetingId, {
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url,
        uploadedBy: currentUser.name,
      })
    } catch (err) {
      console.error('File upload failed:', err)
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message: 'Failed to upload file', type: 'error' }])
    }
  }

  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteSharedFile(meetingId, fileId)
    } catch (err) {
      console.error('File delete failed:', err)
    }
  }

  // Sync refs with state so the cleanup function can access the latest tracks without being re-triggered
  useEffect(() => { agoraVideoTrackRef.current = agoraVideoTrack }, [agoraVideoTrack])
  useEffect(() => { agoraAudioTrackRef.current = agoraAudioTrack }, [agoraAudioTrack])

  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([])

  const [meetingDuration, setMeetingDuration] = useState(0)
  const [speakingQueue, setSpeakingQueue] = useState<string[]>([])
  const [fullscreenParticipant, setFullscreenParticipant] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    sender: string
    message: string
    timestamp: Date
    isSystem?: boolean
  }>>([])
  const [newMessage, setNewMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const screenShareStreamRef = useRef<MediaStream | null>(null)
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const stopProcessingRef = useRef<(() => void) | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>>([])

  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string; emoji: string; x: number; y: number; variant?: 'burst' | 'spiral' | 'float' | 'bounce'
  }>>([])

  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([])

  const [virtualBg, setVirtualBg] = useState<{ id: string; blur?: number; url?: string }>({ id: 'none' })
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlHideTimer = useRef<number | null>(null)

  // Real-time chat subscription
  useEffect(() => {
    if (!meetingId) return
    const unsubscribe = subscribeToChatMessages(meetingId, (messages) => {
      const formatted = messages.map((msg) => ({
        id: msg.id,
        sender: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        isSystem: msg.senderName === 'System',
      }))
      setChatMessages(formatted)
    })
    return () => unsubscribe()
  }, [meetingId])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted))
      stream.getVideoTracks().forEach((t) => (t.enabled = isVideoOn))

      localStreamRef.current = stream
      setLocalStream(stream)
      if (videoRef.current) videoRef.current.srcObject = stream
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

      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts((prev) => [...prev, { id, message: errorMessage, type: 'error' }])
      // Do not fall back to dev/mock media streams — require real devices for realtime meetings
      return false
    }
  }, [isMuted, isVideoOn])

  useEffect(() => {
    initializeMedia()
    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
  }, [initializeMedia])

  // Agora Join/Leave Channel
  useEffect(() => {
    if (!APP_ID) return

    let cancelled = false
    const agoraClient = getAgoraClient()

    const onUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      await agoraClient.subscribe(user, mediaType)
      if (cancelled) return
      setRemoteParticipants((prev) => {
        const existing = prev.find((p) => p.uid === user.uid)
        if (existing) {
          return prev.map((p) =>
            p.uid === user.uid
              ? {
                ...p,
                videoTrack: mediaType === 'video' ? user.videoTrack : p.videoTrack,
                audioTrack: mediaType === 'audio' ? user.audioTrack : p.audioTrack,
              }
              : p,
          )
        }
        return [
          ...prev,
          {
            uid: user.uid,
            videoTrack: mediaType === 'video' ? user.videoTrack : undefined,
            audioTrack: mediaType === 'audio' ? user.audioTrack : undefined,
          },
        ]
      })
      if (mediaType === 'audio') user.audioTrack?.play()
    }

    const onUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
      if (cancelled) return
      setRemoteParticipants((prev) =>
        prev.map((p) =>
          p.uid === user.uid
            ? {
              ...p,
              videoTrack: mediaType === 'video' ? undefined : p.videoTrack,
              audioTrack: mediaType === 'audio' ? undefined : p.audioTrack,
            }
            : p,
        ),
      )
    }

    const onUserLeft = (user: any) => {
      if (cancelled) return
      setRemoteParticipants((prev) => prev.filter((p) => p.uid !== user.uid))
      const found = selectedStudents.find(s => s.id === String(user.uid))
      addToast(`${found ? found.name : `User ${user.uid}`} left the meeting`, 'info')
    }

    agoraClient.on('user-published', onUserPublished)
    agoraClient.on('user-unpublished', onUserUnpublished)
    agoraClient.on('user-left', onUserLeft)

    joinChannel(meetingId, currentUser.id)
      .then(({ localVideoTrack, localAudioTrack }) => {
        if (cancelled) return
        if (localVideoTrack) setAgoraVideoTrack(localVideoTrack)
        if (localAudioTrack) setAgoraAudioTrack(localAudioTrack)
        addToast('Connected to video session', 'success')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[Agora] Failed to join channel:', err)
        const msg = err instanceof Error ? err.message : String(err)
        addToast(`Video server: ${msg || 'Connection failed — check your internet or camera permissions.'}`, 'error')
      })

    return () => {
      cancelled = true
      agoraClient.off('user-published', onUserPublished)
      agoraClient.off('user-unpublished', onUserUnpublished)
      agoraClient.off('user-left', onUserLeft)
      leaveChannel(agoraVideoTrackRef.current, agoraAudioTrackRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, currentUser.id])

  const studentJoinTimesRef = useRef<Record<string, number>>({})

  // Faculty Attendance Tracker
  useEffect(() => {
    if (currentUser.role !== 'faculty' || !meetingSessionId) return;

    remoteParticipants.forEach((p) => {
      const uidStr = String(p.uid);
      if (!studentJoinTimesRef.current[uidStr]) {
        studentJoinTimesRef.current[uidStr] = Date.now();
        recordStudentJoin(meetingSessionId, uidStr, meetingStartedAt || new Date()).catch((err) => {
          console.error('[Faculty Tracker] Failed to record student join:', err);
        });
      }
    });

    // Clean up any student who is no longer in remoteParticipants
    Object.keys(studentJoinTimesRef.current).forEach((uidStr) => {
      const isStillPresent = remoteParticipants.some((p) => String(p.uid) === uidStr);
      if (!isStillPresent) {
        const jt = studentJoinTimesRef.current[uidStr];
        if (jt) {
          const durSec = Math.round((Date.now() - jt) / 1000);
          recordStudentLeave(meetingSessionId, uidStr, durSec).catch((err) => {
            console.error('[Faculty Tracker] Failed to record student leave:', err);
          });
        }
        delete studentJoinTimesRef.current[uidStr];
      }
    });
  }, [remoteParticipants, currentUser.role, meetingSessionId, meetingStartedAt]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Reveal/Hide Controls
  useEffect(() => {
    const scheduleHide = () => {
      if (controlHideTimer.current) window.clearTimeout(controlHideTimer.current)
      controlHideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000)
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

  // Listeners for reactions & background pipeline
  useEffect(() => {
    const handleReactionEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{
        id?: string; emoji: string; x?: number; y?: number; variant?: 'burst' | 'spiral' | 'float' | 'bounce'
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

    const handleBg = (e: Event) => {
      const ev = e as CustomEvent<{ id: string; blur?: number; url?: string }>
      setVirtualBg({ id: ev.detail?.id || 'none', blur: ev.detail?.blur, url: ev.detail?.url })
    }

    window.addEventListener('vc:bg-changed', handleBg)

    return () => {
      window.removeEventListener('reactionSent', handleReactionEvent)
      window.removeEventListener('vc:bg-changed', handleBg)
    }
  }, [])

  // Virtual background pipeline
  useEffect(() => {
    import('../services/videoProcessor').then(({ setBackgroundConfig, startStreamProcessing }) => {
      setBackgroundConfig(virtualBg.id, virtualBg.blur ?? 10, virtualBg.url || null)

      if (!agoraVideoTrack) return

      if (stopProcessingRef.current) {
        stopProcessingRef.current()
        stopProcessingRef.current = null
      }

      if (!processingCanvasRef.current) {
        processingCanvasRef.current = document.createElement('canvas')
      }

      const rawStream = localStreamRef.current
      if (!rawStream) return

      const stop = startStreamProcessing(rawStream, processingCanvasRef.current, (processedTrack) => {
        agoraVideoTrack.replaceTrack(processedTrack, true).catch(err => {
          console.error("Failed to replace Agora video track:", err)
        })
      })

      stopProcessingRef.current = stop
    })

    return () => {
      if (stopProcessingRef.current) {
        stopProcessingRef.current()
        stopProcessingRef.current = null
      }
    }
  }, [virtualBg, agoraVideoTrack])

  // Format Duration helper
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hrs > 0
      ? `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Request to speak
  const requestToSpeak = () => {
    if (speakingQueue.includes(currentUser.id)) return
    setSpeakingQueue(prev => [...prev, currentUser.id])
    addToast('You requested to speak', 'info')
    sendChatMessage(meetingId, {
      senderId: 'System',
      senderName: 'System',
      senderRole: 'faculty',
      message: `${currentUser.name} raised their hand to speak`,
    }).catch(e => console.error(e))
  }

  const removeFromQueue = (participantId: string) => {
    setSpeakingQueue(prev => prev.filter(id => id !== participantId))
  }

  const clearSpeakingQueue = () => {
    setSpeakingQueue([])
  }

  // Removed dev/mock media fallback to ensure real device access for realtime meetings

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
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

  const toggleVideo = () => {
    const newVideoOn = !isVideoOn
    setIsVideoOn(newVideoOn)
    if (agoraVideoTrack) {
      agoraVideoTrack.setEnabled(newVideoOn)
    } else if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) videoTrack.enabled = newVideoOn
    }
  }

  const toggleMute = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    if (agoraAudioTrack) {
      agoraAudioTrack.setEnabled(!newMuted)
    } else if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = !newMuted
    }
  }

  const handleEndMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    onEndMeeting()
  }

  // Only show participants who are ACTUALLY connected via Agora (real-time only)
  // — no placeholder/ghost tiles for students who haven't joined yet
  const selectedStudentIds = new Set(selectedStudents.map((student) => student.id))

  const allParticipants: MeetingParticipant[] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      isVideoOn: isVideoOn,
      isMuted: isMuted,
      isHost: currentUser.role === 'faculty',
      stream: agoraVideoTrack ? undefined : localStream || undefined,
    },
    ...remoteParticipants.map((remote) => {
      const match = selectedStudents.find((s) => s.id === String(remote.uid))
      return {
        id: String(remote.uid),
        name: match?.name ?? `User ${String(remote.uid).slice(-6)}`,
        email: match?.email ?? '',
        isVideoOn: !!remote.videoTrack,
        isMuted: !remote.audioTrack,
        isHost: false,
      }
    }),
  ]

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const text = newMessage.trim()
      setNewMessage('')
      try {
        await sendChatMessage(meetingId, {
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          message: text,
        })
      } catch (err) {
        console.error("Failed to send chat message", err)
      }
    }
  }

  const handleToggleLock = () => {
    const nextLockState = !isLocked
    setIsLocked(nextLockState)
    addToast(nextLockState ? 'Meeting locked. New students cannot enter.' : 'Meeting unlocked.', 'info')
  }

  const exportAttendance = () => {
    const reportText = [
      `Attendance Log: ${meetingTitle}`,
      `Meeting ID: ${meetingId}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '---------------------------------------',
      ...allParticipants.map((p) => {
        const present = attendanceMap[p.id] || p.id === currentUser.id
        return `${p.name} (${p.email}) - ${present ? 'Present' : 'Absent'}`
      })
    ].join('\n')

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${meetingTitle.replace(/\s+/g, '_')}_attendance.txt`
    link.click()
    URL.revokeObjectURL(url)
    addToast('Attendance exported successfully', 'success')
  }

  const toggleRecording = () => {
    const nextRec = !isRecording
    setIsRecording(nextRec)
    addToast(nextRec ? 'Recording started' : 'Recording stopped', nextRec ? 'success' : 'info')
    sendChatMessage(meetingId, {
      senderId: 'System',
      senderName: 'System',
      senderRole: 'faculty',
      message: nextRec ? 'Meeting recording started' : 'Meeting recording stopped',
    }).catch(e => console.error(e))
  }

  const admitParticipant = (id: string) => {
    setWaitingParticipants(prev => prev.filter(p => p.id !== id))
    addToast('Participant admitted to meeting', 'success')
  }

  const rejectParticipant = (id: string) => {
    setWaitingParticipants(prev => prev.filter(p => p.id !== id))
    addToast('Participant admission declined', 'warning')
  }

  const admitAllParticipants = () => {
    setWaitingParticipants([])
    addToast('All waiting participants admitted', 'success')
  }

  const handleCopyInviteLink = () => {
    const text = `Join Meeting: ${meetingTitle}\nLink: ${window.location.origin}/student/join-meeting\nCode: ${meetingId}`
    navigator.clipboard.writeText(text).then(() => {
      addToast('Invitation details copied to clipboard', 'success')
    }).catch(() => {
      addToast('Failed to copy invitation details', 'error')
    })
  }

  // Layout calculations
  const isSharingOrWhiteboardActive = isScreenSharing || showWhiteboard

  const getGridColsClass = (count: number) => {
    if (count <= 1) return 'grid-cols-1'
    if (count <= 4) return 'grid-cols-2'
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3'
    return 'grid-cols-3 md:grid-cols-4'
  }

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-200 z-50 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. minimal top bar */}
      <header className="flex items-center justify-between px-6 py-3.5 bg-slate-900/30 border-b border-white/5 backdrop-blur-md z-20 flex-shrink-0">
        {/* Left Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-xs">{meetingTitle}</span>
            {currentUser.role === 'faculty' && (
              <span className="px-2 py-0.5 text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold uppercase rounded-md flex items-center gap-1">
                <Shield className="w-3 h-3" /> Host
              </span>
            )}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDuration(meetingDuration)}</span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded text-[10px] text-red-400 font-bold uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 fill-current" />
              Rec
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-5 text-sm">
          {/* Connection */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Excellent Connection</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-white/10" />

          {/* Code */}
          <span
            onClick={handleCopyInviteLink}
            className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer transition-colors border border-white/5 bg-slate-900/50 px-2.5 py-1 rounded-md"
            title="Click to copy details"
          >
            {meetingId.slice(0, 3)}-{meetingId.slice(3, 7)}-{meetingId.slice(7, 10)}
          </span>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-slate-800/40 px-2.5 py-1 rounded-md">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{allParticipants.length}</span>
          </div>
        </div>
      </header>

      {/* 2. Main content block */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main interactive stage */}
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative min-w-0">

          {/* Main Visual element */}
          <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-slate-900/20 rounded-2xl border border-white/5">
            {showWhiteboard ? (
              <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900 rounded-2xl relative p-2">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                  <button
                    onClick={() => setShowWhiteboard(false)}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                    title="Close Whiteboard"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Whiteboard onToast={addToast} meetingId={meetingId} currentUser={currentUser} />
              </div>
            ) : isScreenSharing ? (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden border border-white/10">
                <video
                  ref={(el) => {
                    if (el && screenShareStreamRef.current) {
                      el.srcObject = screenShareStreamRef.current
                      el.play().catch(err => console.error(err))
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
                  You are sharing your screen
                </div>
              </div>
            ) : (
              // Normal Fullscreen Participant Grid
              <div className={`w-full h-full grid gap-4 p-2 items-center justify-center overflow-y-auto ${fullscreenParticipant ? 'grid-cols-1' : getGridColsClass(allParticipants.length)
                }`}>
                {(fullscreenParticipant ? allParticipants.filter(p => p.id === fullscreenParticipant) : allParticipants).map((participant) => {
                  const queuePosition = speakingQueue.indexOf(participant.id)
                  const isInQueue = queuePosition !== -1
                  const isSpeaking = !participant.isMuted && isInQueue

                  return (
                    <div
                      key={participant.id}
                      onClick={() => !fullscreenParticipant && setFullscreenParticipant(participant.id)}
                      className={`relative rounded-2xl overflow-hidden bg-slate-900 aspect-video w-full h-full flex items-center justify-center border border-white/5 transition-all duration-300 ${fullscreenParticipant ? 'max-w-4xl mx-auto shadow-2xl' : 'hover:scale-[1.01]'
                        } ${isSpeaking ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10' : ''
                        } ${isInQueue ? 'ring-2 ring-yellow-400' : ''
                        }`}
                    >
                      {participant.isVideoOn ? (
                        <div className="w-full h-full relative">
                          {participant.id === currentUser.id ? (
                            <div className="w-full h-full relative">
                              {virtualBg.id && virtualBg.id !== 'none' && virtualBg.id !== 'blur' && (
                                <div
                                  className="absolute inset-0 bg-cover bg-center"
                                  style={{
                                    backgroundImage: virtualBg.id === 'custom' ? `url(${virtualBg.url})` : undefined,
                                    background: virtualBg.id !== 'custom' ? (
                                      virtualBg.id === 'office' ? 'linear-gradient(135deg,#0f172a 0%,#0b1220 100%)' :
                                        virtualBg.id === 'nature' ? 'linear-gradient(135deg,#065f46 0%,#0b3b6b 100%)' :
                                          virtualBg.id === 'abstract' ? 'linear-gradient(135deg,#6d28d9 0%,#be185d 100%)' :
                                            virtualBg.id === 'space' ? 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)' :
                                              undefined
                                    ) : undefined,
                                  }}
                                />
                              )}
                              <AgoraVideoTile
                                localVideoTrack={agoraVideoTrack ?? undefined}
                                fallbackStream={!agoraVideoTrack ? (participant.stream ?? null) : null}
                                className={`scale-x-[-1] relative z-10 ${virtualBg.id === 'blur' ? `blur-[${virtualBg.blur ?? 8}px]` : ''}`}
                              />
                            </div>
                          ) : (
                            (() => {
                              const remote = remoteParticipants.find((r) => String(r.uid) === participant.id)
                              return remote?.videoTrack ? (
                                <AgoraVideoTile remoteVideoTrack={remote.videoTrack} />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-2xl text-slate-300">
                                    {participant.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                              )
                            })()
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-900/60 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-2xl text-slate-300">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Header overlay info */}
                      {fullscreenParticipant && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setFullscreenParticipant(null)
                          }}
                          className="absolute top-4 right-4 p-2 bg-black/60 rounded-lg hover:bg-black/80 text-white z-10 transition-colors"
                          title="Restore Grid"
                        >
                          <Minimize className="w-4 h-4" />
                        </button>
                      )}

                      {/* Name tag and state indicators */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                        <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-semibold text-white tracking-wide border border-white/5">
                          {participant.name}
                          {participant.isHost && ' (Host)'}
                          {participant.id === currentUser.id && ' (You)'}
                        </span>

                        <div className="flex gap-1.5">
                          {isInQueue && (
                            <span className="p-1 rounded-full bg-yellow-500 text-black shadow-lg" title="Speaking queue">
                              <Hand className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {!participant.isMuted ? (
                            <span className="p-1 rounded-full bg-emerald-500 text-white shadow-lg">
                              <Mic className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-full bg-red-500/80 text-white shadow-lg">
                              <MicOff className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 3. Participant strip (Vertical/Horizontal sidebar if Whiteboard/Sharing is active) */}
          {isSharingOrWhiteboardActive && (
            <div className="w-full md:w-64 flex flex-row md:flex-col gap-3 p-1 overflow-x-auto md:overflow-y-auto md:max-h-[calc(100vh-160px)] flex-shrink-0">
              {allParticipants.map((p) => {
                const queuePosition = speakingQueue.indexOf(p.id)
                const isInQueue = queuePosition !== -1
                return (
                  <div
                    key={p.id}
                    className={`relative rounded-xl overflow-hidden aspect-video bg-slate-900 border border-white/5 w-28 md:w-full flex-shrink-0 flex items-center justify-center ${isInQueue ? 'ring-2 ring-yellow-400' : ''
                      }`}
                  >
                    {p.isVideoOn ? (
                      <div className="w-full h-full relative">
                        {p.id === currentUser.id ? (
                          <AgoraVideoTile
                            localVideoTrack={agoraVideoTrack ?? undefined}
                            fallbackStream={!agoraVideoTrack ? (p.stream ?? null) : null}
                            className="scale-x-[-1]"
                          />
                        ) : (
                          (() => {
                            const r = remoteParticipants.find(rm => String(rm.uid) === p.id)
                            return r?.videoTrack ? (
                              <AgoraVideoTile remoteVideoTrack={r.videoTrack} />
                            ) : (
                              <div className="w-full h-full bg-slate-950 flex items-center justify-center font-bold text-xs">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                            )
                          })()
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex items-center justify-center font-bold text-xs text-slate-400">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[10px] text-white truncate max-w-[80px]">
                      {p.name}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 4. Slide-in right-side drawers */}
        <AnimatePresence>
          {activeDrawer && (
            <motion.div
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-80 md:w-96 bg-slate-900 border-l border-white/10 flex flex-col h-full z-10 flex-shrink-0"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-bold text-white text-base capitalize flex items-center gap-2">
                  {activeDrawer === 'chat' && <><MessageSquare className="w-5 h-5 text-cyan-400" /> Chat Messages</>}
                  {activeDrawer === 'participants' && <><Users className="w-5 h-5 text-blue-400" /> Participants ({allParticipants.length})</>}
                  {activeDrawer === 'virtualBg' && <><Layers className="w-5 h-5 text-purple-400" /> Virtual Background</>}
                  {activeDrawer === 'breakoutRooms' && <><LayoutGrid className="w-5 h-5 text-orange-400" /> Breakout Rooms</>}
                  {activeDrawer === 'waitingRoom' && <><Bell className="w-5 h-5 text-amber-400" /> Waiting Room ({waitingParticipants.length})</>}
                  {activeDrawer === 'speakingQueue' && <><Hand className="w-5 h-5 text-yellow-400" /> Speaking Queue ({speakingQueue.length})</>}
                  {activeDrawer === 'settings' && <><Settings className="w-5 h-5 text-slate-400" /> Device Settings</>}
                </h3>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Contents */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {activeDrawer === 'chat' && (
                  <div className="h-full flex flex-col p-4">
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 text-sm">
                          No messages yet.
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div key={msg.id} className={`text-sm ${msg.isSystem ? 'text-center' : ''}`}>
                            {msg.isSystem ? (
                              <div className="text-slate-500 italic px-2 py-1 bg-slate-800/40 rounded-lg text-xs">
                                {msg.message}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span className="font-semibold text-slate-300">{msg.sender}</span>
                                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-slate-300 bg-slate-800/30 p-2 rounded-lg break-words">
                                  {msg.message}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/5 flex-shrink-0">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type message to everyone..."
                        className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-sm transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}

                {activeDrawer === 'participants' && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      <span>Roster</span>
                      {currentUser.role === 'faculty' && (
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {allParticipants.map((p) => {
                        const isStudentParticipant = selectedStudentIds.has(p.id)
                        const isMarkedAttended = attendanceMap[p.id] || p.id === currentUser.id
                        const queuePosition = speakingQueue.indexOf(p.id)
                        const isInQueue = queuePosition !== -1

                        return (
                          <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/20 border border-white/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                                  {p.name}
                                  {p.isHost && <span className="text-[9px] bg-cyan-500/10 px-1 border border-cyan-500/20 text-cyan-400 rounded">Host</span>}
                                </div>
                                <span className="text-[10px] text-slate-500 truncate block">{p.email || 'Student Role'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isInQueue && (
                                <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Speak</span>
                              )}

                              {/* Audio/Video icons */}
                              <span className="text-slate-400">
                                {p.isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                              </span>

                              {/* Faculty controls */}
                              {currentUser.role === 'faculty' && p.id !== currentUser.id && (
                                <div className="flex items-center gap-1">
                                  {isStudentParticipant && (
                                    <button
                                      onClick={() => onToggleAttendance?.(p.id)}
                                      className={`text-[9px] font-bold border rounded px-1.5 py-0.5 transition-all ${isMarkedAttended
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                                        : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                                        }`}
                                    >
                                      {isMarkedAttended ? 'Present' : 'Absent'}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      removeFromQueue(p.id)
                                      setRemoteParticipants(prev => prev.filter(remote => String(remote.uid) !== p.id))
                                      addToast(`${p.name} removed from meeting`, 'warning')
                                    }}
                                    className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                                    title="Remove Participant"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
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

                {activeDrawer === 'virtualBg' && (
                  <div className="p-3">
                    <VirtualBackgrounds videoRef={videoRef} onToast={addToast} />
                  </div>
                )}

                {activeDrawer === 'breakoutRooms' && (
                  <div className="p-3">
                    <BreakoutRooms
                      mainParticipants={allParticipants.map(p => p.name)}
                      onToast={addToast}
                    />
                  </div>
                )}

                {activeDrawer === 'waitingRoom' && (
                  <div className="p-3">
                    <WaitingRoom
                      waitingParticipants={waitingParticipants}
                      onAdmit={admitParticipant}
                      onReject={rejectParticipant}
                      onAdmitAll={admitAllParticipants}
                    />
                  </div>
                )}

                {activeDrawer === 'speakingQueue' && (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active speaking queue</span>
                      {speakingQueue.length > 0 && (
                        <button
                          onClick={clearSpeakingQueue}
                          className="text-xs text-red-400 hover:text-red-300 font-bold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {speakingQueue.length === 0 ? (
                      <div className="text-center text-slate-500 text-sm py-12">No requests to speak</div>
                    ) : (
                      <div className="space-y-2">
                        {speakingQueue.map((id, index) => {
                          const p = allParticipants.find(part => part.id === id)
                          if (!p) return null
                          return (
                            <div key={id} className="flex items-center justify-between p-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 bg-yellow-500 text-black rounded-full flex items-center justify-center font-bold text-[10px]">
                                  #{index + 1}
                                </span>
                                <span className="text-xs text-white font-medium">{p.name}</span>
                              </div>
                              <button
                                onClick={() => removeFromQueue(id)}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded border border-white/10"
                              >
                                Dismiss
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeDrawer === 'settings' && (
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">Microphone Input</label>
                        <select
                          value={selectedAudioId}
                          onChange={(e) => changeAudioDevice(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                        >
                          {audioDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>
                          ))}
                          {audioDevices.length === 0 && <option>No microphone found</option>}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 font-medium mb-1.5">Camera Source</label>
                        <select
                          value={selectedVideoId}
                          onChange={(e) => changeVideoDevice(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
                        >
                          {videoDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                          ))}
                          {videoDevices.length === 0 && <option>No camera found</option>}
                        </select>
                      </div>
                    </div>

                    {/* Local screen recorder */}
                    {currentUser.role === 'faculty' && (
                      <div className="border-t border-white/5 pt-4">
                        <ScreenRecording
                          videoStream={localStream}
                          onToast={addToast}
                          classId={meetingId}
                          meetingId={meetingSessionId || meetingId}
                          facultyId={currentUser.id}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeDrawer === 'files' && (
                  <div className="p-3">
                    <FileSharing
                      files={sharedFiles}
                      onUpload={handleFileUpload}
                      onDelete={handleFileDelete}
                      onToast={addToast}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Centered bottom control bar */}
      <footer
        className={`px-6 py-4 flex items-center justify-center transition-all duration-300 bg-slate-900/40 border-t border-white/5 backdrop-blur-md z-20 flex-shrink-0 ${controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        onMouseEnter={() => setControlsVisible(true)}
      >
        <div className="flex items-center gap-3">
          {/* Audio toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className={`p-3.5 rounded-full border transition-all ${isMuted
              ? 'bg-red-500 hover:bg-red-600 text-white border-red-400/20 shadow-lg shadow-red-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
              }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* Video toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVideo}
            className={`p-3.5 rounded-full border transition-all ${!isVideoOn
              ? 'bg-red-500 hover:bg-red-600 text-white border-red-400/20 shadow-lg shadow-red-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
              }`}
            title={isVideoOn ? 'Stop video' : 'Start video'}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          {/* Screen Share toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full border transition-all ${isScreenSharing
              ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400/20 shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
              }`}
            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          >
            <Share2 className="w-5 h-5" />
          </motion.button>

          {/* Hand Raise / speaking queue button */}
          {currentUser.role === 'student' ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={requestToSpeak}
              disabled={speakingQueue.includes(currentUser.id)}
              className={`p-3.5 rounded-full border transition-all ${speakingQueue.includes(currentUser.id)
                ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 border-yellow-400/20 shadow-lg shadow-yellow-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
                }`}
              title="Raise hand to speak"
            >
              <Hand className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveDrawer(prev => prev === 'speakingQueue' ? null : 'speakingQueue')}
              className={`relative p-3.5 rounded-full border transition-all ${activeDrawer === 'speakingQueue'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 border-yellow-400/20 shadow-lg shadow-yellow-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
                }`}
              title="View speaking queue"
            >
              <Hand className="w-5 h-5" />
              {speakingQueue.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black rounded-full flex items-center justify-center text-xs font-bold shadow-md animate-pulse">
                  {speakingQueue.length}
                </div>
              )}
            </motion.button>
          )}

          {/* Chat drawer toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(prev => prev === 'chat' ? null : 'chat')}
            className={`p-3.5 rounded-full border transition-all ${activeDrawer === 'chat'
              ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400/20 shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
              }`}
            title="Chat Messages"
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>

          {/* Participants drawer toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDrawer(prev => prev === 'participants' ? null : 'participants')}
            className={`p-3.5 rounded-full border transition-all ${activeDrawer === 'participants'
              ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-400/20 shadow-lg shadow-cyan-600/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5'
              }`}
            title="Participants List"
          >
            <Users className="w-5 h-5" />
          </motion.button>

          {/* Ellipsis Popover Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMoreMenu(prev => !prev)}
              className="p-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute bottom-16 right-0 bg-slate-900 border border-white/10 rounded-2xl p-2 min-w-56 shadow-2xl z-40 flex flex-col gap-0.5"
                >
                  {/* Share Whiteboard */}
                  <button
                    onClick={() => { setShowWhiteboard(prev => !prev); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-cyan-400" />
                    <span>{showWhiteboard ? 'Hide whiteboard' : 'Open whiteboard'}</span>
                  </button>

                  {/* Virtual BG */}
                  <button
                    onClick={() => { setActiveDrawer('virtualBg'); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Virtual Background</span>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => { setActiveDrawer('settings'); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Device Settings</span>
                  </button>

                  {/* File Sharing */}
                  <button
                    onClick={() => { setActiveDrawer('files'); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <FolderOpen className="w-4 h-4 text-emerald-400" />
                    <span>File Sharing</span>
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={() => { setIsFullscreen(prev => !prev); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 text-slate-400" /> : <Maximize className="w-4 h-4 text-slate-400" />}
                    <span>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</span>
                  </button>

                  <button
                    onClick={() => { handleCopyInviteLink(); setShowMoreMenu(false) }}
                    className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>Meeting Info</span>
                  </button>

                  {/* Faculty specific actions */}
                  {currentUser.role === 'faculty' && (
                    <>
                      <div className="border-t border-white/5 my-1.5" />

                      {/* Recording */}
                      <button
                        onClick={() => { toggleRecording(); setShowMoreMenu(false) }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <Circle className={`w-4 h-4 text-red-500 ${isRecording ? 'animate-pulse' : ''}`} />
                        <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                      </button>

                      {/* Breakout Rooms */}
                      <button
                        onClick={() => { setActiveDrawer('breakoutRooms'); setShowMoreMenu(false) }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <LayoutGrid className="w-4 h-4 text-orange-400" />
                        <span>Breakout Rooms</span>
                      </button>

                      {/* Waiting Room */}
                      <button
                        onClick={() => { setActiveDrawer('waitingRoom'); setShowMoreMenu(false) }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors relative"
                      >
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Waiting Room</span>
                        {waitingParticipants.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 absolute right-4 top-3" />
                        )}
                      </button>

                      {/* Lock Meeting */}
                      <button
                        onClick={() => { handleToggleLock(); setShowMoreMenu(false) }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        {isLocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-red-400" />}
                        <span>{isLocked ? 'Unlock Meeting' : 'Lock Meeting'}</span>
                      </button>

                      {/* Attendance Export */}
                      <button
                        onClick={() => { exportAttendance(); setShowMoreMenu(false) }}
                        className="w-full flex items-center gap-3 px-3.5 py-2 hover:bg-white/5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors"
                      >
                        <Film className="w-4 h-4 text-emerald-400" />
                        <span>Export Attendance</span>
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Red leave meeting button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndMeeting}
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg shadow-red-600/25 flex items-center gap-2"
            title="Leave meeting"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End</span>
          </motion.button>
        </div>
      </footer>

      {/* Toast notifications */}
      <div className="fixed bottom-24 right-6 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>

      {/* Floating Reactions animations container */}
      <FloatingReactions reactions={floatingReactions} />

      {/* Invite Modal */}
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
