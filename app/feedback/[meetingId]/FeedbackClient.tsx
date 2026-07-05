'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const c = {
  navy: '#0d1f3c', gold: '#c9a84c', ivory: '#f5f0e6',
  sepia: '#5a6e82', border: 'rgba(201,168,76,0.2)', text: '#e8e3d8',
}

const LABELS = ['', 'Not a good fit', 'Somewhat compatible', 'Decent connection', 'Really enjoyed it', 'Exceptional — a great match']

export default function FeedbackClient({
  meetingId, otherFirstName, preferredDate, alreadySubmitted, existingRating, existingNote,
}: {
  meetingId: string; otherFirstName: string; preferredDate: string | null
  alreadySubmitted: boolean; existingRating: number | null; existingNote: string | null
}) {
  const router = useRouter()
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [note, setNote] = useState(existingNote ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(alreadySubmitted)
  const [error, setError] = useState('')

  const dateStr = preferredDate
    ? new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : null

  async function handleSubmit() {
    if (!rating) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/meeting-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, rating, note: note.trim() || null }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{ background: '#0d1f3c', border: `1px solid ${c.border}`, borderRadius: 14, padding: 'clamp(1.25rem, 5vw, 2.5rem) clamp(1rem, 5vw, 2rem)', maxWidth: 480, width: '100%', position: 'relative', zIndex: 1, boxSizing: 'border-box' }}>
      <style>{`@media (max-width: 500px) { .fb-textarea { font-size: 16px !important; } }`}</style>
      {/* Header */}
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.4rem' }}>
        ✦ Banduraa
      </p>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.6rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>
        {done ? 'Thank you' : 'How did it go?'}
      </h1>
      <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)', marginBottom: '1.5rem' }} />

      {done ? (
        <>
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌹</div>
            <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.15rem', color: c.ivory, margin: '0 0 0.75rem', lineHeight: 1.6 }}>
              Your feedback has been saved.
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 2rem' }}>
              Your response is private and helps us improve the quality of matches on Banduraa.
            </p>
          </div>
          <button onClick={() => router.push('/discover')}
            style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Back to Discover
          </button>
        </>
      ) : (
        <>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', color: c.sepia, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
            Your meeting with <strong style={{ color: c.ivory }}>{otherFirstName}</strong>
            {dateStr ? ` on ${dateStr}` : ''} — how did it go?
          </p>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.75rem' }}>
            Your rating (required)
          </p>

          {/* Star rating */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.35rem', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', lineHeight: 1, transition: 'transform 0.1s', transform: (hovered || rating) >= star ? 'scale(1.15)' : 'scale(1)', filter: (hovered || rating) >= star ? 'none' : 'grayscale(100%) opacity(0.3)' }}>
                ★
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.gold, margin: '0 0 1.5rem', minHeight: '1.3rem' }}>
              {LABELS[hovered || rating]}
            </p>
          )}
          {!(hovered || rating) && <div style={{ marginBottom: '1.5rem' }} />}

          {/* Note */}
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.5rem' }}>
            Add a note (optional)
          </p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Anything else you'd like to share about the meeting…"
            maxLength={500}
            rows={3}
            className="fb-textarea"
            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: 6, color: c.ivory, fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: 1.6, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.4rem' }}
            onFocus={e => (e.target.style.borderColor = c.gold)}
            onBlur={e => (e.target.style.borderColor = c.border)}
          />
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', color: c.sepia, margin: '0 0 1.5rem', textAlign: 'right' }}>
            {note.length}/500
          </p>

          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.sepia, margin: '0 0 1.25rem', fontStyle: 'italic' }}>
            Your feedback is completely private and never shared with other members.
          </p>

          {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

          <button onClick={handleSubmit} disabled={!rating || submitting}
            style={{ width: '100%', padding: '0.85rem', background: rating ? 'linear-gradient(135deg,#e8c876,#c9a84c)' : 'rgba(201,168,76,0.15)', color: rating ? '#0d1f3c' : c.sepia, fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', borderRadius: 6, cursor: rating && !submitting ? 'pointer' : 'default', opacity: submitting ? 0.6 : 1, transition: 'all 0.2s' }}>
            {submitting ? 'Saving…' : 'Submit Feedback'}
          </button>
        </>
      )}
    </div>
  )
}
