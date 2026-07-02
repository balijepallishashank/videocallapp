import { motion, AnimatePresence } from 'framer-motion'
import { Pin, PinOff, MicOff, Mic, Shield, VideoOff } from 'lucide-react'
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

interface SpeakerViewProps {
  participants: Participant[]
  localUserId: string
  activeSpeakerId: string | null
}

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

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function SpeakerView({ participants, localUserId, activeSpeakerId }: SpeakerViewProps) {
  const {
    pinnedParticipantId,
    setPinnedParticipantId,
    mirrorMyVideo,
    accessibilityMode,
  } = useLayoutStore()

  const focusedParticipant =
    participants.find((p) => p.id === pinnedParticipantId) ||
    participants.find((p) => p.id === activeSpeakerId) ||
    participants.find((p) => p.id === localUserId) ||
    participants[0]

  const thumbnails = participants.filter((p) => p.id !== focusedParticipant?.id)

  if (!focusedParticipant) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
        No participants in call
      </div>
    )
  }

  const isLocalFocused = focusedParticipant.id === localUserId
  const isFocusedSpeaking = activeSpeakerId === focusedParticipant.id && !focusedParticipant.isMuted
  const isPinned = pinnedParticipantId === focusedParticipant.id
  const focusedGradient = getGradient(focusedParticipant.name)
  const focusedInitials = getInitials(focusedParticipant.name)

  return (
    <div className="w-full h-full flex flex-col gap-2.5 p-3 overflow-hidden">
      {/* ── Main Speaker ── */}
      <motion.div
        key={focusedParticipant.id}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`
          flex-1 relative rounded-2xl overflow-hidden group min-h-0
          ${isFocusedSpeaking
            ? 'ring-2 ring-blue-400 shadow-[0_0_0_2px_rgba(96,165,250,0.25),0_0_30px_rgba(59,130,246,0.2)]'
            : 'ring-1 ring-white/8'}
        `}
      >
        {/* Video or avatar */}
        {focusedParticipant.isVideoOn ? (
          <div className="absolute inset-0 bg-black">
            {isLocalFocused && focusedParticipant.stream ? (
              <LocalVideoPlayer stream={focusedParticipant.stream} mirrored={mirrorMyVideo} />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${focusedGradient} flex items-center justify-center`}>
                <span className="text-7xl font-bold text-white/90 drop-shadow-2xl">{focusedInitials}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#0f1623] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${focusedGradient} flex items-center justify-center shadow-2xl`}>
                <span className="text-4xl font-bold text-white">{focusedInitials}</span>
              </div>
              <p className="text-sm font-semibold text-slate-400">{focusedParticipant.name}</p>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/6 border border-white/8">
                <VideoOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs text-slate-500">Camera off</span>
              </div>
            </div>
          </div>
        )}

        {/* Speaking border pulse */}
        <AnimatePresence>
          {isFocusedSpeaking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-blue-400/50"
            />
          )}
        </AnimatePresence>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isFocusedSpeaking && (
                <div className="flex items-end gap-0.5 h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['30%', '100%', '30%'] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
                      className="w-1 bg-blue-400 rounded-full"
                    />
                  ))}
                </div>
              )}
              <span className={`font-semibold text-white drop-shadow ${accessibilityMode ? 'text-base' : 'text-sm'}`}>
                {focusedParticipant.name}
                {isLocalFocused && <span className="text-white/50 ml-2 font-normal">(You)</span>}
              </span>
              {focusedParticipant.isHost && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/30">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">Host</span>
                </div>
              )}
              {isFocusedSpeaking && (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/25 text-[10px] font-bold text-blue-300 uppercase tracking-wide">
                  Speaking
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {focusedParticipant.isMuted ? (
                <div className="p-1.5 rounded-lg bg-red-500/25 border border-red-500/20">
                  <MicOff className="w-4 h-4 text-red-400" />
                </div>
              ) : isFocusedSpeaking ? (
                <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/25">
                  <Mic className="w-4 h-4 text-blue-400" />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Pin button - top right */}
        <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => setPinnedParticipantId(isPinned ? null : focusedParticipant.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-sm text-slate-200 hover:text-white border border-white/12 text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            {isPinned ? (
              <><PinOff className="w-3.5 h-3.5 text-blue-400" /><span>Unpin</span></>
            ) : (
              <><Pin className="w-3.5 h-3.5" /><span>Pin to screen</span></>
            )}
          </button>
        </div>
      </motion.div>

      {/* ── Thumbnail strip ── */}
      {thumbnails.length > 0 && (
        <div className="flex gap-2 h-[100px] flex-shrink-0 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {thumbnails.map((p) => {
            const isLocalThumb = p.id === localUserId
            const isSpeakingThumb = activeSpeakerId === p.id && !p.isMuted
            const isPinnedThumb = pinnedParticipantId === p.id
            const thumbGradient = getGradient(p.name)
            const thumbInitials = getInitials(p.name)

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => setPinnedParticipantId(p.id === pinnedParticipantId ? null : p.id)}
                className={`
                  relative flex-shrink-0 w-[168px] h-full rounded-xl overflow-hidden group/thumb cursor-pointer
                  transition-all duration-200
                  ${isSpeakingThumb
                    ? 'ring-2 ring-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'ring-1 ring-white/8 hover:ring-white/18'}
                `}
              >
                {p.isVideoOn ? (
                  <div className="absolute inset-0 bg-black">
                    {isLocalThumb && p.stream ? (
                      <LocalVideoPlayer stream={p.stream} mirrored={mirrorMyVideo} />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${thumbGradient} flex items-center justify-center`}>
                        <span className="text-xl font-bold text-white/90">{thumbInitials}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-[#0f1623] flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${thumbGradient} flex items-center justify-center`}>
                      <span className="text-sm font-bold text-white">{thumbInitials}</span>
                    </div>
                  </div>
                )}

                {/* Name bar */}
                <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/85 to-transparent z-10">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-medium text-white truncate">{p.name}{isLocalThumb && ' (You)'}</span>
                    {p.isMuted && <MicOff className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />}
                  </div>
                </div>

                {isPinnedThumb && (
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-blue-500/80 z-20">
                    <Pin className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Hover pin overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-20">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 border border-white/15">
                    <Pin className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white font-medium">Focus</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
