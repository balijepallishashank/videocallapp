import { saveUserProfile } from '../../../services/db'

/**
 * Generates a random 10-character password.
 */
export const generatePassword = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
  let p = ''
  for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length))
  return p
}

/**
 * Derives a deterministic student email from their student ID.
 */
export const studentEmail = (studentId: string): string =>
  `${studentId.toLowerCase().replace(/\s+/g, '')}@student.edu`

/**
 * Registers a student via the Firebase Auth REST API (no secondary app needed).
 * Saves the Firestore profile on success.
 * Silently ignores 'email already in use' errors.
 */
export const registerStudentAccount = async (
  name: string,
  studentId: string,
  email: string,
  password: string,
): Promise<void> => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: false }),
      }
    )
    const data = await res.json()

    if (data.error) {
      // EMAIL_EXISTS is expected on re-upload — skip silently
      if (data.error.message !== 'EMAIL_EXISTS') {
        console.warn(`[registerStudentAccount] ${email}:`, data.error.message)
      }
      return
    }

    // data.localId is the Firebase UID
    if (data.localId) {
      await saveUserProfile(data.localId, { name, email, role: 'student', studentId })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(`[registerStudentAccount] ${email}:`, msg)
  }
}
