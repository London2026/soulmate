interface Props {
  meeting: {
    id: string
    room_id: string
    other_name: string
    status: string
    created_at: string
    i_requested: boolean
  }
}

export default function MeetingCard({ meeting }: Props) {
  const meetingUrl = `https://meet.jit.si/SoulMate-${meeting.room_id}`

  const timeAgo = (() => {
    const diff = Date.now() - new Date(meeting.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  })()

  return (
    <div
      className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
      style={{
        backgroundColor: 'var(--oxford-navy)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--ivory)' }}>
          {meeting.i_requested ? 'You invited' : 'Invited by'}{' '}
          <span style={{ fontFamily: 'var(--font-playfair), serif' }}>{meeting.other_name}</span>
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--ivory-dim)' }}>
          {timeAgo} · {meeting.status}
        </p>
      </div>

      <a
        href={meetingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, var(--antique-gold-light), var(--antique-gold))',
          color: 'var(--oxford-navy)',
        }}
      >
        🎥 Join
      </a>
    </div>
  )
}
