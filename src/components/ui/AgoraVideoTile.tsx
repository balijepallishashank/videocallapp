/**
 * AgoraVideoTile
 *
 * Renders a single participant tile. For the local user it renders a
 * <video> element fed from an ICameraVideoTrack. For remote participants it
 * renders an Agora RemoteVideoTrack via useEffect. Falls back gracefully when
 * Agora is not configured (no App ID).
 */
import { useEffect, useRef } from 'react'
import type { ILocalVideoTrack, IRemoteVideoTrack } from '../../services/video'

interface AgoraVideoTileProps {
  /** Agora video track for the LOCAL user (camera or screen) */
  localVideoTrack?: ILocalVideoTrack | null
  /** Agora video track for a REMOTE user */
  remoteVideoTrack?: IRemoteVideoTrack | null
  /** Fallback MediaStream (used when Agora is not configured) */
  fallbackStream?: MediaStream | null
  className?: string
  fit?: 'cover' | 'contain'
}

export default function AgoraVideoTile({
  localVideoTrack,
  remoteVideoTrack,
  fallbackStream,
  className = '',
  fit = 'cover',
}: AgoraVideoTileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackVideoRef = useRef<HTMLVideoElement>(null)

  // Play Agora local camera track
  useEffect(() => {
    if (!localVideoTrack || !containerRef.current) return
    localVideoTrack.play(containerRef.current, { fit })
    return () => localVideoTrack.stop()
  }, [localVideoTrack, fit])

  // Play Agora remote video track
  useEffect(() => {
    if (!remoteVideoTrack || !containerRef.current) return
    remoteVideoTrack.play(containerRef.current, { fit })
    return () => remoteVideoTrack.stop()
  }, [remoteVideoTrack, fit])

  // Fallback: pipe a plain MediaStream into a <video> element
  useEffect(() => {
    if (!fallbackVideoRef.current || !fallbackStream) return
    fallbackVideoRef.current.srcObject = fallbackStream
  }, [fallbackStream])

  const usingAgora = !!(localVideoTrack || remoteVideoTrack)

  return (
    <div ref={containerRef} className={`w-full h-full object-cover ${className}`}>
      {!usingAgora && fallbackStream && (
        <video
          ref={fallbackVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
    </div>
  )
}
