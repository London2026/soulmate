'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  back1: File | null; back2: File | null; front: File | null
  onPhotosChange: (b1: File | null, b2: File | null, f: File | null) => void
}

const c = { navy: '#0d1f3c', gold: '#8b6914', sepia: '#5a6e82', textMid: '#2c4a6e' }

export default function PhotosStep({ back1, back2, front, onPhotosChange }: Props) {
  const [p1, setP1] = useState<string | null>(null)
  const [p2, setP2] = useState<string | null>(null)
  const [pf, setPf] = useState<string | null>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const rf = useRef<HTMLInputElement>(null)

  useEffect(() => () => { if (p1) URL.revokeObjectURL(p1); if (p2) URL.revokeObjectURL(p2); if (pf) URL.revokeObjectURL(pf) }, [])

  function pick1(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (p1) URL.revokeObjectURL(p1); setP1(f ? URL.createObjectURL(f) : null)
    onPhotosChange(f, back2, front)
  }
  function pick2(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (p2) URL.revokeObjectURL(p2); setP2(f ? URL.createObjectURL(f) : null)
    onPhotosChange(back1, f, front)
  }
  function pickF(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (pf) URL.revokeObjectURL(pf); setPf(f ? URL.createObjectURL(f) : null)
    onPhotosChange(back1, back2, f)
  }

  return (
    <div>
      <h2 className="ob-step-h2" style={{ color: c.navy, margin: '0 0 0.25rem' }}>
        Your photos
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: '0 0 1rem' }}>
        2 back-side photos for members · 1 face photo revealed only when you choose
      </p>
      <div style={{ height: '1px', background: `linear-gradient(to right, ${c.gold}, transparent)`, marginBottom: '1.25rem' }} />

      {/* Back photos */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.gold }}>
            Back-side Photos
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', padding: '0.15rem 0.5rem', background: 'rgba(139,105,20,0.08)', border: '1px solid rgba(139,105,20,0.25)', color: c.gold, borderRadius: '20px' }}>
            Visible to members
          </span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.sepia, margin: '0 0 0.75rem', fontStyle: 'italic' }}>
          Share a back, silhouette, or side profile — your face stays private here.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <PhotoBox label="Photo 1" preview={p1} inputRef={r1} onChange={pick1} blurred={false} />
          <PhotoBox label="Photo 2" preview={p2} inputRef={r2} onChange={pick2} blurred={false} />
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(13,31,60,0.08)', margin: '0 0 1.25rem' }} />

      {/* Reveal photo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.gold }}>
            Your Reveal Photo
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.1em', padding: '0.15rem 0.5rem', background: 'rgba(13,31,60,0.05)', border: '1px solid rgba(13,31,60,0.15)', color: c.sepia, borderRadius: '20px' }}>
            🔒 Hidden until revealed
          </span>
        </div>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', color: c.sepia, margin: '0 0 0.75rem', fontStyle: 'italic' }}>
          Your face photo. Only visible when you click "Reveal Photo" on someone's profile.
        </p>
        <PhotoBox label="Face photo" preview={pf} inputRef={rf} onChange={pickF} blurred={true} fullWidth />
      </div>
    </div>
  )
}

function PhotoBox({ label, preview, inputRef, onChange, blurred, fullWidth }: {
  label: string; preview: string | null; inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; blurred: boolean; fullWidth?: boolean
}) {
  return (
    <button type="button" onClick={() => inputRef.current?.click()}
      style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: preview ? '1px solid rgba(27,58,107,0.4)' : '1px dashed rgba(13,31,60,0.2)', background: 'rgba(244,241,235,0.4)', cursor: 'pointer', display: 'block', ...(fullWidth ? { aspectRatio: '16/7' } : {}) }}>
      {preview ? (
        <>
          <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: blurred ? 'blur(10px)' : 'none', transform: blurred ? 'scale(1.1)' : 'none' }} />
          {blurred && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,31,60,0.35)' }}>
              <span style={{ fontSize: '1.5rem' }}>🔒</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: '#fff', letterSpacing: '0.1em', marginTop: '0.25rem' }}>Hidden</span>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '6px', right: '6px', padding: '0.2rem 0.5rem', background: 'rgba(13,31,60,0.7)', borderRadius: '3px', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: '#c9a84c', letterSpacing: '0.05em' }}>
            ✓ Uploaded
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.4rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{blurred ? '🔒' : '📷'}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: '#5a6e82', letterSpacing: '0.05em' }}>{label}</span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: 'rgba(90,110,130,0.6)' }}>Tap to upload</span>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
    </button>
  )
}
