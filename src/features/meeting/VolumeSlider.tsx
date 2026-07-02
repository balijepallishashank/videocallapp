import { motion } from 'framer-motion'
import { Volume2, Volume1, VolumeX } from 'lucide-react'

interface VolumeSliderProps {
  volume: number
  onChange: (volume: number) => void
}

export default function VolumeSlider({ volume, onChange }: VolumeSliderProps) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="hidden md:flex flex-col items-center gap-4 px-4 py-6 glass-dark rounded-2xl h-fit"
    >
      {/* Label */}
      <div className="text-sm font-semibold text-slate-300">Volume</div>

      {/* Volume Icon */}
      <div className="text-white">
        {volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 50 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </div>

      {/* Vertical Slider */}
      <div className="h-32 flex items-center justify-center">
        <div className="relative h-full flex items-center">
          {/* Track Background */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-700/50 rounded-full" />

          {/* Track Fill */}
          <motion.div
            className="absolute left-0 bottom-0 w-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-full"
            style={{ height: `${volume}%` }}
          />

          {/* Input Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute h-full w-8 appearance-none bg-transparent cursor-pointer z-20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/50 [&::-webkit-slider-thumb]:rotate-90 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>
      </div>

      {/* Volume Percentage */}
      <motion.div
        key={volume}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-lg font-bold text-blue-400"
      >
        {volume}%
      </motion.div>

      {/* Min/Max Labels */}
      <div className="flex flex-col gap-4 text-xs text-slate-400">
        <span className="text-center">High</span>
        <span className="text-center">Low</span>
      </div>
    </motion.div>
  )
}
