import { useLayoutStore, type GallerySize } from './MeetingLayoutManager'

export default function GallerySizeSelector() {
  const gallerySize = useLayoutStore((state) => state.gallerySize)
  const setGallerySize = useLayoutStore((state) => state.setGallerySize)

  const sizes: { value: GallerySize; label: string; desc: string }[] = [
    { value: 'small', label: 'Small', desc: 'Maximize visible grid tiles' },
    { value: 'medium', label: 'Medium', desc: 'Standard layout proportion' },
    { value: 'large', label: 'Large', desc: 'Zoom in on participants' },
  ]

  return (
    <div className="py-2 px-3 border-t border-slate-700/50">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
        Tile Size
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sizes.map((sz) => (
          <button
            key={sz.value}
            onClick={() => setGallerySize(sz.value)}
            className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              gallerySize === sz.value
                ? 'bg-blue-500 text-white shadow-sm border border-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50'
            }`}
            title={sz.desc}
          >
            {sz.label}
          </button>
        ))}
      </div>
    </div>
  )
}
