'use client'

import { useState } from 'react'
import { requestVideoMeeting } from './actions'

export interface Viewer {
  id: string
  full_name: string
  age: number
  city: string
  religion: string
  thumbnail_url: string | null
  meeting_room_id: string | null
  revealed_at: string
}

export default function RevealedByCard({ viewer }: { viewer: Viewer }) {
  const [roomId, setRoomId] = useState<string | null>(viewer.meeting_room_id)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')

  async function handleRequest() {
    setRequesting(true)
    setError('')
    try {
      await requestVideoMeeting(viewer.id, '', '', "I'd love to connect with you!")
      setRoomId('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setRequesting(false)
    }
  }

  const meetingUrl = roomId ? `https://meet.jit.si/SoulMate-${roomId}` : null

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--oxford-navy)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ aspectRatio: '4/3', backgroundColor: 'var(--oxford-navy-mid)' }}>
        {viewer.thumbnail_url ? (
          <img src={viewer.thumbnail_url} alt={viewer.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl" style={{ color: 'var(--antique-gold)' }}>
            👤
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2"
          style={{ background: 'linear-gradient(to top, rgba(14,26,53,0.95), transparent)' }}
        >
          <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
            {viewer.full_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
            {viewer.age} · {viewer.city}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 space-y-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(201,168,76,0.08)', color: 'var(--antique-gold)', border: '1px solid rgba(201,168,76,0.18)' }}
        >
          {viewer.religion}
        </span>

        {error && <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>}

        {meetingUrl ? (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
              color: 'var(--oxford-navy)',
            }}
          >
            🎥 Join Meeting
          </a>
        ) : (
          <button
            onClick={handleRequest}
            disabled={requesting}
            className="w-full py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
            style={{
              border: '1px solid rgba(201,168,76,0.3)',
              color: 'var(--antique-gold)',
              backgroundColor: 'transparent',
            }}
          >
            {requesting ? 'Requesting…' : '📹 Request Meeting'}
          </button>
        )}
      </div>
    </div>
  )
}
