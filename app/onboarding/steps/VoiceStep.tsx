'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onVoiceChange: (blob: Blob | null) => void
  hasRecording: boolean
}

export default function VoiceStep({ onVoiceChange, hasRecording }: Props) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop()
      }
      recorderRef.current?.stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s >= 60) { stopRecording(); return 60 }
        return s + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [recording])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onVoiceChange(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
    } catch {
      setPermissionDenied(true)
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(false)
  }

  function reRecord() {
    setAudioUrl(null)
    onVoiceChange(null)
    setSeconds(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
        Your voice introduction
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ivory-dim)' }}>
        Record 30–60 seconds. Let your personality shine before photos.
      </p>
      <div
        className="mb-8 h-px"
        style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
      />

      {permissionDenied ? (
        <div className="text-center py-8 rounded-xl" style={{ border: '1px solid rgba(248,113,113,0.3)', backgroundColor: 'rgba(248,113,113,0.05)' }}>
          <p className="text-2xl mb-2">🎙️</p>
          <p className="text-sm" style={{ color: '#F87171' }}>Microphone access denied. Please allow it in your browser settings.</p>
        </div>
      ) : audioUrl ? (
        /* Playback */
        <div className="text-center space-y-6">
          <div
            className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '2px solid var(--antique-gold)' }}
          >
            🎙️
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--antique-gold)' }}>
            ✓ Recording saved ({fmt(seconds)})
          </p>
          <audio controls src={audioUrl} className="w-full rounded-lg" style={{ accentColor: 'var(--antique-gold)' }} />
          <button
            type="button"
            onClick={reRecord}
            className="text-sm underline"
            style={{ color: 'var(--ivory-dim)' }}
          >
            Re-record
          </button>
        </div>
      ) : (
        /* Record */
        <div className="text-center space-y-6">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            className="mx-auto flex flex-col items-center gap-3 group"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-300"
              style={
                recording
                  ? { backgroundColor: 'rgba(239,68,68,0.15)', border: '2px solid #EF4444', animation: 'pulse-ring 2s infinite' }
                  : { backgroundColor: 'rgba(201,168,76,0.1)', border: '2px solid var(--antique-gold)' }
              }
            >
              {recording ? '⏹' : '🎙️'}
            </div>
            <span
              className="text-sm font-medium tracking-wider"
              style={{ color: recording ? '#EF4444' : 'var(--antique-gold)' }}
            >
              {recording ? 'Stop Recording' : hasRecording ? 'Record Again' : 'Tap to Record'}
            </span>
          </button>

          {recording && (
            <div className="space-y-3">
              <p className="text-2xl font-mono font-bold" style={{ color: 'var(--ivory)' }}>
                {fmt(seconds)}
              </p>
              <div className="flex justify-center gap-1 items-end h-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full wave-bar"
                    style={{ background: 'var(--antique-gold)', animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
                {60 - seconds}s remaining
              </p>
            </div>
          )}

          {!recording && (
            <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
              Tip: Mention your name, interests, and what you are looking for.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
