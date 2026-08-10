import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const { plan } = await searchParams
    const next = `/pricing/checkout${plan ? `?plan=${plan}` : ''}`
    redirect(`/login?redirect=${encodeURIComponent(next)}`)
  }

  return <CheckoutClient />
}
