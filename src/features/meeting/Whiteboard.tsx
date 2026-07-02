import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Pen, Eraser, Download, Trash2, Undo, Redo } from 'lucide-react'

interface WhiteboardProps {
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'square'

export default function Whiteboard({ onToast }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#3b82f6')
  const [lineWidth, setLineWidth] = useState(3)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    saveState()
  }, [])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return

      setHistoryStep(historyStep - 1)
      ctx.putImageData(history[historyStep - 1], 0, 0)
      onToast('Undo', 'info')
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!ctx || !canvas) return

      setHistoryStep(historyStep + 1)
      ctx.putImageData(history[historyStep + 1], 0, 0)
      onToast('Redo', 'info')
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveState()
    onToast('Whiteboard cleared', 'info')
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whiteboard-${Date.now()}.png`
      a.click()
      onToast('Whiteboard downloaded', 'success')
    })
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveState()
    }
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000']

  return (
    <div className="glass rounded-xl p-5 h-96 flex flex-col space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pen className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white">Whiteboard</span>
        </div>

        <div className="flex gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-all disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={downloadCanvas}
            className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearCanvas}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Tools */}
      <div className="flex gap-2 mb-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTool('pen')}
          className={`p-2 rounded-lg transition-all ${
            tool === 'pen'
              ? 'bg-blue-500/30 text-blue-300'
              : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
          }`}
        >
          <Pen className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-lg transition-all ${
            tool === 'eraser'
              ? 'bg-blue-500/30 text-blue-300'
              : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </motion.button>

        <div className="h-8 w-px bg-slate-600 mx-1" />

        {/* Color Picker */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <motion.button
              key={c}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-all ${
                color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-8 w-px bg-slate-600 mx-1" />

        {/* Line Width */}
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="w-20"
          title="Line width"
        />
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  )
}
