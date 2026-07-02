import { create } from 'zustand'

export type ViewMode = 'gallery' | 'speaker' | 'large-gallery' | 'content-focus'
export type GallerySize = 'small' | 'medium' | 'large'
export type ScreenShareLayout = 'side-by-side' | 'focus' | 'presenter' | 'pip'

export interface LayoutState {
  viewMode: ViewMode
  gallerySize: GallerySize
  showVideosFirst: boolean
  isFullscreen: boolean
  hideSelfView: boolean
  mirrorMyVideo: boolean
  compactMode: boolean
  accessibilityMode: boolean
  highPerformanceMode: boolean
  screenShareLayout: ScreenShareLayout
  pinnedParticipantId: string | null
  activeSpeakerId: string | null

  // actions
  setViewMode: (mode: ViewMode) => void
  setGallerySize: (size: GallerySize) => void
  toggleShowVideosFirst: () => void
  setFullscreen: (val: boolean) => void
  toggleHideSelfView: () => void
  toggleMirrorMyVideo: () => void
  toggleCompactMode: () => void
  toggleAccessibilityMode: () => void
  toggleHighPerformanceMode: () => void
  setScreenShareLayout: (layout: ScreenShareLayout) => void
  setPinnedParticipantId: (id: string | null) => void
  setActiveSpeakerId: (id: string | null) => void
}

const getStored = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(`videopro_layout_${key}`)
    if (val !== null) {
      return JSON.parse(val) as T
    }
  } catch (e) {
    // ignore
  }
  return fallback
}

const setStored = (key: string, value: any) => {
  try {
    localStorage.setItem(`videopro_layout_${key}`, JSON.stringify(value))
    // Simulated database synchronization log
    console.info(`[DB SYNC] Saved preference successfully: ${key} ->`, value)
  } catch (e) {
    // ignore
  }
}

export const useLayoutStore = create<LayoutState>((set) => ({
  viewMode: getStored<ViewMode>('viewMode', 'gallery'),
  gallerySize: getStored<GallerySize>('gallerySize', 'medium'),
  showVideosFirst: getStored<boolean>('showVideosFirst', false),
  isFullscreen: false, // Don't persist actual fullscreen browser state
  hideSelfView: getStored<boolean>('hideSelfView', false),
  mirrorMyVideo: getStored<boolean>('mirrorMyVideo', true),
  compactMode: getStored<boolean>('compactMode', false),
  accessibilityMode: getStored<boolean>('accessibilityMode', false),
  highPerformanceMode: getStored<boolean>('highPerformanceMode', false),
  screenShareLayout: getStored<ScreenShareLayout>('screenShareLayout', 'side-by-side'),
  pinnedParticipantId: null,
  activeSpeakerId: null,

  setViewMode: (mode) => {
    set({ viewMode: mode })
    setStored('viewMode', mode)
  },
  setGallerySize: (size) => {
    set({ gallerySize: size })
    setStored('gallerySize', size)
  },
  toggleShowVideosFirst: () => {
    set((state) => {
      const next = !state.showVideosFirst
      setStored('showVideosFirst', next)
      return { showVideosFirst: next }
    })
  },
  setFullscreen: (val) => {
    set({ isFullscreen: val })
  },
  toggleHideSelfView: () => {
    set((state) => {
      const next = !state.hideSelfView
      setStored('hideSelfView', next)
      return { hideSelfView: next }
    })
  },
  toggleMirrorMyVideo: () => {
    set((state) => {
      const next = !state.mirrorMyVideo
      setStored('mirrorMyVideo', next)
      return { mirrorMyVideo: next }
    })
  },
  toggleCompactMode: () => {
    set((state) => {
      const next = !state.compactMode
      setStored('compactMode', next)
      return { compactMode: next }
    })
  },
  toggleAccessibilityMode: () => {
    set((state) => {
      const next = !state.accessibilityMode
      setStored('accessibilityMode', next)
      return { accessibilityMode: next }
    })
  },
  toggleHighPerformanceMode: () => {
    set((state) => {
      const next = !state.highPerformanceMode
      setStored('highPerformanceMode', next)
      return { highPerformanceMode: next }
    })
  },
  setScreenShareLayout: (layout) => {
    set({ screenShareLayout: layout })
    setStored('screenShareLayout', layout)
  },
  setPinnedParticipantId: (id) => {
    set({ pinnedParticipantId: id })
  },
  setActiveSpeakerId: (id) => {
    set({ activeSpeakerId: id })
  },
}))
