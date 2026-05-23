import { NextRequest, NextResponse } from 'next/server'
import { sendMeetingAcceptedWhatsApp } from '@/lib/sendWhatsApp'

// Temporary test route — delete after E2E verification
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-test-secret')
  if (secret !== process.env.TEST_WHATSAPP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, name, acceptor, date, time, roomId } = await req.json()
  if (!to) return NextResponse.json({ error: 'Missing "to" phone number' }, { status: 400 })

  await sendMeetingAcceptedWhatsApp(
    to,
    name ?? 'Anup',
    acceptor ?? 'Priya S',
    date ?? 'Saturday, 28 June',
    time ?? '3:00pm',
    roomId ?? 'test-room-123',
  )

  return NextResponse.json({ ok: true, to, sentAt: new Date().toISOString() })
}
