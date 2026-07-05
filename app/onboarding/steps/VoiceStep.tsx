'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onEnglishChange: (blob: Blob | null) => void
  onNativeChange:  (blob: Blob | null) => void
  existingEnglishUrl: string | null
  existingNativeUrl:  string | null
}

const c = { navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', rose: '#9e2a2b' }

export default function VoiceStep({ onEnglishChange, onNativeChange, existingEnglishUrl, existingNativeUrl }: Props) {
  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your voice introduction
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 0.5rem' }}>
        Record 30–60 seconds. Let your personality shine before photos.
      </p>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.rose, letterSpacing: '0.05em', margin: '0 0 1rem' }}>
        ✦ An English introduction is required. The mother tongue recording is optional but highly encouraged.
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.5rem' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <RecorderBlock
          label="🇬🇧 English Introduction"
          required
          tip="Mention your name, interests, and what you are looking for."
          existingUrl={existingEnglishUrl}
          onBlobChange={onEnglishChange}
        />
        <RecorderBlock
          label="🗣️ Mother Tongue Introduction"
          required={false}
          tip="Say the same in your mother tongue — it helps others from your community connect with you."
          existingUrl={existingNativeUrl}
          onBlobChange={onNativeChange}
        />
      </div>
    </div>
  )
}

function RecorderBlock({ label, required, tip, existingUrl, onBlobChange }: {
  label: string; required: boolean; tip: string
  existingUrl: string | null
  onBlobChange: (blob: Blob | null) => void
}) {
  const [recording, setRecording]   = useState(false)
  const [seconds, setSeconds]       = useState(0)
  const [newAudioUrl, setNewAudioUrl] = useState<string | null>(null)
  const [denied, setDenied]         = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef   = useRef<BlobPart[]>([])

  // active URL: new recording takes priority over existing
  const activeUrl = newAudioUrl ?? existingUrl
  const hasRecording = !!activeUrl

  useEffect(() => {
    return () => { recorderRef.current?.stream?.getTracks().forEach(t => t.stop()) }
  }, [])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds(s => {
      if (s >= 60) { stopRecording(); return 60 }
      return s + 1
    }), 1000)
    return () => clearInterval(id)
  }, [recording])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      chunksRef.current = []
      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime })
        const url  = URL.createObjectURL(blob)
        setNewAudioUrl(url)
        onBlobChange(blob)
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
    } catch { setDenied(true) }
  }

  function stopRecording() { recorderRef.current?.stop(); setRecording(false) }

  function reRecord() { setNewAudioUrl(null); onBlobChange(null); setSeconds(0) }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ background: 'rgba(139,105,20,0.04)', border: `1px solid rgba(139,105,20,0.18)`, borderRadius: '8px', padding: '1.25rem 1.25rem 1rem' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.navy, margin: 0, flex: 1 }}>
          {label}
        </p>
        {required
          ? <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.rose, background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>Required</span>
          : <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.sepia, background: 'rgba(90,110,130,0.07)', border: '1px solid rgba(90,110,130,0.18)', padding: '0.2rem 0.55rem', borderRadius: '20px' }}>Optional</span>
        }
      </div>

      {denied ? (
        <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(158,42,43,0.05)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '6px' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', color: c.rose, margin: 0 }}>Microphone access denied. Please allow it in your browser settings.</p>
        </div>
      ) : hasRecording ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(139,105,20,0.08)', border: `2px solid ${c.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.6rem' }}>
            🎙️
          </div>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: c.gold, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            {newAudioUrl ? `✓ Recording saved (${fmt(seconds)})` : '✓ Existing recording loaded'}
          </p>
          <audio controls src={activeUrl!} preload="metadata" style={{ width: '100%', marginBottom: '0.75rem', accentColor: c.gold }} />
          <button onClick={reRecord} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: c.sepia, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '0.05em' }}>
            Re-record
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={recording ? stopRecording : startRecording}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem', margin: '0 auto' }}>
            <style>{`
              @keyframes recPulse {
                0%   { box-shadow: 0 0 0 0 rgba(158,42,43,0.45); }
                70%  { box-shadow: 0 0 0 18px rgba(158,42,43,0); }
                100% { box-shadow: 0 0 0 0 rgba(158,42,43,0); }
              }
              .rec-pulse { animation: recPulse 1.6s ease-out infinite; }
              @media (prefers-reduced-motion: reduce) { .rec-pulse { animation: none; } }
            `}</style>
            <div className={recording ? 'rec-pulse' : undefined}
              style={{ width: '80px', height: '80px', borderRadius: '50%', background: recording ? 'rgba(158,42,43,0.08)' : 'rgba(139,105,20,0.08)', border: `2px solid ${recording ? c.rose : c.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', transition: 'all 0.3s' }}>
              {recording ? '⏹' : '🎙️'}
            </div>
            <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: recording ? c.rose : c.gold }}>
              {recording ? 'Stop Recording' : 'Tap to Record'}
            </span>
          </button>

          {recording && (
            <div style={{ marginTop: '1.25rem' }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: c.navy, margin: '0 0 0.4rem' }}>
                {fmt(seconds)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '3px', height: '28px', marginBottom: '0.4rem' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ width: '4px', borderRadius: '2px', background: c.rose, animation: `waveBar${i % 4} 0.${7 + (i % 4)}s ease-in-out infinite alternate` }} />
                ))}
              </div>
              <style>{`
                @keyframes waveBar0 { from { height: 6px; } to { height: 28px; } }
                @keyframes waveBar1 { from { height: 8px; } to { height: 24px; } }
                @keyframes waveBar2 { from { height: 4px; } to { height: 22px; } }
                @keyframes waveBar3 { from { height: 10px; } to { height: 26px; } }
              `}</style>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.sepia, letterSpacing: '0.1em' }}>
                {60 - seconds}s remaining
              </p>
            </div>
          )}

          {!recording && (
            <p style={{ marginTop: '1rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia, fontSize: '0.88rem' }}>
              {tip}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
