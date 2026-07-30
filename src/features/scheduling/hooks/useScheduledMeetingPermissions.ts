import type { ScheduledMeeting } from '../../../services/db'

interface CurrentUser {
  id: string
  role: string
}

interface ScheduledMeetingPermissions {
  canCreate: boolean
  canEdit: (meeting: ScheduledMeeting) => boolean
  canDelete: (meeting: ScheduledMeeting) => boolean
  canStart: (meeting: ScheduledMeeting) => boolean
  canView: () => boolean
}

/**
 * Returns permission helpers for scheduled meeting operations.
 * This is the single source of truth for role-based access control in the UI.
 *
 * Note: These permissions are enforced ADDITIONALLY by Firestore rules
 * and assertFacultyRole() in the service layer — never rely on UI alone.
 */
export function useScheduledMeetingPermissions(
  currentUser: CurrentUser | null
): ScheduledMeetingPermissions {
  const isFaculty = currentUser?.role === 'faculty'

  return {
    /** Only faculty can schedule a new meeting */
    canCreate: isFaculty,

    /** Faculty can edit upcoming meetings they own */
    canEdit: (meeting: ScheduledMeeting) =>
      isFaculty && meeting.facultyId === currentUser?.id,

    /** Faculty can delete non-completed meetings they own */
    canDelete: (meeting: ScheduledMeeting) =>
      isFaculty &&
      meeting.facultyId === currentUser?.id &&
      meeting.status !== 'completed',

    /** Faculty can start upcoming or live meetings they own */
    canStart: (meeting: ScheduledMeeting) =>
      isFaculty && meeting.facultyId === currentUser?.id,

    /** All authenticated users can view scheduled meetings */
    canView: () => Boolean(currentUser),
  }
}
