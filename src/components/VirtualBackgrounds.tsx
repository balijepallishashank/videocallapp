import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Upload, X, Check, Trash2, Camera } from 'lucide-react'

interface VirtualBackgroundsProps {
  activeBg: { id: string; blur?: number; url?: string }
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  onBackgroundChange: (bg: { id: string; blur?: number; url?: string }) => void
}

const PRESET_BACKGROUNDS = [
  { id: 'none', name: 'None', url: '' },
  { id: 'blur', name: 'Blur', url: 'blur' },
  { id: 'office', name: 'Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
  { id: 'nature', name: 'Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=300&q=80' },
  { id: 'abstract', name: 'Abstract', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=300&q=80' },
  { id: 'space', name: 'Space', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=80' },
]

export default function VirtualBackgrounds({ activeBg, onToast, onBackgroundChange }: VirtualBackgroundsProps) {
  const [customBackgrounds, setCustomBackgrounds] = useState<{ id: string; url: string }[]>([])
  const [isApplying, setIsApplying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const applyBackground = (bg: { id: string; blur?: number; url?: string }) => {
    setIsApplying(true)
    onBackgroundChange(bg)

    // Simulate a slight delay for UI feedback to indicate processing
    setTimeout(() => {
      setIsApplying(false)
      if (bg.id === 'none') {
        onToast('Background removed', 'info')
      } else if (bg.id === 'blur') {
        onToast('Blur background applied', 'success')
      } else {
        onToast('Virtual background applied', 'success')
      }
    }, 600)
  }

  const uploadCustomBackground = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/') && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      onToast('Please upload a valid JPG, PNG, or WEBP image', 'error')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      onToast('Image size must be less than 10MB', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      const newBg = { id: `custom-${Date.now()}`, url }
      setCustomBackgrounds((prev) => [...prev, newBg])
      applyBackground(newBg)
    }
    reader.readAsDataURL(file)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeCustomBackground = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCustomBackgrounds((prev) => prev.filter((bg) => bg.id !== id))
    if (activeBg.id === id) {
      applyBackground({ id: 'none' })
    }
  }

  return (
    <div className="glass rounded-xl p-5 space-y-5 relative">
      {isApplying && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-20 rounded-xl flex items-center justify-center">
          <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-2xl border border-white/10">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-medium">Applying AI Background...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">Virtual Backgrounds</span>
        </div>
        {activeBg.id !== 'none' && (
          <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
            Active
          </span>
        )}
      </div>

      {/* Background Options */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PRESET_BACKGROUNDS.map((bg) => (
          <motion.button
            key={bg.id}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => applyBackground({ id: bg.id, blur: activeBg.blur || 10, url: bg.url })}
            aria-label={`Select ${bg.name} background`}
            className={`relative h-20 rounded-xl overflow-hidden transition-all group border ${
              activeBg.id === bg.id
                ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
                : 'border-white/10 hover:border-slate-500 bg-slate-800'
            }`}
          >
            {bg.url && bg.url !== 'blur' && (
              <img src={bg.url} alt={bg.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            )}
            
            {activeBg.id === bg.id && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            {bg.id === 'none' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <X className="w-6 h-6 text-slate-400" />
              </div>
            )}
            
            {bg.id === 'blur' && (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-slate-700/50">
                <Camera className="w-5 h-5 text-slate-300 opacity-50" />
              </div>
            )}
            
            <div className="absolute bottom-0 inset-x-0 py-1 bg-gradient-to-t from-black/80 to-transparent text-[10px] font-semibold text-white text-center z-10">
              {bg.name}
            </div>
          </motion.button>
        ))}

        <AnimatePresence>
          {customBackgrounds.map((custom) => {
            return (
              <motion.button
                key={custom.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyBackground({ id: custom.id, url: custom.url })}
                className={`relative h-20 rounded-xl overflow-hidden transition-all group border ${
                  activeBg.id === custom.id
                    ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
                    : 'border-white/10 hover:border-slate-500 bg-slate-800'
                }`}
              >
                <img src={custom.url} alt="Custom Background" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                
                {activeBg.id === custom.id && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg z-10">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <button 
                  onClick={(e) => removeCustomBackground(custom.id, e)}
                  className="absolute top-1 left-1 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>

                <div className="absolute bottom-0 inset-x-0 py-1 bg-gradient-to-t from-black/80 to-transparent text-[10px] font-semibold text-white text-center z-10">
                  Custom
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Blur Intensity */}
      <AnimatePresence>
      {activeBg.id === 'blur' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-white/5"
        >
          <label className="flex justify-between items-center text-sm font-semibold text-slate-300 mb-3">
            <span>Blur Intensity</span>
          </label>
          <div className="flex gap-2">
            {[
              { label: 'Low', value: 5 },
              { label: 'Medium', value: 12 },
              { label: 'High', value: 20 },
            ].map((level) => (
              <button
                key={level.label}
                onClick={() => applyBackground({ id: 'blur', blur: level.value })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeBg.blur === level.value 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Upload Custom Background */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={uploadCustomBackground}
        className="hidden"
      />

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-200 font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <Upload className="w-4 h-4" />
        Upload Custom Background
      </motion.button>
    </div>
  )
}
