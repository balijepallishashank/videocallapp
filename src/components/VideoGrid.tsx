import { useEffect, useRef } from 'react'
import { useLayoutStore } from './MeetingLayoutManager'
import GalleryView from './GalleryView'
import SpeakerView from './SpeakerView'
import LargeGallery from './LargeGallery'
import ContentFocusView from './ContentFocusView'

// Helper player for rendering local WebRTC stream with custom controls
export function LocalVideoPlayer({ stream, mirrored }: { stream: MediaStream; mirrored: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className={`w-full h-full object-cover relative z-10 transition-transform duration-200 ${
        mirrored ? 'scale-x-[-1]' : ''
      }`}
    />
  )
}

interface Participant {
  id: string
  name: string
  email: string
  isVideoOn: boolean
  isMuted: boolean
  isHost: boolean
  stream?: MediaStream
}

interface VideoGridProps {
  participants: Participant[]
  localUserId: string
  localStream: MediaStream | null
  isScreenSharing: boolean
  isPipMode?: boolean
}

export default function VideoGrid({
  participants,
  localUserId,
  localStream,
  isScreenSharing,
  isPipMode = false,
}: VideoGridProps) {
  const {
    viewMode,
    showVideosFirst,
    hideSelfView,
    activeSpeakerId,
    setViewMode,
  } = useLayoutStore()

  if (isPipMode) {
    const active = participants.find(p => p.id === (activeSpeakerId || localUserId)) || participants[0]
    return (
      <div className="w-full h-full bg-black relative">
        {active.isVideoOn ? (
          active.id === localUserId && localStream ? (
            <LocalVideoPlayer stream={localStream} mirrored={useLayoutStore.getState().mirrorMyVideo} />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
              {active.name.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
              {active.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Auto-switch viewMode if screen sharing begins/ends
  useEffect(() => {
    if (isScreenSharing) {
      setViewMode('content-focus')
    } else if (viewMode === 'content-focus') {
      setViewMode('gallery')
    }
  }, [isScreenSharing, setViewMode])

  // Build uniform list of participants (including local user stream details)
  const fullList: Participant[] = participants.map((p) => {
    if (p.id === localUserId) {
      return {
        ...p,
        stream: localStream || undefined,
      }
    }
    return p
  })

  // Filter self view if active
  const filteredList = hideSelfView ? fullList.filter((p) => p.id !== localUserId) : fullList

  // Sort list if "Show Videos First" is checked
  const sortedList = [...filteredList].sort((a, b) => {
    if (showVideosFirst) {
      if (a.isVideoOn && !b.isVideoOn) return -1
      if (!a.isVideoOn && b.isVideoOn) return 1
    }
    return 0
  })

  // Distribute based on selected View Mode
  switch (viewMode) {
    case 'speaker':
      return (
        <SpeakerView
          participants={sortedList}
          localUserId={localUserId}
          activeSpeakerId={activeSpeakerId}
        />
      )
    case 'large-gallery':
      return (
        <LargeGallery
          participants={sortedList}
          localUserId={localUserId}
          activeSpeakerId={activeSpeakerId}
        />
      )
    case 'content-focus':
      return (
        <ContentFocusView
          participants={sortedList}
          localUserId={localUserId}
          activeSpeakerId={activeSpeakerId}
        />
      )
    case 'gallery':
    default:
      return (
        <GalleryView
          participants={sortedList}
          localUserId={localUserId}
          activeSpeakerId={activeSpeakerId}
        />
      )
  }
}
