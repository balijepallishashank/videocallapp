import { motion } from 'framer-motion'
import { Monitor, MicOff } from 'lucide-react'
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

interface ContentFocusViewProps {
  participants: Participant[]
  localUserId: string
  activeSpeakerId: string | null
}

export default function ContentFocusView({ participants, localUserId, activeSpeakerId }: ContentFocusViewProps) {
  const {
    screenShareLayout,
    setScreenShareLayout,
    mirrorMyVideo,
  } = useLayoutStore()

  // Primary speaker/presenter node
  const activePresenter = participants.find((p) => p.id === activeSpeakerId) || participants[0]


  const shareLayoutOptions = [
    { value: 'side-by-side' as const, label: 'Side by Side' },
    { value: 'focus' as const, label: 'Focus Content' },
    { value: 'presenter' as const, label: 'Presenter Mode' },
    { value: 'pip' as const, label: 'Picture-in-Picture' },
  ]

  return (
    <div className="w-full h-full flex flex-col gap-3 p-2 overflow-hidden relative">
      {/* Small Layout Option bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/60 rounded-xl border border-white/5 w-fit mx-auto backdrop-blur-xs z-20">
        {shareLayoutOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setScreenShareLayout(opt.value)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              screenShareLayout === opt.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden relative">
        {/* Main Content Area */}
        <div
          className={`relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all duration-300 ${
            screenShareLayout === 'focus' ? 'w-full' : screenShareLayout === 'side-by-side' ? 'lg:w-[75%]' : 'w-full'
          }`}
        >
          {/* Simulated Screen Presentation */}
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 relative">
            <Monitor className="w-20 h-20 text-blue-500/80 mb-4 animate-pulse" />
            <h3 className="text-white text-lg font-bold">Shared Presentation Window</h3>
            <p className="text-slate-400 text-sm mt-1.5">Simulated presentation content. Sharing is active.</p>

            {/* Presenter Mode (Floating profile in bottom-right corner) */}
            {screenShareLayout === 'presenter' && activePresenter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bottom-4 right-4 w-48 h-32 rounded-xl overflow-hidden bg-slate-900 border-2 border-blue-500 shadow-xl z-20"
              >
                {activePresenter.isVideoOn ? (
                  <div className="w-full h-full bg-black relative">
                    {activePresenter.id === localUserId && activePresenter.stream ? (
                      <LocalVideoPlayer stream={activePresenter.stream} mirrored={mirrorMyVideo} />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-lg font-bold">
                        {activePresenter.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                      {activePresenter.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1 rounded text-white truncate max-w-[80%]">
                  {activePresenter.name} (Presenter)
                </div>
              </motion.div>
            )}

            {/* Content PiP Overlay Mode */}
            {screenShareLayout === 'pip' && (
              <motion.div
                drag
                dragConstraints={{ left: -100, right: 300, top: -100, bottom: 200 }}
                className="absolute top-4 left-4 w-52 h-36 rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-2xl z-30 cursor-move"
              >
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-2">
                  <Monitor className="w-8 h-8 text-blue-400 mb-1" />
                  <span className="text-[10px] text-white text-center">Drag Presentation Window</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Participant Sidebar (Shown for Side-by-Side) */}
        {screenShareLayout === 'side-by-side' && (
          <div className="w-full lg:w-[25%] flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto custom-scrollbar p-1 flex-shrink-0">
            {participants.map((p) => {
              const isLocalThumb = p.id === localUserId
              const isSpeakingThumb = activeSpeakerId === p.id && !p.isMuted

              return (
                <div
                  key={p.id}
                  className={`relative flex-shrink-0 w-36 lg:w-full h-20 rounded-xl overflow-hidden bg-slate-900 border transition-all duration-200 ${
                    isSpeakingThumb ? 'ring-2 ring-blue-500 border-blue-500' : 'border-white/10'
                  }`}
                >
                  {p.isVideoOn ? (
                    <div className="w-full h-full relative bg-black">
                      {isLocalThumb && p.stream ? (
                        <LocalVideoPlayer stream={p.stream} mirrored={mirrorMyVideo} />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-1 inset-x-1 px-1 py-0.5 rounded bg-black/60 flex items-center justify-between text-white text-[9px]">
                    <span className="truncate max-w-[70%]">{p.name}</span>
                    {p.isMuted && <MicOff className="w-2.5 h-2.5 text-red-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full-width feed under Presentation (Only for PiP mode where content is in small window) */}
        {screenShareLayout === 'pip' && activePresenter && (
          <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
            {activePresenter.isVideoOn ? (
              <div className="w-full h-full bg-black relative">
                {activePresenter.id === localUserId && activePresenter.stream ? (
                  <LocalVideoPlayer stream={activePresenter.stream} mirrored={mirrorMyVideo} />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-300 text-3xl font-bold">
                    {activePresenter.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-slate-950 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-4xl font-bold text-slate-300">
                  {activePresenter.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
