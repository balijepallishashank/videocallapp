import { motion, AnimatePresence } from 'framer-motion'
import { Pin, PinOff, MicOff, Mic, Video, VideoOff, Shield, Wifi } from 'lucide-react'
import { useLayoutStore } from './MeetingLayoutManager'
import { LocalVideoPlayer } from './VideoGrid'

interface Participant {
  id: string
  name: string
  email: string
  isVideoOn: boolean
  isMuted: boolean
  isHost: boolean
  stream?: MediaStream
}

interface GalleryViewProps {
  participants: Participant[]
  localUserId: string
  activeSpeakerId: string | null
}

// Deterministic avatar color based on name
const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-violet-600 to-purple-700',
  'from-emerald-600 to-teal-700',
  'from-rose-600 to-pink-700',
  'from-amber-600 to-orange-700',
  'from-cyan-600 to-sky-700',
  'from-fuchsia-600 to-violet-700',
  'from-lime-600 to-green-700',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

/**
 * Compute an optimal CSS grid layout for N participants.
 * Returns tailwind classes for columns and a tile aspect-ratio.
 */
function computeGrid(count: number, gallerySize: 'small' | 'medium' | 'large') {
  const sizeMultiplier = gallerySize === 'small' ? 0.75 : gallerySize === 'large' ? 1.35 : 1

  if (count === 0) return { cols: 'grid-cols-1', rows: 1, minH: '0' }
  if (count === 1) return { cols: 'grid-cols-1', rows: 1, minH: `${Math.round(340 * sizeMultiplier)}px` }
  if (count === 2) return { cols: 'grid-cols-2', rows: 1, minH: `${Math.round(280 * sizeMultiplier)}px` }
  if (count <= 4) return { cols: 'grid-cols-2', rows: 2, minH: `${Math.round(220 * sizeMultiplier)}px` }
  if (count <= 6) return { cols: 'grid-cols-3', rows: 2, minH: `${Math.round(190 * sizeMultiplier)}px` }
  if (count <= 9) return { cols: 'grid-cols-3', rows: 3, minH: `${Math.round(170 * sizeMultiplier)}px` }
  if (count <= 12) return { cols: 'grid-cols-4', rows: 3, minH: `${Math.round(150 * sizeMultiplier)}px` }
  if (count <= 16) return { cols: 'grid-cols-4', rows: 4, minH: `${Math.round(130 * sizeMultiplier)}px` }
  return { cols: 'grid-cols-5', rows: Math.ceil(count / 5), minH: `${Math.round(110 * sizeMultiplier)}px` }
}

function ParticipantTile({
  participant,
  isLocal,
  isSpeaking,
  isPinned,
  onTogglePin,
  minHeight,
  mirrorMyVideo,
  accessibilityMode,
}: {
  participant: Participant
  isLocal: boolean
  isSpeaking: boolean
  isPinned: boolean
  onTogglePin: () => void
  minHeight: string
  mirrorMyVideo: boolean
  accessibilityMode: boolean
}) {
  const gradient = getGradient(participant.name)
  const initials = participant.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ minHeight }}
      className={`
        relative rounded-2xl overflow-hidden group cursor-default select-none
        transition-all duration-200
        ${isSpeaking
          ? 'ring-2 ring-blue-400 shadow-[0_0_0_2px_rgba(96,165,250,0.35),0_0_20px_rgba(59,130,246,0.25)]'
          : 'ring-1 ring-white/6 hover:ring-white/15'}
      `}
    >
      {/* ── Video or Avatar Background ── */}
      {participant.isVideoOn ? (
        <div className="absolute inset-0 bg-black">
          {isLocal && participant.stream ? (
            <LocalVideoPlayer stream={participant.stream} mirrored={mirrorMyVideo} />
          ) : (
            /* Simulated remote video — gradient avatar */
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span className="text-3xl font-bold text-white/90 drop-shadow">{initials}</span>
            </div>
          )}
        </div>
      ) : (
        /* Camera off — dark with centered avatar */
        <div className="absolute inset-0 bg-[#0f1623] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/6 border border-white/8">
              <VideoOff className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 font-medium">Camera off</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Speaking pulse border overlay ── */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-blue-400/70"
          />
        )}
      </AnimatePresence>

      {/* ── Bottom name bar ── */}
      <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-20">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Active speaker mic animation */}
            {isSpeaking && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400"
              />
            )}
            <span className={`font-medium text-white truncate drop-shadow-sm ${accessibilityMode ? 'text-sm' : 'text-xs'}`}>
              {participant.name}
              {isLocal && <span className="text-white/50 ml-1">(You)</span>}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {participant.isHost && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/30">
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wide">Host</span>
              </div>
            )}
            {participant.isMuted ? (
              <div className="p-1 rounded-md bg-red-500/25 border border-red-500/20">
                <MicOff className="w-3 h-3 text-red-400" />
              </div>
            ) : isSpeaking ? (
              <div className="p-1 rounded-md bg-blue-500/25 border border-blue-400/30">
                <Mic className="w-3 h-3 text-blue-400" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Hover action overlay ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right actions — visible on hover */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-auto z-30">
          <button
            onClick={onTogglePin}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 border border-white/12 text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
            title={isPinned ? 'Unpin' : 'Pin participant'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Top-left: connection quality (simulated) */}
        <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30">
          <div className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/8">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] text-emerald-300 font-medium">HD</span>
          </div>
        </div>

        {/* Pinned indicator */}
        {isPinned && (
          <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400/40 backdrop-blur-sm">
            <Pin className="w-3 h-3 text-amber-300" />
            <span className="text-[9px] text-amber-200 font-semibold">Pinned</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function GalleryView({ participants, localUserId, activeSpeakerId }: GalleryViewProps) {
  const {
    gallerySize,
    pinnedParticipantId,
    setPinnedParticipantId,
    mirrorMyVideo,
    accessibilityMode,
  } = useLayoutStore()

  const { cols, minH } = computeGrid(participants.length, gallerySize)

  return (
    <div className={`w-full h-full grid ${cols} gap-2 p-3 content-start overflow-y-auto`}
      style={{ alignContent: participants.length <= 4 ? 'center' : 'start' }}
    >
      <AnimatePresence mode="popLayout">
        {participants.map((participant) => {
          const isLocal = participant.id === localUserId
          const isSpeaking = activeSpeakerId === participant.id && !participant.isMuted
          const isPinned = pinnedParticipantId === participant.id

          return (
            <ParticipantTile
              key={participant.id}
              participant={participant}
              isLocal={isLocal}
              isSpeaking={isSpeaking}
              isPinned={isPinned}
              onTogglePin={() => setPinnedParticipantId(isPinned ? null : participant.id)}
              minHeight={minH}
              mirrorMyVideo={mirrorMyVideo}
              accessibilityMode={accessibilityMode}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
