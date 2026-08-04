import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GatewayTestClient from './GatewayTestClient'

const ADMIN_EMAIL = 'london.anup@gmail.com'

export default async function GatewayTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (user.email !== ADMIN_EMAIL) redirect('/discover')

  return <GatewayTestClient />
}
