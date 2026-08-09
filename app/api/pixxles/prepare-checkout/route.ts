import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckout, PIXXLES_PLAN_PRICES } from '@/lib/pixxles'
import { isOldEnough, UNDERAGE_MESSAGE } from '@/lib/ageVerification'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const dateOfBirth = user.user_metadata?.date_of_birth as string | undefined
  if (!isOldEnough(dateOfBirth)) return Response.json({ error: UNDERAGE_MESSAGE }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const plan = (body as { plan?: string }).plan

  if (!plan || !(plan in PIXXLES_PLAN_PRICES)) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const { checkoutId, widgetSrc } = await createCheckout(user.id, plan)
    return Response.json({ checkoutId, widgetSrc })
  } catch (err) {
    console.error('Pixxles prepare-checkout failed:', err)
    return Response.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 })
  }
}
