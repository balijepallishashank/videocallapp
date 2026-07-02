import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { File, Download, Eye, Trash2, Upload, FileText, Image as ImageIcon, FileVideo } from 'lucide-react'

export interface SharedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedBy: string
  uploadedAt: Date
}

interface FileSharingProps {
  files: SharedFile[]
  onUpload: (file: File) => void
  onDelete: (id: string) => void
  onToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

export default function FileSharing({ files, onUpload, onDelete, onToast }: FileSharingProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />
    if (type.startsWith('video/')) return <FileVideo className="w-5 h-5" />
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      onToast('File size must be less than 50MB', 'error')
      return
    }

    onUpload(file)
    onToast(`${file.name} uploaded successfully!`, 'success')
  }

  const handleDownload = (file: SharedFile) => {
    const a = document.createElement('a')
    a.href = file.url
    a.download = file.name
    a.click()
    onToast('File download started', 'success')
  }

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <File className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">File Sharing ({files.length})</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mb-4 p-6 border-2 border-dashed rounded-xl transition-all ${
          isDragging
            ? 'border-cyan-500 bg-cyan-500/10'
            : 'border-slate-600 hover:border-slate-500'
        }`}
      >
        <div className="text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-300 mb-1">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-xs text-slate-500">Max file size: 50MB</p>

          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-all"
          >
            Browse Files
          </motion.button>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No files shared yet</p>
          </div>
        ) : (
          files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-cyan-400 mt-0.5">{getFileIcon(file.type)}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.size)} • {file.uploadedBy} •{' '}
                    {file.uploadedAt.toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex gap-1">
                  {file.type.startsWith('image/') && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPreviewFile(file)}
                      className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDownload(file)}
                    className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      onDelete(file.id)
                      onToast('File removed', 'info')
                    }}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] max-w-4xl w-full p-4"
            >
              <div className="glass-dark rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-semibold">{previewFile.name}</h3>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="w-full rounded-lg"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
