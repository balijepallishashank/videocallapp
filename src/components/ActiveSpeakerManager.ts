import { useEffect, useRef } from 'react'
import { useLayoutStore } from './MeetingLayoutManager'

interface Participant {
  id: string
  name: string
  isMuted: boolean
}

export function useActiveSpeakerDetection(
  localStream: MediaStream | null,
  isMuted: boolean,
  participants: Participant[],
  localUserId: string
) {
  const setActiveSpeakerId = useLayoutStore((state) => state.setActiveSpeakerId)
  const activeSpeakerId = useLayoutStore((state) => state.activeSpeakerId)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const checkIntervalRef = useRef<number | null>(null)
  const mockIntervalRef = useRef<number | null>(null)

  // Real WebRTC audio monitoring for local user speech detection
  useEffect(() => {
    if (!localStream || isMuted) {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      return
    }

    try {
      const audioTracks = localStream.getAudioTracks()
      if (audioTracks.length === 0) return

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioCtx = new AudioContextClass()
      audioContextRef.current = audioCtx

      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioCtx.createMediaStreamSource(localStream)
      sourceRef.current = source
      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      checkIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength

        // Decibel threshold for active speech trigger
        if (average > 15) {
          setActiveSpeakerId(localUserId)
        }
      }, 350)
    } catch (e) {
      console.warn('Speech analyzer initialization skipped or failed:', e)
    }

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [localStream, isMuted, localUserId, setActiveSpeakerId])

  // Mock active speaker switching for other participants
  useEffect(() => {
    mockIntervalRef.current = window.setInterval(() => {
      const eligible = participants.filter((p) => !p.isMuted)
      if (eligible.length === 0) return

      // Fluctuate speaker focus with a 45% probability to feel responsive and natural
      if (Math.random() < 0.45) {
        const randomIndex = Math.floor(Math.random() * eligible.length)
        const speaker = eligible[randomIndex]
        if (speaker) {
          setActiveSpeakerId(speaker.id)
        }
      }
    }, 4500)

    return () => {
      if (mockIntervalRef.current) {
        window.clearInterval(mockIntervalRef.current)
      }
    }
  }, [participants, setActiveSpeakerId])

  return activeSpeakerId
}
