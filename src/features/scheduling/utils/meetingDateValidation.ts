/**
 * Meeting Date/Time Validation Utilities
 *
 * Used in both ScheduledMeetingForm (UI layer) and db.ts (service layer)
 * to enforce: scheduledDateTime > currentDateTime
 */

/** Returns today's date as YYYY-MM-DD string (for <input type="date" min=...> ) */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns the minimum allowed time string (HH:MM) for a given date string.
 * If the selected date is today, returns the current time + 5 min buffer.
 * Otherwise returns '00:00'.
 */
export function getMinTimeForDate(dateStr: string): string {
  const today = getTodayDateString()
  if (dateStr !== today) return '00:00'

  const now = new Date()
  now.setMinutes(now.getMinutes() + 5) // 5-minute buffer
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Validates that the combined date + time is strictly in the future.
 * Returns true if valid (future), false if in the past or present.
 */
export function isFutureDateTime(dateStr: string, timeStr: string): boolean {
  if (!dateStr || !timeStr) return false
  const combined = new Date(`${dateStr}T${timeStr}`)
  return combined > new Date()
}

/**
 * Returns a formatted human-readable date+time string for display/notifications.
 * e.g., "Wed, 31 Jul 2026" and "09:30 PM"
 */
export function formatScheduledDateTime(isoDate: string): { date: string; time: string } {
  const d = new Date(isoDate)
  const date = d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
  return { date, time }
}

/**
 * Derives a human-readable status label from a scheduled meeting object.
 * Status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled'
 */
export type MeetingStatus = 'Upcoming' | 'Live' | 'Completed' | 'Cancelled'

export function getMeetingStatus(
  scheduledDate: string,
  duration: number = 60,
  status?: string
): MeetingStatus {
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'completed') return 'Completed'

  const now = Date.now()
  const start = new Date(scheduledDate).getTime()
  const end = start + duration * 60_000

  if (now < start) return 'Upcoming'
  if (now >= start && now <= end) return 'Live'
  return 'Completed'
}
