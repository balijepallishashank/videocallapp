// src/services/syncChannel.ts

export interface SyncMessage {
  type: string
  payload: any
  senderId: string
  timestamp: number
}

const CHANNEL_NAME = 'university-meet-sync'
let channel: BroadcastChannel | null = null

// Unique session/tab identifier to filter out echo messages
export const LOCAL_SENDER_ID = `sender-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

function getChannel() {
  if (typeof window === 'undefined') return null
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
    } catch (e) {
      console.warn('BroadcastChannel is not supported or accessible in this environment', e)
    }
  }
  return channel
}

export function sendSyncMessage(type: string, payload: any) {
  const syncChan = getChannel()
  if (!syncChan) return

  const message: SyncMessage = {
    type,
    payload,
    senderId: LOCAL_SENDER_ID,
    timestamp: Date.now(),
  }

  try {
    syncChan.postMessage(message)
  } catch (e) {
    console.error('Failed to dispatch sync event', e)
  }
}

export function registerSyncListener(onMessage: (type: string, payload: any, senderId: string) => void): () => void {
  const syncChan = getChannel()
  if (!syncChan) return () => {}

  const handleMessage = (event: MessageEvent<SyncMessage>) => {
    const msg = event.data
    // Only handle valid messages from OTHER tabs
    if (msg && msg.senderId !== LOCAL_SENDER_ID) {
      onMessage(msg.type, msg.payload, msg.senderId)
    }
  }

  syncChan.addEventListener('message', handleMessage)
  return () => {
    syncChan.removeEventListener('message', handleMessage)
  }
}
