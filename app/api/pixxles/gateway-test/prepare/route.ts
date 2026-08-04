import { createClient } from '@/lib/supabase/server'
import { createGatewayTestCheckout } from '@/lib/pixxlesGatewayTest'

const ADMIN_EMAIL = 'london.anup@gmail.com'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { checkoutId, widgetSrc } = await createGatewayTestCheckout()
    return Response.json({ checkoutId, widgetSrc })
  } catch (err) {
    console.error('Gateway test checkout creation failed:', err)
    return Response.json({ error: err instanceof Error ? err.message : 'Could not start checkout.' }, { status: 502 })
  }
}
