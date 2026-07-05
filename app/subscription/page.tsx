import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import SubscriptionClient from './SubscriptionClient'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, full_name, created_at, member_id, plan_started_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const p = profile as Record<string, unknown>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07111f' }}>
      <style>{`
        .sub-main { padding: 5.5rem 1.5rem 5rem; }
        @media (max-width: 600px) { .sub-main { padding: 5rem 0.75rem 7rem; } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />
      <Navigation />
      <main className="sub-main" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <SubscriptionClient
          plan={p.plan as string ?? 'free'}
          memberId={p.member_id as string ?? null}
          memberSince={p.created_at as string}
          planStartedAt={p.plan_started_at as string ?? null}
        />
      </main>
      <BottomNav />
    </div>
  )
}
