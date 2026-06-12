import { createClient } from '@/lib/supabase/server'
import { buildFlexformUrl, type ProductKey } from '@/lib/ccbill'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { planKey } = await request.json()
  if (planKey !== 'starter' && planKey !== 'standard') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const url = buildFlexformUrl(planKey as ProductKey, user.id)
  if (!url) {
    return NextResponse.json({ error: 'Payments are not configured yet. Please check back soon.' }, { status: 503 })
  }

  return NextResponse.json({ url })
}
