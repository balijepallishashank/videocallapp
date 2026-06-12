import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Image, Upload, X } from 'lucide-react'

interface VirtualBackgroundsProps {
  videoRef: React.RefObject<HTMLVideoElement>
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

const PRESET_BACKGROUNDS = [
  { id: 'none', name: 'None', url: '' },
  { id: 'blur', name: 'Blur', url: 'blur' },
  { id: 'office', name: 'Office', gradient: 'from-slate-700 via-slate-800 to-slate-900' },
  { id: 'nature', name: 'Nature', gradient: 'from-green-700 via-blue-800 to-teal-900' },
  { id: 'abstract', name: 'Abstract', gradient: 'from-purple-700 via-pink-800 to-red-900' },
  { id: 'space', name: 'Space', gradient: 'from-indigo-900 via-purple-900 to-black' },
]

export default function VirtualBackgrounds({ onToast }: VirtualBackgroundsProps) {
  const [selectedBackground, setSelectedBackground] = useState('none')
  const [customBackground, setCustomBackground] = useState<string | null>(null)
  const [blurIntensity, setBlurIntensity] = useState(10)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyBackground = (backgroundId: string) => {
    setSelectedBackground(backgroundId)
    
    if (backgroundId === 'none') {
      onToast('Background removed', 'info')
    } else if (backgroundId === 'blur') {
      onToast('Blur background applied', 'success')
    } else {
      onToast('Virtual background applied', 'success')
    }
  }

  const uploadCustomBackground = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      onToast('Please upload an image file', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setCustomBackground(url)
      setSelectedBackground('custom')
      onToast('Custom background uploaded!', 'success')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">Virtual Backgrounds</span>
        </div>
      </div>

      {/* Background Options */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PRESET_BACKGROUNDS.map((bg) => (
          <motion.button
            key={bg.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => applyBackground(bg.id)}
            aria-label={`Select ${bg.name} background`}
            className={`relative h-16 rounded-lg overflow-hidden transition-all ${
              bg.gradient ? `bg-gradient-to-br ${bg.gradient}` : 'bg-slate-800'
            } ${
              selectedBackground === bg.id
                ? 'ring-2 ring-blue-500'
                : 'hover:ring-2 hover:ring-slate-600'
            }`}
          >
            {bg.id === 'none' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <X className="w-6 h-6 text-slate-400" />
              </div>
            )}
            {bg.id === 'blur' && (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-slate-700/50">
                <div className="text-2xl">~</div>
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 py-1 bg-black/50 text-xs text-white text-center">
              {bg.name}
            </div>
          </motion.button>
        ))}

        {/* Custom Background */}
        {customBackground && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => applyBackground('custom')}
            className={`relative h-16 rounded-lg overflow-hidden ${
              selectedBackground === 'custom'
                ? 'ring-2 ring-blue-500'
                : 'hover:ring-2 hover:ring-slate-600'
            }`}
          >
            <img src={customBackground} alt="Custom" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 py-1 bg-black/50 text-xs text-white text-center">
              Custom
            </div>
          </motion.button>
        )}
      </div>

      {/* Blur Intensity */}
      {selectedBackground === 'blur' && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Blur Intensity: {blurIntensity}px
          </label>
          <input
            type="range"
            min="5"
            max="30"
            value={blurIntensity}
            onChange={(e) => setBlurIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Upload Custom Background */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadCustomBackground}
        className="hidden"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all flex items-center justify-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Upload Custom Background
      </motion.button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
