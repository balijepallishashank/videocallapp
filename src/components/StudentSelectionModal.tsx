import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Users, UserCheck, UserPlus, Video, Check } from 'lucide-react'
import IconButton from './IconButton'
import type { StudentRecord, AcademicSection } from './HierarchicalSidebar'

interface StudentSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  section: AcademicSection
  onStartMeeting: (selectedStudents: StudentRecord[], section: AcademicSection) => void
}

export default function StudentSelectionModal({
  isOpen,
  onClose,
  section,
  onStartMeeting,
}: StudentSelectionModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [draggedStudent, setDraggedStudent] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedStudents(new Set(section.students.map((student) => student.id)))
    }
  }, [isOpen, section])

  if (!isOpen) return null

  const toggleStudent = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAll = () => {
    setSelectedStudents(new Set(section.students.map(s => s.id)))
  }

  const selectNone = () => {
    setSelectedStudents(new Set())
  }

  const handleStartMeeting = () => {
    const selected = section.students.filter(student => selectedStudents.has(student.id))
    onStartMeeting(selected.length > 0 ? selected : section.students, section)
  }

  const handleDragStart = (e: React.DragEvent, studentId: string) => {
    setDraggedStudent(studentId)
    e.dataTransfer.setData('text/plain', studentId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const studentId = e.dataTransfer.getData('text/plain')
    if (studentId) {
      toggleStudent(studentId)
    }
    setDraggedStudent(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-400" />
              Start Meeting - {section.name}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Select students to invite to the meeting
            </p>
          </div>
          <IconButton onClick={onClose} ariaLabel="Close student selection dialog" className="p-2 text-slate-400">
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Quick Actions */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Select All ({section.students.length})
            </button>
            <button
              onClick={selectNone}
              className="px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg transition-colors"
            >
              Clear Selection
            </button>
            <div className="text-sm text-slate-400">
              {selectedStudents.size} of {section.students.length} students selected
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Available Students */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                Available Students
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {section.students.map((student) => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, student.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedStudents.has(student.id)
                        ? 'bg-blue-500/20 border-blue-400/30 text-blue-100'
                        : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50'
                    } ${
                      draggedStudent === student.id ? 'opacity-50' : ''
                    }`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-slate-400">{student.id}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            student.status === 'Active'
                              ? 'bg-green-500/20 text-green-400'
                              : student.status === 'At Risk'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {student.attendancePct}%
                        </span>
                        {selectedStudents.has(student.id) && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Students Drop Zone */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                Selected for Meeting ({selectedStudents.size})
              </h3>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`min-h-96 max-h-96 overflow-y-auto p-4 rounded-lg border-2 border-dashed transition-colors ${
                  selectedStudents.size > 0
                    ? 'border-green-400/30 bg-green-500/10'
                    : 'border-slate-600 bg-slate-800/30'
                }`}
              >
                {selectedStudents.size === 0 ? (
                  <div className="text-center text-slate-400 mt-20">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Drag students here or click to select</p>
                    <p className="text-sm">No students selected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {section.students
                      .filter(student => selectedStudents.has(student.id))
                      .map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-green-500/10 border border-green-400/20 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-green-100">
                                  {student.name}
                                </div>
                                <div className="text-xs text-green-300">{student.id}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleStudent(student.id)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                              aria-label={`Remove ${student.name} from selection`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meeting Options */}
          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
            <h4 className="font-medium text-white mb-3">Meeting Settings</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-slate-300">Subject:</label>
                <div className="text-slate-400">{section.subject || 'General Meeting'}</div>
              </div>
              <div>
                <label className="text-slate-300">Faculty:</label>
                <div className="text-slate-400">{section.faculty || 'Not assigned'}</div>
              </div>
              <div>
                <label className="text-slate-300">Duration:</label>
                <div className="text-slate-400">No limit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {selectedStudents.size > 0 && (
              <span>Meeting invite will be sent to {selectedStudents.size} student{selectedStudents.size === 1 ? '' : 's'}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartMeeting}
              disabled={selectedStudents.size === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Start Meeting
              {selectedStudents.size > 0 && `(${selectedStudents.size})`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
