import { useState, useEffect, useRef } from 'react'
import {
  LayoutGrid,
  User,
  Layers,
  Monitor,
  Check,
  Maximize,
  Minimize,
  EyeOff,
  Minimize2,
  Accessibility,
  Zap,
  ChevronRight,
  Sparkles,
  Layout,
  RefreshCcw,
} from 'lucide-react'
import { useLayoutStore, type ViewMode } from './MeetingLayoutManager'
import GallerySizeSelector from './GallerySizeSelector'

export default function ViewMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'more'>('none')
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    viewMode,
    showVideosFirst,
    isFullscreen,
    hideSelfView,
    mirrorMyVideo,
    compactMode,
    accessibilityMode,
    highPerformanceMode,
    setViewMode,
    toggleShowVideosFirst,
    setFullscreen,
    toggleHideSelfView,
    toggleMirrorMyVideo,
    toggleCompactMode,
    toggleAccessibilityMode,
    toggleHighPerformanceMode,
  } = useLayoutStore()

  // Native Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
    setIsOpen(false)
  }

  // Monitor native fullscreen state changes
  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [setFullscreen])

  // Close dropdown on outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveSubmenu('none')
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const layoutOptions: { value: ViewMode; label: string; desc: string; icon: any }[] = [
    { value: 'gallery', label: 'Gallery View', desc: 'Display all tiles in a responsive grid', icon: LayoutGrid },
    { value: 'speaker', label: 'Speaker View', desc: 'Focus on the current active speaker', icon: User },
    { value: 'large-gallery', label: 'Large Gallery', desc: 'View up to 49 participants at once', icon: Layers },
    { value: 'content-focus', label: 'Focus on Content', desc: 'Maximize display of shared screen', icon: Monitor },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setActiveSubmenu('none')
        }}
        className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all duration-200 border ${
          isOpen
            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
            : 'bg-slate-700/80 hover:bg-slate-600 border-slate-600 text-slate-300 hover:text-white'
        } ${accessibilityMode ? 'text-base py-3.5 px-5 font-bold' : 'text-sm font-medium'}`}
        title="Change view layout options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Layout className={accessibilityMode ? 'w-5 h-5' : 'w-4 h-4'} />
        <span>View</span>
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-16 left-0 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl py-2 z-50 flex flex-col transition-all duration-300 overflow-hidden ${
            compactMode ? 'w-64' : 'w-72'
          }`}
          role="menu"
        >
          {activeSubmenu === 'none' && (
            <>
              {/* Layout Modes */}
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Layout
              </div>
              <div className="space-y-0.5 px-1.5">
                {layoutOptions.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setViewMode(opt.value)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                        viewMode === opt.value
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                          : 'hover:bg-white/5 text-slate-300 hover:text-white border border-transparent'
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${viewMode === opt.value ? 'text-blue-400' : 'text-slate-400'}`} />
                        <div>
                          <p className={`text-xs font-semibold ${accessibilityMode ? 'text-sm' : ''}`}>
                            {opt.label}
                          </p>
                        </div>
                      </div>
                      {viewMode === opt.value && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  )
                })}
              </div>

              {/* Tile Size Selector Component */}
              <GallerySizeSelector />

              {/* Toggles */}
              <div className="border-t border-slate-700/50 my-1"></div>
              <div className="px-1.5">
                <button
                  onClick={() => {
                    toggleShowVideosFirst()
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 rounded-xl text-left text-slate-300 hover:text-white"
                  role="menuitemcheckbox"
                  aria-checked={showVideosFirst}
                >
                  <span className={`text-xs font-semibold ${accessibilityMode ? 'text-sm' : ''}`}>
                    Show Videos First
                  </span>
                  <div
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${
                      showVideosFirst ? 'bg-blue-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`bg-white w-3.5 h-3.5 rounded-full shadow transition-transform ${
                        showVideosFirst ? 'transform translate-x-3.5' : ''
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Submenu Link */}
              <div className="border-t border-slate-700/50 my-1"></div>
              <div className="px-1.5">
                <button
                  onClick={() => setActiveSubmenu('more')}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-xl text-left text-slate-300 hover:text-white transition-colors"
                  role="menuitem"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className={`text-xs font-semibold ${accessibilityMode ? 'text-sm' : ''}`}>
                      More View Options
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </>
          )}

          {activeSubmenu === 'more' && (
            <div className="px-1.5 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5">
                <button
                  onClick={() => setActiveSubmenu('none')}
                  className="text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-wider"
                >
                  &larr; Back
                </button>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Options
                </span>
              </div>

              {/* Full Screen */}
              <button
                onClick={handleToggleFullscreen}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-xl text-left text-slate-300 hover:text-white text-xs font-semibold"
              >
                {isFullscreen ? <Minimize className="w-4 h-4 text-slate-400" /> : <Maximize className="w-4 h-4 text-slate-400" />}
                <span>{isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}</span>
              </button>

              {/* Hide Self */}
              <button
                onClick={() => {
                  toggleHideSelfView()
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  hideSelfView ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>Hide Self View</span>
                </div>
                {hideSelfView && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* Mirror Video */}
              <button
                onClick={() => {
                  toggleMirrorMyVideo()
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  mirrorMyVideo ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-4 h-4 text-slate-400" />
                  <span>Mirror My Video</span>
                </div>
                {mirrorMyVideo && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* Compact Mode */}
              <button
                onClick={() => {
                  toggleCompactMode()
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  compactMode ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Minimize2 className="w-4 h-4 text-slate-400" />
                  <span>Compact UI Controls</span>
                </div>
                {compactMode && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* Accessibility Mode */}
              <button
                onClick={() => {
                  toggleAccessibilityMode()
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  accessibilityMode ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Accessibility className="w-4 h-4 text-slate-400" />
                  <span>Accessibility Mode</span>
                </div>
                {accessibilityMode && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {/* High Performance Mode */}
              <button
                onClick={() => {
                  toggleHighPerformanceMode()
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  highPerformanceMode ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span>High Performance Mode</span>
                </div>
                {highPerformanceMode && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
