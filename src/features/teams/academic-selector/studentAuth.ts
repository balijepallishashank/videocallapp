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
): Promise<'created' | 'exists'> => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) throw new Error('Firebase API key is missing')

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

    if (data.error?.message === 'EMAIL_EXISTS') return 'exists'
    if (!res.ok || data.error) {
      // EMAIL_EXISTS is expected on re-upload — skip silently
      if (data.error.message !== 'EMAIL_EXISTS') {
        console.warn(`[registerStudentAccount] ${email}:`, data.error.message)
      }
      throw new Error(data.error?.message || `Account creation failed (${res.status})`)
    }

    // data.localId is the Firebase UID
    if (!data.localId) throw new Error('Firebase did not return a user ID')
    await saveUserProfile(data.localId, { name, email, role: 'student', studentId })
    return 'created'
  } catch (err: unknown) {
    throw err instanceof Error ? err : new Error(String(err))
  }
}
