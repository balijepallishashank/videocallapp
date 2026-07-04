import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Square, Download, Clock, Mic, MicOff } from 'lucide-react'
import { uploadFileToCloudinary, saveRecording } from '../../services/db'

interface ScreenRecordingProps {
  videoStream: MediaStream | null
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
  classId?: string
  meetingId?: string
  facultyId?: string
}

interface RecordingItem {
  url: string
  duration: number
  timestamp: Date
  extension: string
}

export default function ScreenRecording({ videoStream, onToast, classId, meetingId, facultyId }: ScreenRecordingProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordAudio, setRecordAudio] = useState(true)
  const [recordings, setRecordings] = useState<RecordingItem[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const currentMimeTypeRef = useRef<string>('video/webm')

  const startRecording = async () => {
    if (!videoStream) {
      onToast('No video stream available', 'error')
      return
    }

    try {
      // Combine video and audio streams
      const audioTracks = recordAudio ? videoStream.getAudioTracks() : []
      const videoTracks = videoStream.getVideoTracks()
      
      const combinedStream = new MediaStream([...videoTracks, ...audioTracks])

      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264',
        'video/webm',
        'video/mp4;codecs=avc1',
        'video/mp4'
      ]

      let selectedMimeType = ''
      for (const mime of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime
          break
        }
      }

      currentMimeTypeRef.current = selectedMimeType || 'video/webm'

      const mediaRecorder = new MediaRecorder(
        combinedStream,
        selectedMimeType ? { mimeType: selectedMimeType } : undefined
      )

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const mime = currentMimeTypeRef.current
        const extension = mime.includes('video/mp4') ? 'mp4' : 'webm'
        const blob = new Blob(chunksRef.current, { type: mime })
        const url = URL.createObjectURL(blob)
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
        
        setRecordings(prev => [...prev, { url, duration, timestamp: new Date(), extension }])
        onToast('Recording saved locally', 'success')

        if (classId && meetingId && facultyId) {
          onToast('Uploading recording to Cloudinary...', 'info')
          try {
            const file = new File([blob], `recording-${meetingId}-${Date.now()}.${extension}`, { type: mime })
            const result = await uploadFileToCloudinary(file)
            
            await saveRecording({
              meetingId,
              classId,
              facultyId,
              recordingUrl: result.url,
              recordingName: `Meeting Recording - ${new Date().toLocaleDateString()}`,
              duration: `${Math.floor(duration / 60)} mins ${duration % 60} secs`,
              size: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
              allowDownload: true,
            })
            onToast('Recording saved to cloud successfully!', 'success')
          } catch (err) {
            console.error('Recording upload failed:', err)
            onToast('Failed to save recording to cloud: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error')
          }
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimeRef.current = Date.now()

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)

      onToast('Recording started', 'success')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Recording error:', error)
      onToast('Failed to start recording: ' + message, 'error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
      }
      onToast('Recording paused', 'info')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
      
      onToast('Recording resumed', 'info')
    }
  }

  const downloadRecording = (recording: RecordingItem, index: number) => {
    const a = document.createElement('a')
    a.href = recording.url
    a.download = `meeting-recording-${index + 1}.${recording.extension}`
    a.click()
    onToast('Recording downloaded', 'success')
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Screen Recording</span>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 text-red-400">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isRecording ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all"
              >
                <Video className="w-4 h-4" />
                Start Recording
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRecordAudio(!recordAudio)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  recordAudio
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300'
                    : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-400'
                }`}
              >
                {recordAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {recordAudio ? 'Audio On' : 'Audio Off'}
              </motion.button>
            </>
          ) : (
            <>
              {!isPaused ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium transition-all"
                >
                  <Clock className="w-4 h-4" />
                  Pause
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resumeRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium transition-all"
                >
                  <Video className="w-4 h-4" />
                  Resume
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-all"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="font-semibold text-white mb-3">Saved Recordings ({recordings.length})</h3>
          <div className="space-y-2">
            {recordings.map((recording, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                  <p className="text-white font-medium">Recording #{index + 1}</p>
                  <p className="text-sm text-slate-400">
                    Duration: {formatTime(recording.duration)} • {recording.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => downloadRecording(recording, index)}
                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
                >
                  <Download className="w-5 h-5" />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
