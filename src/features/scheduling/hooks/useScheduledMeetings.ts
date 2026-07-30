import { useEffect, useState } from 'react'
import {
  subscribeToScheduledMeetingsByFacultyId,
  subscribeToScheduledMeetingsByClassIds,
  subscribeToClasses,
  type ScheduledMeeting,
} from '../../../services/db'

interface UseScheduledMeetingsOptions {
  currentUser: { id: string; role: string } | null
}

interface UseScheduledMeetingsResult {
  meetings: ScheduledMeeting[]
  loading: boolean
}

/**
 * Encapsulates all subscription logic for scheduled meetings.
 *
 * Faculty: subscribes with where('facultyId','==',currentUser.id) — matches
 * the Firestore rule so the query is validated correctly and returns data.
 *
 * Student: subscribes with where('classId','in',[...enrolled class IDs]) —
 * also matches the Firestore rule for class membership.
 */
export function useScheduledMeetings({
  currentUser,
}: UseScheduledMeetingsOptions): UseScheduledMeetingsResult {
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const isFaculty = currentUser?.role === 'faculty'

  // For students: get their enrolled class IDs first
  useEffect(() => {
    if (!currentUser || isFaculty) return
    const unsub = subscribeToClasses(
      'student',
      currentUser.id,
      (list) => setEnrolledClasses(list.map((c) => c.id))
    )
    return () => unsub()
  }, [currentUser, isFaculty])

  // Subscribe to meetings using the correctly-filtered queries
  useEffect(() => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    setLoading(true)

    if (isFaculty) {
      // FIXED: Use facultyId-filtered query so Firestore rule (resource.data.facultyId == request.auth.uid)
      // can validate the query correctly — unfiltered collection queries return nothing.
      const unsub = subscribeToScheduledMeetingsByFacultyId(
        currentUser.id,
        (list) => {
          const sorted = [...list].sort(
            (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
          )
          setMeetings(sorted)
          setLoading(false)
        },
        (err) => {
          console.error('useScheduledMeetings faculty error:', err)
          setLoading(false)
        }
      )
      return () => unsub?.()
    }

    // Students: wait until enrolled class IDs are ready
    if (enrolledClasses.length === 0) {
      setMeetings([])
      setLoading(false)
      return
    }

    const unsub = subscribeToScheduledMeetingsByClassIds(
      enrolledClasses,
      (list) => {
        const sorted = [...list].sort(
          (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        )
        setMeetings(sorted)
        setLoading(false)
      },
      (err) => {
        console.error('useScheduledMeetings student error:', err)
        setLoading(false)
      }
    )
    return () => unsub?.()
  }, [currentUser, isFaculty, enrolledClasses])

  return { meetings, loading }
}
