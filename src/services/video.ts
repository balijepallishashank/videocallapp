/**
 * Agora Video Service
 *
 * Wraps agora-rtc-sdk-ng to provide a simple API for joining/leaving channels
 * and managing local camera/microphone tracks.
 *
 * The App ID is read from VITE_AGORA_APP_ID in .env.local.
 * Token is fetched from the Render token server (VITE_AGORA_TOKEN_SERVER_URL).
 */
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack,
  type ILocalVideoTrack,
  type UID,
} from 'agora-rtc-sdk-ng'

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string | undefined
// Token is fetched from backend (Render.com token server)
export const TOKEN_SERVER_URL = import.meta.env.VITE_AGORA_TOKEN_SERVER_URL as string | undefined

export interface RemoteParticipant {
  uid: UID
  videoTrack?: IRemoteVideoTrack
  audioTrack?: IRemoteAudioTrack
}

// Agora SDK log level: 0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR, 4=NONE
AgoraRTC.setLogLevel(2)

// Keep a single client per channel session; fully reset on leave
let client: IAgoraRTCClient | null = null

export function getAgoraClient(): IAgoraRTCClient {
  if (!client) {
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  }
  return client
}

/**
 * Fetch an RTC token from the token server.
 * Falls back to null (tokenless mode) on any failure.
 */
async function fetchToken(channelName: string, uid: string): Promise<string | null> {
  if (!TOKEN_SERVER_URL) {
    console.warn('[Agora] No VITE_AGORA_TOKEN_SERVER_URL — joining without token (only works if App Certificate is disabled).')
    return null
  }
  try {
    const url = `${TOKEN_SERVER_URL}?channelName=${encodeURIComponent(channelName)}&uid=${encodeURIComponent(uid)}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      console.warn(`[Agora] Token server returned ${response.status}: ${body}`)
      return null
    }
    const data = await response.json()
    if (!data.token) {
      console.warn('[Agora] Token server response missing "token" field:', data)
      return null
    }
    return data.token as string
  } catch (e) {
    console.warn('[Agora] Could not reach token server — joining without token:', e)
    return null
  }
}

export async function joinChannel(
  channelName: string,
  uid: string,
): Promise<{
  localVideoTrack: ICameraVideoTrack | null
  localAudioTrack: IMicrophoneAudioTrack | null
}> {
  if (!APP_ID) {
    console.warn('[Agora] No VITE_AGORA_APP_ID found. Video streaming is disabled.')
    return { localVideoTrack: null, localAudioTrack: null }
  }

  const agoraClient = getAgoraClient()

  // Leave any existing channel before joining a new one
  if (agoraClient.connectionState !== 'DISCONNECTED') {
    try {
      await agoraClient.leave()
    } catch {
      // ignore
    }
  }

  // Fetch a token from the server
  const token = await fetchToken(channelName, uid)

  // Join the channel — use string uid for user accounts
  await agoraClient.join(APP_ID, channelName, token, uid)

  let localVideoTrack: ICameraVideoTrack | null = null
  let localAudioTrack: IMicrophoneAudioTrack | null = null

  try {
    ;[localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
    await agoraClient.publish([localAudioTrack, localVideoTrack])
  } catch (err) {
    console.warn('[Agora] Could not access media devices or publish tracks:', err)
  }

  return { localVideoTrack, localAudioTrack }
}

export async function leaveChannel(
  localVideoTrack: ICameraVideoTrack | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
): Promise<void> {
  try {
    localVideoTrack?.stop()
    localVideoTrack?.close()
  } catch { /* ignore */ }
  try {
    localAudioTrack?.stop()
    localAudioTrack?.close()
  } catch { /* ignore */ }
  if (client) {
    try {
      await client.leave()
    } catch (err) {
      console.warn('[Agora] Error leaving channel:', err)
    }
    client = null
  }
}

export async function createScreenVideoTrack(): Promise<ILocalVideoTrack | null> {
  try {
    // "disable" ensures we only get a video track, no audio from screen
    const screenTrack = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1', optimizationMode: 'detail' }, 'disable')
    return screenTrack as ILocalVideoTrack
  } catch (err) {
    console.error('[Agora] Failed to create screen video track:', err)
    return null
  }
}

export type { ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, ILocalVideoTrack, UID }
