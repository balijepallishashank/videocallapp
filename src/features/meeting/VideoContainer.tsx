import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, CameraOff, AlertCircle } from 'lucide-react'

interface Participant {
  id: string
  name: string
}

interface VideoContainerProps {
  isCameraOn: boolean
  isScreenSharing: boolean
  videoStream: MediaStream | null
  participants?: Participant[]
  isFullscreen?: boolean
  isCaptionsOn?: boolean
}

export default function VideoContainer({
  isCameraOn,
  isScreenSharing,
  videoStream,
  participants = [],
  isFullscreen = false,
  isCaptionsOn = false,
}: VideoContainerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Display video stream when available
  useEffect(() => {
    if (videoRef.current && videoStream && isCameraOn) {
      try {
        videoRef.current.srcObject = videoStream
      } catch {
        // stream assignment failed — nothing to do
      }
    }
  }, [videoStream, isCameraOn])

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full h-full flex items-center justify-center"
    >
      {/* Video Container with 16:9 aspect ratio */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-900 border-2 border-blue-500/20 shadow-2xl shadow-blue-500/20 ${
        isFullscreen
          ? 'w-full h-full rounded-none'
          : 'w-full max-w-7xl aspect-video rounded-3xl'
      }`}>

        {/* Video Background */}
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 relative flex items-center justify-center">
          {isScreenSharing ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-48 h-36 mx-auto rounded-lg bg-slate-700/50 border-2 border-dashed border-blue-400 flex items-center justify-center">
                  <span className="text-sm text-blue-300">Screen Sharing Active</span>
                </div>
                <p className="text-slate-300">Your screen is being shared</p>
              </div>
            </div>
          ) : isCameraOn && videoStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : isCameraOn && !videoStream ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <Camera className="w-16 h-16 text-slate-500 animate-pulse" />
              <p className="text-slate-400">Initializing camera...</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20">
              <CameraOff className="w-16 h-16 text-slate-400" />
              <div className="text-center">
                <p className="text-slate-300 font-medium">Camera is off</p>
                <p className="text-slate-500 text-sm mt-1">Click camera button to enable</p>
              </div>
            </div>
          )}
        </div>

        {/* Participants Grid Overlay - Top right corner */}
        {participants.length > 0 && (
          <div className="absolute top-4 right-4 grid grid-cols-2 gap-3 max-w-xs">
            {participants.slice(0, 4).map((participant) => (
              <motion.div
                key={participant.id}
                whileHover={{ scale: 1.05 }}
                className="w-20 h-20 rounded-xl glass-dark flex items-center justify-center cursor-pointer relative ring-2 ring-green-500/60 hover:ring-green-400 group"
              >
                <div className="text-2xl">👤</div>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {participant.name}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Live Captions — shown only when enabled, real captions require Speech API */}
        {isCaptionsOn && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 max-w-[80%] bg-black/70 backdrop-blur-md text-white px-6 py-3 rounded-xl text-center text-sm font-medium shadow-2xl z-30 border border-white/10 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            Live captions require browser Speech Recognition support
          </div>
        )}

        {/* Audio waveform — CSS-animated, no JS random values */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent flex items-end justify-center gap-1 px-4 pb-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-sm"
              style={{
                height: '8px',
                animation: `audioBar 1.2s ease-in-out ${(i * 0.06).toFixed(2)}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes audioBar {
          from { height: 4px; opacity: 0.4; }
          to   { height: 28px; opacity: 1; }
        }
      `}</style>
    </motion.div>
  )
}
