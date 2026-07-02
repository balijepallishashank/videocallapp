/**
 * Agora Video Service
 *
 * Wraps agora-rtc-sdk-ng to provide a simple API for joining/leaving channels
 * and managing local camera/microphone tracks.
 *
 * The App ID is read from VITE_AGORA_APP_ID in .env.local.
 * In test/sandbox mode (no certificate), pass token = null.
 */
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteVideoTrack,
  type IRemoteAudioTrack,
  type UID,
} from 'agora-rtc-sdk-ng'

export const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string | undefined

export interface RemoteParticipant {
  uid: UID
  videoTrack?: IRemoteVideoTrack
  audioTrack?: IRemoteAudioTrack
}

let client: IAgoraRTCClient | null = null

export function getAgoraClient(): IAgoraRTCClient {
  if (!client) {
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  }
  return client
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
  // token = null uses testing mode (no certificate required)
  await agoraClient.join(APP_ID, channelName, null, uid)

  let localVideoTrack: ICameraVideoTrack | null = null
  let localAudioTrack: IMicrophoneAudioTrack | null = null

  try {
    ;[localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
    await agoraClient.publish([localAudioTrack, localVideoTrack])
  } catch (err) {
    console.warn('[Agora] Could not access media devices:', err)
  }

  return { localVideoTrack, localAudioTrack }
}

export async function leaveChannel(
  localVideoTrack: ICameraVideoTrack | null,
  localAudioTrack: IMicrophoneAudioTrack | null,
): Promise<void> {
  localVideoTrack?.stop()
  localVideoTrack?.close()
  localAudioTrack?.stop()
  localAudioTrack?.close()
  if (client) {
    await client.leave()
    client = null
  }
}

export type { ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack, UID }
