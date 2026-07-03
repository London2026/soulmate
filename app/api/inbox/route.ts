import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const [notifRes, meetingsRes] = await Promise.all([
    supabase.from('notifications')
      .select('id, message, type, read, created_at, sender_id')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('video_meetings')
      .select('id, room_id, requester_id, status, preferred_date, preferred_time, message, created_at')
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const notifications = notifRes.data ?? []
  const pendingMeetings = meetingsRes.data ?? []

  const senderIds = [...new Set([
    ...notifications.map(n => n.sender_id).filter(Boolean),
    ...pendingMeetings.map(m => m.requester_id),
  ])]

  const senderNames: Record<string, string> = {}
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from('profiles').select('id, full_name').in('id', senderIds)
    for (const s of senders ?? []) senderNames[s.id] = s.full_name ?? 'Someone'
  }

  return NextResponse.json({
    notifications: notifications.map(n => ({
      id: n.id,
      message: n.message,
      type: (n as Record<string, unknown>).type as string ?? 'general',
      read: n.read,
      created_at: n.created_at,
      sender_name: n.sender_id ? (senderNames[n.sender_id] ?? 'Someone') : null,
    })),
    meetings: pendingMeetings.map(m => ({
      id: m.id,
      room_id: m.room_id,
      requester_name: senderNames[m.requester_id] ?? 'Someone',
      requester_id: m.requester_id,
      preferred_date: (m as Record<string, unknown>).preferred_date as string ?? null,
      preferred_time: (m as Record<string, unknown>).preferred_time as string ?? null,
      message: m.message ?? null,
      created_at: m.created_at,
    })),
    unreadCount: notifications.filter(n => !n.read).length + pendingMeetings.length,
  })
}
