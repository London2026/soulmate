import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAIL = 'london.anup@gmail.com'

export async function POST(request: Request) {
  const { name, email, subject, message } = await request.json()

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const timestamp = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })

  const adminHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">
        <tr><td style="background:#0d1f3c;padding:28px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:0;letter-spacing:0.04em;">Banduraa</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.55);margin:4px 0 0;">✦ Support Query ✦</p>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">New Support Query</h2>
          <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
          <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">From</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">👤 ${name}</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📧 <a href="mailto:${email}" style="color:#1b3a6b;">${email}</a></p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📋 <strong>${subject}</strong></p>
            <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;margin:0;">🕐 ${timestamp}</p>
          </div>
          <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Message</p>
          <div style="background:#f9f7f3;border:1px solid rgba(13,31,60,0.1);border-radius:6px;padding:16px 18px;">
            <p style="font-family:Georgia,serif;font-size:15px;color:#2c4a6e;line-height:1.75;margin:0;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="font-family:Georgia,serif;font-size:13px;color:#9aabb8;margin:20px 0 0;">Reply directly to this email to respond to the member.</p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid rgba(13,31,60,0.08);text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#9aabb8;margin:0;">© 2026 Banduraa · Support notification</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const confirmHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">
        <tr><td style="background:#0d1f3c;padding:28px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:0;letter-spacing:0.04em;">Banduraa</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.55);margin:4px 0 0;">✦ Support ✦</p>
        </td></tr>
        <tr><td style="padding:32px 32px 24px;">
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">We've received your message</h2>
          <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
          <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.75;margin:0 0 16px;">
            Hi <strong>${name.split(' ')[0]}</strong>,
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.75;margin:0 0 20px;">
            Thank you for reaching out. We have received your support query and will get back to you within <strong style="color:#0d1f3c;">24 hours</strong>.
          </p>
          <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:24px;border-radius:0 6px 6px 0;">
            <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Your Query</p>
            <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 6px;">📋 ${subject}</p>
            <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;margin:0;line-height:1.65;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.75;margin:0;">
            If you have anything to add, simply reply to this email. We are here to help. 🌹
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid rgba(13,31,60,0.08);text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#9aabb8;margin:0;">
            © 2026 Banduraa · Privacy-first matrimony platform<br>
            <a href="https://banduraa.com/privacy" style="color:#9aabb8;">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="https://banduraa.com/terms" style="color:#9aabb8;">Terms of Service</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  await Promise.all([
    resend.emails.send({
      from: 'Banduraa Support <support@banduraa.com>',
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `🆘 Support: ${subject} — ${name}`,
      html: adminHtml,
    }),
    resend.emails.send({
      from: 'Banduraa Support <support@banduraa.com>',
      to: email,
      replyTo: 'support@banduraa.com',
      subject: `We've received your query — Banduraa Support`,
      html: confirmHtml,
    }),
  ])

  return NextResponse.json({ ok: true })
}
