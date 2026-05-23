import { NextRequest, NextResponse } from 'next/server'
import { sendMeetingDeclinedWhatsApp } from '@/lib/sendWhatsApp'

// Temporary test route — delete after E2E verification
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-test-secret')
  if (secret !== process.env.TEST_WHATSAPP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to, name, decliner, date } = await req.json()
  if (!to) return NextResponse.json({ error: 'Missing "to" phone number' }, { status: 400 })

  await sendMeetingDeclinedWhatsApp(
    to,
    name ?? 'Anup',
    decliner ?? 'Priya S',
    date ?? 'Saturday, 28 June',
  )

  return NextResponse.json({ ok: true, to, sentAt: new Date().toISOString() })
}
