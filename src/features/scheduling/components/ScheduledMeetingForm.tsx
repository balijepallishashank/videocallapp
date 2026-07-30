import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import {
  createScheduledMeeting,
  updateScheduledMeeting,
  notifyStudentsOfNewMeeting,
  notifyStudentsOfRescheduledMeeting,
  type ScheduledMeeting,
  type MeetingSettings,
} from '../../../services/db'
import {
  getTodayDateString,
  getMinTimeForDate,
  isFutureDateTime,
  formatScheduledDateTime,
} from '../utils/meetingDateValidation'
import MeetingSettingsPanel from './MeetingSettings'

interface ScheduledMeetingFormProps {
  editingMeeting?: ScheduledMeeting | null
  classesList: Array<{ id: string; name: string; subject?: string }>
  currentUser: { id: string; name: string; role: string }
  onSave: (meetingId: string) => void
  onClose: () => void
  addToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

const DEFAULT_SETTINGS: MeetingSettings = {
  waitingRoom: true,
  allowChat: true,
  allowReactions: true,
  allowHandRaise: true,
  allowStudentMic: true,
  allowStudentCamera: true,
  allowScreenShare: false,
  isLocked: false,
}

export default function ScheduledMeetingForm({
  editingMeeting,
  classesList,
  currentUser,
  onSave,
  onClose,
  addToast,
}: ScheduledMeetingFormProps) {
  const isEditing = Boolean(editingMeeting)

  // Form fields
  const [classId, setClassId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [settings, setSettings] = useState<MeetingSettings>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Prefill form when editing
  useEffect(() => {
    if (editingMeeting) {
      setClassId(editingMeeting.classId || '')
      setTitle(editingMeeting.title || '')
      setDescription(editingMeeting.description || '')
      const schedDate = new Date(editingMeeting.scheduledDate)
      setDate(schedDate.toISOString().split('T')[0])
      // HH:MM from local time
      const hh = String(schedDate.getHours()).padStart(2, '0')
      const mm = String(schedDate.getMinutes()).padStart(2, '0')
      setTime(`${hh}:${mm}`)
      setDuration(String(editingMeeting.duration ?? 60))
      setSettings({ ...DEFAULT_SETTINGS, ...(editingMeeting.settings ?? {}) })
    } else {
      setClassId('')
      setTitle('')
      setDescription('')
      setDate('')
      setTime('')
      setDuration('60')
      setSettings(DEFAULT_SETTINGS)
    }
  }, [editingMeeting])

  const todayStr = getTodayDateString()
  const minTime = getMinTimeForDate(date)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!classId || !title.trim() || !date || !time) {
      addToast('Please fill in all required fields.', 'warning')
      return
    }

    // UI + service layer validation: must be in the future
    if (!isFutureDateTime(date, time)) {
      addToast('Please select a future date and time.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const cls = classesList.find((c) => c.id === classId)
      if (!cls) throw new Error('Selected class not found.')

      const scheduledAt = new Date(`${date}T${time}`)
      const endTime = new Date(scheduledAt.getTime() + Number(duration) * 60_000)

      const { date: friendlyDate, time: friendlyTime } = formatScheduledDateTime(scheduledAt.toISOString())

      const payload: Omit<ScheduledMeeting, 'id' | 'createdAt' | 'updatedAt'> = {
        meetingId: editingMeeting?.meetingId || '',
        classId,
        className: cls.name,
        title: title.trim(),
        description: description.trim(),
        facultyId: currentUser.id,
        facultyName: currentUser.name,
        branch: '',
        year: 0,
        section: '',
        invitedStudents: [],
        scheduledDate: scheduledAt.toISOString(),
        startTime: scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: Number(duration),
        status: 'scheduled',
        settings,
      }

      if (isEditing && editingMeeting) {
        await updateScheduledMeeting(editingMeeting.id, payload)
        addToast('Scheduled meeting updated successfully!', 'success')
        // Notify students of reschedule if date/time changed
        const prevDate = new Date(editingMeeting.scheduledDate).toISOString()
        if (prevDate !== scheduledAt.toISOString()) {
          notifyStudentsOfRescheduledMeeting(
            classId,
            editingMeeting.id,
            title.trim(),
            friendlyDate,
            friendlyTime
          ).catch(() => {/* non-critical */})
        }
        onSave(editingMeeting.id)
      } else {
        const newId = await createScheduledMeeting(payload)
        addToast('Meeting scheduled successfully!', 'success')
        // Notify students
        notifyStudentsOfNewMeeting(
          classId,
          newId,
          title.trim(),
          friendlyDate,
          friendlyTime
        ).catch(() => {/* non-critical */})
        onSave(newId)
      }

      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save scheduled meeting.'
      addToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Scheduled Meeting' : 'Schedule Meeting'}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-2xl font-black text-white">
              {isEditing ? 'Edit Scheduled Meeting' : 'Schedule Meeting'}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {isEditing ? 'Update details for this session.' : 'Set the date and details for a future session.'}
            </p>
          </div>
          <button
            id="close-meeting-form"
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto max-h-[calc(100vh-10rem)] px-6 pb-6">
          <form id="schedule-meeting-form" onSubmit={handleSubmit} className="space-y-4">

            {/* Class */}
            <div className="space-y-1.5">
              <label htmlFor="sm-class" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Class <span className="text-red-400">*</span>
              </label>
              <select
                id="sm-class"
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={isEditing}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Choose class —</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.subject ? ` (${c.subject})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="sm-title" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Meeting Title <span className="text-red-400">*</span>
              </label>
              <input
                id="sm-title"
                type="text"
                required
                placeholder="e.g. Chapter 3 Review Session"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="sm-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Agenda / Description
              </label>
              <textarea
                id="sm-desc"
                placeholder="Topics to cover, syllabus reference, student preparation notes…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="sm-date" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  id="sm-date"
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    // Reset time if date changes to today and current time is past
                    if (e.target.value === todayStr && time && time < getMinTimeForDate(e.target.value)) {
                      setTime('')
                    }
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="sm-time" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <input
                  id="sm-time"
                  type="time"
                  required
                  min={date === todayStr ? minTime : undefined}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label htmlFor="sm-duration" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Duration (minutes) <span className="text-red-400">*</span>
              </label>
              <select
                id="sm-duration"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
              >
                {[15, 30, 45, 60, 90, 120, 150, 180, 240].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}min` : ''}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Settings collapsible */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSettings((s) => !s)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                aria-expanded={showSettings}
                aria-controls="meeting-settings-panel"
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-slate-400" />
                  Meeting Settings
                </span>
                {showSettings ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    id="meeting-settings-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <MeetingSettingsPanel
                      settings={settings}
                      onChange={setSettings}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                id="cancel-meeting-form"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-meeting-form"
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? isEditing ? 'Saving…' : 'Scheduling…'
                  : isEditing ? 'Save Changes' : 'Schedule Meeting'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
