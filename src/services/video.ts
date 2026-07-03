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
export const APP_CERTIFICATE = import.meta.env.VITE_AGORA_APP_CERTIFICATE as string | undefined

// Helper to generate a temporary token for local testing (only safe if Vite doesn't expose this to the client, but since we are doing this purely client-side for this demo, it's a workaround. In a real production app, this should be fetched from a backend).
async function generateToken(appId: string, appCertificate: string, channelName: string, uid: string): Promise<string> {
  const encoder = new TextEncoder();
  const msg = encoder.encode(appId + channelName + uid);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appCertificate),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, msg);
  // Convert to base64 safely
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => String.fromCharCode(b)).join('');
  return btoa(hashHex);
}

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
  
  let token: string | null = null;
  if (APP_ID && APP_CERTIFICATE) {
    try {
      token = await generateToken(APP_ID, APP_CERTIFICATE, channelName, uid);
    } catch (e) {
      console.warn('[Agora] Failed to generate token, falling back to null', e);
    }
  }

  await agoraClient.join(APP_ID, channelName, token, uid)

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
