import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pin, PinOff, MicOff, ChevronLeft, ChevronRight } from 'lucide-react'
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

interface LargeGalleryProps {
  participants: Participant[]
  localUserId: string
  activeSpeakerId: string | null
}

export default function LargeGallery({ participants, localUserId, activeSpeakerId }: LargeGalleryProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 25 // 5x5 grid page size

  const {
    pinnedParticipantId,
    setPinnedParticipantId,
    mirrorMyVideo,
    highPerformanceMode,
    accessibilityMode,
  } = useLayoutStore()

  const pageCount = Math.ceil(participants.length / pageSize)
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize

  // Virtualized rendering: slice to only render the active viewport list
  const visibleParticipants = participants.slice(startIndex, endIndex)

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < pageCount - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Calculate dynamic grid columns depending on how many tiles are on the current page
  const count = visibleParticipants.length
  const gridColsClass =
    count <= 1
      ? 'grid-cols-1'
      : count <= 4
        ? 'grid-cols-2'
        : count <= 9
          ? 'grid-cols-3'
          : count <= 16
            ? 'grid-cols-4'
            : 'grid-cols-5'

  return (
    <div className="w-full h-full flex flex-col justify-between gap-4 p-2 overflow-hidden">
      {/* 5x5 Grid Area */}
      <div className={`grid gap-2 items-center justify-center flex-1 w-full ${gridColsClass} overflow-y-auto`}>
        {visibleParticipants.map((participant) => {
          const isLocal = participant.id === localUserId
          const isSpeaking = activeSpeakerId === participant.id && !participant.isMuted
          const isPinned = pinnedParticipantId === participant.id

          const tileAnimProps = highPerformanceMode
            ? {}
            : {
                initial: { opacity: 0, scale: 0.95 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.2 },
              }

          return (
            <motion.div
              key={participant.id}
              {...tileAnimProps}
              className={`relative aspect-video rounded-xl overflow-hidden bg-slate-900 border transition-all duration-200 ${
                isSpeaking
                  ? 'ring-2 ring-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'border-white/10'
              }`}
            >
              {participant.isVideoOn ? (
                <div className="w-full h-full relative bg-black">
                  {isLocal && participant.stream ? (
                    <LocalVideoPlayer stream={participant.stream} mirrored={mirrorMyVideo} />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {/* Minimal Bottom Banner */}
              <div className="absolute bottom-1 inset-x-1 px-1.5 py-0.5 rounded bg-black/75 flex items-center justify-between text-white text-[9px] font-medium z-20">
                <span className="truncate max-w-[65%]">{participant.name}</span>
                <div className="flex items-center gap-1">
                  {participant.isMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
                  {participant.isHost && (
                    <span className="px-1 bg-blue-500/30 text-blue-300 rounded text-[7px] font-bold">HOST</span>
                  )}
                </div>
              </div>

              {/* Pin indicator toggle */}
              <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity z-20">
                <button
                  onClick={() => setPinnedParticipantId(isPinned ? null : participant.id)}
                  className="p-1 rounded bg-black/60 text-slate-300 hover:text-white"
                >
                  {isPinned ? <PinOff className="w-2.5 h-2.5" /> : <Pin className="w-2.5 h-2.5" />}
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-slate-950/40 border border-white/5 rounded-xl px-4 w-fit mx-auto backdrop-blur-xs">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`font-semibold text-slate-300 ${accessibilityMode ? 'text-sm' : 'text-xs'}`}>
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === pageCount - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
