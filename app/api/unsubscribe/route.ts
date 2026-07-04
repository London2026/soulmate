import { type NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function makeToken(userId: string): string {
  return createHmac('sha256', process.env.UNSUBSCRIBE_SECRET ?? 'banduraa-unsub-secret-2026')
    .update(userId).digest('hex').slice(0, 40)
}

const PAGE = (title: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Banduraa</title>
  <style>
    body { margin:0; padding:0; background:#f4f1eb; font-family:Georgia,serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .card { background:#fff; border-radius:10px; box-shadow:0 8px 32px rgba(13,31,60,0.10); max-width:480px; width:90%; overflow:hidden; }
    .head { background:#0d1f3c; padding:28px 32px; text-align:center; }
    .logo { font-size:22px; font-weight:700; color:#c9a84c; letter-spacing:0.04em; margin:0; }
    .sub { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:rgba(201,168,76,0.55); margin:4px 0 0; font-family:Arial,sans-serif; }
    .body { padding:32px; }
    h1 { font-size:20px; color:#0d1f3c; margin:0 0 12px; }
    p { font-size:15px; color:#5a6e82; line-height:1.7; margin:0 0 16px; }
    a { color:#c9a84c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <p class="logo">Banduraa</p>
      <p class="sub">✦ Find Your Forever ✦</p>
    </div>
    <div class="body">
      <h1>${title}</h1>
      ${body}
    </div>
  </div>
</body>
</html>`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? ''
  const token = searchParams.get('token') ?? ''

  if (!id || !token || token !== makeToken(id)) {
    return new NextResponse(
      PAGE('Invalid link', '<p>This unsubscribe link is invalid or has expired. Please contact <a href="https://banduraa.com/support">support</a> if you need help.</p>'),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
    const admin = createAdminClient()
    await admin.from('profiles').update({ email_unsubscribed: true }).eq('id', id)
  } catch (err) {
    console.error('Unsubscribe update error:', err)
    return new NextResponse(
      PAGE('Something went wrong', '<p>We were unable to process your request. Please try again or contact <a href="https://banduraa.com/support">support</a>.</p>'),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new NextResponse(
    PAGE('Unsubscribed', `
      <p>You have been successfully unsubscribed from Banduraa marketing emails.</p>
      <p>You may still receive transactional emails (meeting requests, account security notices) as these are essential to your account.</p>
      <p><a href="https://banduraa.com/discover">Return to Banduraa →</a></p>
    `),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}
