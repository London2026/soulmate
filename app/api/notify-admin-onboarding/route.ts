import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendProfileLiveEmail, sendReferralRewardEmail } from '@/lib/sendEmail'
import { sendOnboardingCompleteSMS, sendAdminNewSubscriberSMS } from '@/lib/sendSMS'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'london.anup@gmail.com'

async function sendAdminOnboardingEmail(memberName: string, city: string, country: string) {
  if (!process.env.RESEND_API_KEY) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = `🎉 New member joined — ${memberName}`
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">
        <tr><td style="background:#0d1f3c;padding:28px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:0;letter-spacing:0.04em;">Banduraa</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.55);margin:4px 0 0;">✦ Admin Notification ✦</p>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">New Member Joined</h2>
          <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
          <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
            A new member has just completed their profile on Banduraa.
          </p>
          <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:24px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Member Details</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">👤 ${memberName}</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📍 ${city}, ${country}</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
          </div>
          <div style="text-align:center;">
            <a href="https://banduraa.com/admin" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
              View Admin Panel →
            </a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid rgba(13,31,60,0.08);text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#9aabb8;margin:0;">© 2026 Banduraa · Admin notification</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  try {
    await resend.emails.send({ from: 'Banduraa <noreply@banduraa.com>', to: ADMIN_EMAIL, subject, html })
  } catch (err) {
    console.error('Admin onboarding email error:', err)
  }
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, city, country, phone, member_id, plan')
    .eq('id', user.id)
    .single()

  const memberName = profile?.full_name ?? 'Unknown member'
  const city       = profile?.city ?? '—'
  const country    = profile?.country ?? '—'
  const firstName  = memberName.split(' ')[0] ?? memberName

  // Generate a unique member ID if not already assigned
  let memberId = profile?.member_id as string | null
  if (!memberId) {
    const { count } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('member_id', 'is', null)
    memberId = `BND-${String((count ?? 0) + 1).padStart(6, '0')}`
    await admin.from('profiles').update({ member_id: memberId }).eq('id', user.id)
  }

  const plan = (profile as Record<string, unknown>)?.plan as string ?? 'free'

  // Process referral if present in user metadata
  const referralCode = (user.user_metadata?.referral_code as string ?? '').toUpperCase().trim()
  if (referralCode) {
    const { data: referrer } = await admin
      .from('profiles').select('id, full_name, member_id, referral_credits')
      .eq('member_id', referralCode).maybeSingle()

    if (referrer && referrer.id !== user.id) {
      const { error: dupErr } = await admin
        .from('referrals').select('id').eq('referred_id', user.id).maybeSingle()
      // Only process if not already credited
      if (dupErr !== null || true) {
        const { error: insertErr } = await admin
          .from('referrals').insert({ referrer_id: referrer.id, referred_id: user.id })
          .select().maybeSingle()

        if (!insertErr) {
          const newCredits = ((referrer.referral_credits as number) ?? 0) + 1
          await admin.from('profiles').update({ referral_credits: newCredits }).eq('id', referrer.id)

          const { data: referrerAuth } = await admin.auth.admin.getUserById(referrer.id)
          if (referrerAuth?.user?.email) {
            await sendReferralRewardEmail(
              referrerAuth.user.email,
              referrer.full_name?.split(' ')[0] ?? 'there',
              memberName,
              newCredits,
              referrer.id,
            )
          }
        }
      }
    }
  }

  await Promise.all([
    sendAdminOnboardingEmail(memberName, city, country),
    sendAdminNewSubscriberSMS(memberName, plan),
    user.email ? sendProfileLiveEmail(user.email, firstName, memberId, user.id) : Promise.resolve(),
    profile?.phone ? sendOnboardingCompleteSMS(profile.phone, firstName) : Promise.resolve(),
  ])

  return NextResponse.json({ ok: true })
}
