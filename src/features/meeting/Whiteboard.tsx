import { useState, useRef, useEffect } from 'react'
import { Pen, Eraser, Download, Trash2, Undo, Redo, Type, MousePointer2, ArrowLeft, Circle, Square as SquareIcon, Minus } from 'lucide-react'
import { saveWhiteboardStroke, clearWhiteboard, subscribeToWhiteboardStrokes } from '../../services/db'

interface WhiteboardProps {
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  onClose?: () => void
  meetingId?: string
  currentUser?: { id: string; name: string }
}

type Tool = 'pen' | 'eraser' | 'text' | 'line' | 'circle' | 'square'

export default function Whiteboard({ onToast, onClose, meetingId, currentUser }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const snapshotRef = useRef<ImageData | null>(null)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const currentPointsRef = useRef<{ x: number; y: number }[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#3b82f6')
  const [lineWidth, setLineWidth] = useState(3)
  const [fontSize, setFontSize] = useState(20)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null)
  const [drawnIds] = useState(() => new Set<string>())

  // Multiplayer cursors are driven by real-time updates — no local mock cursors
  const [cursors] = useState<Array<any>>([])

  useEffect(() => {
    if (!meetingId) return

    const unsubscribe = subscribeToWhiteboardStrokes(meetingId, (strokes) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      // Sort by timestamp
      const sorted = [...strokes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

      sorted.forEach((stroke: any) => {
        if (drawnIds.has(stroke.id)) return
        drawnIds.add(stroke.id)

        ctx.save()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (stroke.type === 'clear') {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else if (stroke.type === 'draw' && stroke.points && stroke.points.length > 1) {
          ctx.beginPath()
          ctx.strokeStyle = stroke.color
          ctx.lineWidth = stroke.lineWidth
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        } else if (stroke.type === 'square' && stroke.points && stroke.points.length === 2) {
          ctx.beginPath()
          ctx.strokeStyle = stroke.color
          ctx.lineWidth = stroke.lineWidth
          const w = stroke.points[1].x - stroke.points[0].x
          const h = stroke.points[1].y - stroke.points[0].y
          ctx.strokeRect(stroke.points[0].x, stroke.points[0].y, w, h)
        } else if (stroke.type === 'circle' && stroke.points && stroke.points.length === 2) {
          ctx.beginPath()
          ctx.strokeStyle = stroke.color
          ctx.lineWidth = stroke.lineWidth
          const radius = Math.sqrt(
            Math.pow(stroke.points[1].x - stroke.points[0].x, 2) +
            Math.pow(stroke.points[1].y - stroke.points[0].y, 2)
          )
          ctx.arc(stroke.points[0].x, stroke.points[0].y, radius, 0, 2 * Math.PI)
          ctx.stroke()
        } else if (stroke.type === 'text' && stroke.points && stroke.points.length === 1 && stroke.textValue) {
          ctx.font = '20px Arial'
          ctx.fillStyle = stroke.color
          ctx.fillText(stroke.textValue, stroke.points[0].x, stroke.points[0].y)
        }
        ctx.restore()
      })
    })

    return () => unsubscribe()
  }, [meetingId, drawnIds])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to fill container
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    saveState()

    // Handle window resize
    const handleResize = () => {
      if (!canvas || !container) return
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0)

      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, 0, 0)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

    if (meetingId) {
      clearWhiteboard(meetingId, currentUser?.id || 'Unknown', currentUser?.name || 'User')
        .catch(err => console.error("Error clearing whiteboard:", err))
    }

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
    startPosRef.current = { x, y }
    lastPosRef.current = { x, y }
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    currentPointsRef.current = [{ x, y }]

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
      if (lastPosRef.current) {
        ctx.beginPath()
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
        ctx.lineTo(x, y)
        ctx.strokeStyle = tool === 'eraser' ? 'white' : color
        ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        currentPointsRef.current.push({ x, y })
        lastPosRef.current = { x, y }
      }
    } else if (startPosRef.current && snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0)
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const startX = startPosRef.current.x
      const startY = startPosRef.current.y

      if (tool === 'line') {
        ctx.moveTo(startX, startY)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else if (tool === 'square') {
        const width = x - startX
        const height = y - startY
        ctx.strokeRect(startX, startY, width, height)
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2))
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI)
        ctx.stroke()
      }
    }
  }

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false)
      const rect = canvasRef.current?.getBoundingClientRect()
      const x = rect ? e.clientX - rect.left : 0
      const y = rect ? e.clientY - rect.top : 0

      if (meetingId) {
        if (tool === 'pen' || tool === 'eraser') {
          saveWhiteboardStroke(meetingId, {
            senderId: currentUser?.id || 'Unknown',
            senderName: currentUser?.name || 'User',
            type: 'draw',
            points: currentPointsRef.current,
            color: tool === 'eraser' ? '#ffffff' : color,
            lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth
          }).catch(err => console.error("Error saving whiteboard stroke:", err))
        } else if (startPosRef.current && (tool === 'line' || tool === 'square' || tool === 'circle')) {
          saveWhiteboardStroke(meetingId, {
            senderId: currentUser?.id || 'Unknown',
            senderName: currentUser?.name || 'User',
            type: tool === 'line' ? 'draw' : tool as any,
            points: [startPosRef.current, { x, y }],
            color,
            lineWidth
          }).catch(err => console.error("Error saving whiteboard shape:", err))
        }
      }

      startPosRef.current = null
      lastPosRef.current = null
      snapshotRef.current = null
      currentPointsRef.current = []
      saveState()
    }
  }

  const addText = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== 'text') return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setTextPosition({ x, y })
    setShowTextInput(true)
    setTextInput('')
  }

  const submitText = () => {
    if (!textInput.trim() || !textPosition) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = color
    ctx.fillText(textInput, textPosition.x, textPosition.y + fontSize)

    if (meetingId) {
      saveWhiteboardStroke(meetingId, {
        senderId: currentUser?.id || 'Unknown',
        senderName: currentUser?.name || 'User',
        type: 'text',
        points: [textPosition],
        color,
        lineWidth: fontSize,
        textValue: textInput
      }).catch(err => console.error("Error saving text stroke:", err))
    }

    saveState()
    setShowTextInput(false)
    setTextInput('')
    onToast('Text added', 'success')
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000']

  const TOOL_BUTTONS = [
    { id: 'pen', icon: Pen, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'square', icon: SquareIcon, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' }
  ] as const;

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* Unified Compact Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/10 shadow-lg z-10">
        {/* Left: Back to Meeting */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Meeting</span>
          </button>
        )}

        {/* Center: Tools */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
            {TOOL_BUTTONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id as Tool)}
                className={`p-2 rounded-lg transition-all ${tool === id
                  ? 'bg-blue-500/30 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block" />

          {/* Color Picker */}
          <div className="flex items-center gap-1.5 bg-slate-800/50 p-2 rounded-xl border border-white/5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'
                  }`}
                style={{ backgroundColor: c }}
                title="Select color"
              />
            ))}
          </div>

          <div className="w-px h-6 bg-slate-800 mx-1 hidden md:block" />

          {/* Stroke Width / Font Size */}
          <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-white/5 min-w-[100px]">
            {tool === 'text' ? (
              <>
                <Type className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-16 sm:w-20 accent-blue-500"
                  title="Font size"
                />
              </>
            ) : (
              <>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-400" style={{ transform: `scale(${lineWidth / 10})` }} />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-16 sm:w-20 accent-blue-500"
                  title="Stroke width"
                />
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-800 mx-1" />
          <button
            onClick={downloadCanvas}
            className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
            title="Download Board"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white overflow-hidden relative" style={{ cursor: tool === 'text' ? 'text' : 'crosshair' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            if (tool === 'text') {
              addText(e)
            } else {
              startDrawing(e)
            }
          }}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />

        {/* Render Floating Cursors */}
        {cursors.map(c => (
          <div key={c.id} className="absolute top-0 left-0 pointer-events-none transition-transform duration-75 z-20" style={{ transform: `translate(${c.x}px, ${c.y}px)` }}>
            <MousePointer2 className="w-5 h-5 drop-shadow-md" style={{ color: c.color, fill: c.color }} />
            <div className="text-white text-[10px] px-2 py-0.5 rounded shadow-lg mt-1 ml-4 whitespace-nowrap" style={{ backgroundColor: c.color }}>{c.name}</div>
          </div>
        ))}

        {/* Text Input Modal */}
        {showTextInput && textPosition && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-50">
            <div className="bg-slate-800 p-6 rounded-lg border border-white/20 shadow-xl">
              <label className="block text-sm font-medium text-white mb-3">Enter text:</label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitText()}
                autoFocus
                placeholder="Type your text..."
                className="w-80 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowTextInput(false)}
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitText}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  Add Text
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
