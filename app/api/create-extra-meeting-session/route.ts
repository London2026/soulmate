import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildFlexformUrl } from '@/lib/ccbill'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const url = buildFlexformUrl('extra_meeting', user.id)
  if (!url) {
    return NextResponse.json({ error: 'Payments are not configured yet. Please check back soon.' }, { status: 503 })
  }

  return NextResponse.json({ url })
}
