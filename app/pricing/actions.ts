'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { isOldEnough, UNDERAGE_MESSAGE } from '@/lib/ageVerification'

export async function selectPlan(plan: string): Promise<{ error?: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only block when a date of birth is on file and fails the check — accounts
  // created before this field existed have none and must not be locked out.
  const dateOfBirth = user.user_metadata?.date_of_birth as string | undefined
  if (dateOfBirth && !isOldEnough(dateOfBirth)) return { error: UNDERAGE_MESSAGE }

  if (plan === 'free') {
    const email = user.email?.trim().toLowerCase()
    if (email) {
      const admin = createAdminClient()
      const { data: existing } = await admin
        .from('used_free_trial_emails')
        .select('email')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        return { error: 'This email address has already used its free trial. Please choose Starter or Standard to continue.' }
      }

      await admin.from('used_free_trial_emails').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
    }
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    plan,
    plan_started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    date_of_birth: dateOfBirth,
  })

  redirect('/onboarding')
}
