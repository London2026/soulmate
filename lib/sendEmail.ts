import { Resend } from 'resend'

const FROM = 'Banduraa <noreply@banduraa.com>'

function resend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// ── Shared email wrapper ─────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  const client = resend()
  if (!client) { console.warn('RESEND_API_KEY not set — email skipped'); return }
  try {
    await client.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('Email send error:', err)
  }
}

// ── Shared HTML wrapper ──────────────────────────────────────────────────────
function wrap(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">

        <!-- Header -->
        <tr><td style="background:#0d1f3c;padding:28px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:0;letter-spacing:0.04em;">Banduraa</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.55);margin:4px 0 0;">✦ Find Your Forever ✦</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">${body}</td></tr>

        <!-- Footer -->
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
</body>
</html>`
}

// ── Email templates ──────────────────────────────────────────────────────────

export async function sendWelcomeSignupEmail(to: string) {
  const subject = `Welcome to Banduraa 🌹 — Let's build your profile`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#0d1f3c;margin:0 0 4px;">Welcome to Banduraa 🌹</h2>
    <p style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#5a6e82;margin:0 0 16px;">Find Your Forever</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.75;margin:0 0 16px;">
      You've taken the first step towards finding a meaningful, lasting connection. We're honoured to have you on Banduraa — a privacy-first matrimony platform built for people who value depth, trust, and genuine compatibility.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.75;margin:0 0 24px;">
      To appear in Discover and start connecting with other members, please complete your profile. It takes just a few minutes and covers 7 simple steps:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${[
        ['1', 'About You', 'Name, age, location'],
        ['2', 'Your Heritage', 'Religion, education, occupation'],
        ['3', 'Preferences', 'Who you are looking for'],
        ['4', 'Voice Intro', 'A short voice message'],
        ['5', 'Your Photos', 'Back-facing photos (private)'],
        ['6', 'Personality', 'Your interests & favourite things'],
        ['7', 'ID Verification', 'Optional — earn a verified tick'],
      ].map(([n, title, desc]) => `
      <tr>
        <td style="width:32px;vertical-align:top;padding:0 0 12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#0d1f3c;border-radius:50%;font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#c9a84c;">${n}</span>
        </td>
        <td style="padding:0 0 12px 10px;">
          <span style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#0d1f3c;">${title}</span>
          <span style="font-family:Georgia,serif;font-size:13px;color:#5a6e82;"> — ${desc}</span>
        </td>
      </tr>`).join('')}
    </table>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://banduraa.com/onboarding" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Complete Your Profile →
      </a>
    </div>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;border-radius:0 6px 6px 0;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.7;margin:0;">
        🔒 <strong style="color:#0d1f3c;">Your privacy is our priority.</strong> Your front-facing photo is hidden from other members until you choose to reveal it. Only you control who sees it.
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendEncouragementEmail(to: string) {
  const subject = `Complete your Banduraa profile — your match is waiting 🌹`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#0d1f3c;margin:0 0 4px;">Welcome back 🌹</h2>
    <p style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#5a6e82;margin:0 0 16px;">Your journey is just beginning</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.75;margin:0 0 16px;">
      We noticed your Banduraa profile is not quite complete yet — and until it is, other members cannot discover you.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.75;margin:0 0 20px;">
      It only takes a few minutes to finish. Once complete, your profile goes live and your matches can find you. Here is what is left:
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 12px;">Your 7-step profile</p>
      ${[
        ['1', 'About You', 'Name, age, location'],
        ['2', 'Your Heritage', 'Religion, education, occupation'],
        ['3', 'Preferences', 'Who you are looking for'],
        ['4', 'Voice Intro', 'A short voice message in your own words'],
        ['5', 'Your Photos', 'Private back-facing photos'],
        ['6', 'Personality', 'Your interests and favourite things'],
        ['7', 'ID Verification', 'Optional — earn a verified tick'],
      ].map(([n, title, desc]) => `
      <p style="font-family:Georgia,serif;font-size:14px;color:#0d1f3c;line-height:1.6;margin:0 0 8px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#0d1f3c;border-radius:50%;font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#c9a84c;vertical-align:middle;margin-right:8px;">${n}</span>
        <strong>${title}</strong> — <span style="color:#5a6e82;">${desc}</span>
      </p>`).join('')}
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://banduraa.com/onboarding" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Finish My Profile →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:14px 18px;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.7;margin:0;">
        🔒 <strong style="color:#0d1f3c;">Your privacy is protected.</strong> Your face photo is hidden from everyone until you choose to reveal it. You are in full control at every step.
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendProfileLiveEmail(to: string, firstName: string, memberId: string) {
  const subject = `🎉 Your Banduraa profile is now live!`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#0d1f3c;margin:0 0 12px;">Your profile is live! 🎉</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.75;margin:0 0 16px;">
      Congratulations, <strong>${firstName}</strong>! Your Banduraa profile is now complete and visible to other members. Your journey towards a meaningful connection begins here.
    </p>

    <div style="background:#0d1f3c;border-radius:8px;padding:20px 24px;margin-bottom:24px;text-align:center;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(201,168,76,0.7);margin:0 0 8px;">Your Unique Member ID</p>
      <p style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#c9a84c;margin:0 0 8px;letter-spacing:0.1em;">${memberId}</p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:rgba(232,227,216,0.55);margin:0;">Please keep this safe — you may need it when contacting Banduraa support.</p>
    </div>

    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 12px;">What you can do next</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.7;margin:0 0 8px;">
        🔍 <strong>Browse Discover</strong> — explore other members' profiles, voice intros, and interests
      </p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.7;margin:0 0 8px;">
        💘 <strong>Reveal a photo</strong> — when someone catches your eye, reveal their front photo and request a video meeting
      </p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.7;margin:0 0 8px;">
        🎥 <strong>Video meetings</strong> — meet potential matches face-to-face in a private, secure video call
      </p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.7;margin:0;">
        🪪 <strong>Get verified</strong> — upload your ID from your profile settings to earn a green verified tick
      </p>
    </div>
    <div style="text-align:center;margin-bottom:28px;">
      <a href="https://banduraa.com/discover" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Discover Members →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.75;margin:0;">
        If you have any questions or need help, simply reply to this email and quote your member ID. Wishing you a beautiful journey on Banduraa. 🌹
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendAdminNewSubscriberEmail(memberName: string, plan: string) {
  const subject = `💳 New subscriber — ${memberName} (${plan})`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">New Subscription</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      A new member has just subscribed to Banduraa.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Subscription Details</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">👤 ${memberName}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">💳 Plan: <strong>${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong></p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://banduraa.com/admin" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        View Admin Panel →
      </a>
    </div>
  `)
  await send('london.anup@gmail.com', subject, html)
}

export async function sendPhotoRevealedEmail(to: string, ownerFirstName: string, viewerProfileId: string) {
  const subject = `💘 Profile #${viewerProfileId} has revealed your photo on Banduraa`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your photo has been revealed</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${ownerFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      Profile <strong style="color:#0d1f3c;font-family:'Courier New',monospace;">#${viewerProfileId}</strong> has revealed your photo on Banduraa.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      You may receive an online video meeting request from this profile. If you would like to view their profile and connect with them, please log in to Banduraa.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;font-style:italic;line-height:1.7;margin:0 0 28px;">
      You can search for Profile <span style="font-family:'Courier New',monospace;font-style:normal;">#${viewerProfileId}</span> directly in the Discover page to view their full profile.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://banduraa.com/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Check Their Profile →
      </a>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingRequestEmail(
  to: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  message: string
) {
  const subject = `📅 ${requesterName} wants to meet you on Banduraa`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">New video meeting request</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${recipientFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#0d1f3c;">${requesterName}</strong> has requested a video meeting with you.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Meeting Details</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 8px;">🕐 ${time}</p>
      ${message ? `<p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;font-style:italic;margin:8px 0 0;">"${message}"</p>` : ''}
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 28px;">
      Log in to accept or decline this request from your profile page.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://banduraa.com/profile" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Respond →
      </a>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingAcceptedEmail(
  to: string,
  requesterFirstName: string,
  acceptorName: string,
  dateStr: string,
  time: string,
  roomId: string
) {
  const meetingUrl = `https://meet.jit.si/Banduraa-${roomId}`
  const subject = `✅ Your video meeting with ${acceptorName} is confirmed`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your meeting is confirmed!</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${requesterFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      Great news — <strong style="color:#0d1f3c;">${acceptorName}</strong> has confirmed your video meeting request.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #4ade80;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin:0 0 8px;">Confirmed Meeting</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${time}</p>
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 20px;">
      At the scheduled time, click the button below to join your private video call.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">💡 Banduraa Safety Advice</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0 0 8px;">
        🪪 <strong>Please keep your ID ready</strong> to show to the other person at the start of the meeting, and <strong>ask to see their ID</strong> before the conversation begins. This helps confirm you are both speaking to verified members.
      </p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0;">
        📵 Banduraa advises you <strong>not to share or ask for a mobile number</strong> during your first meeting, unless you feel completely comfortable doing so.
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingDeclinedEmail(
  to: string,
  requesterFirstName: string,
  declinerName: string,
  dateStr: string,
) {
  const subject = `Your Banduraa meeting request for ${dateStr} was declined`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Meeting request update</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${requesterFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      Unfortunately <strong style="color:#0d1f3c;">${declinerName}</strong> is unavailable for <strong>${dateStr}</strong>. Don&apos;t be disheartened — you can send a new request with a different date, or explore other compatible profiles on Banduraa.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://banduraa.com/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Browse Profiles →
      </a>
    </div>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;border-radius:0 6px 6px 0;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.7;margin:0;">
        The right connection takes patience. Your profile remains live and other members can still discover you. Wishing you the best on your journey. 🌹
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingCancelledEmail(
  to: string,
  recipientFirstName: string,
  cancellerName: string,
  dateStr: string,
) {
  const subject = `Banduraa meeting request for ${dateStr} has been withdrawn`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Meeting request withdrawn</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${recipientFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#0d1f3c;">${cancellerName}</strong> has withdrawn their video meeting request for <strong>${dateStr}</strong>. No action is needed on your part.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 24px;">
      You can continue browsing and connecting with other members in Discover.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://banduraa.com/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Browse Profiles →
      </a>
    </div>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;border-radius:0 6px 6px 0;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.7;margin:0;">
        Your profile remains fully active and other members can still discover you. Wishing you the best on your journey. 🌹
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingConfirmedAcceptorEmail(
  to: string,
  acceptorFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  roomId: string
) {
  const meetingUrl = `https://meet.jit.si/Banduraa-${roomId}`
  const subject = `✅ Your video meeting with ${requesterName} is confirmed`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your meeting is confirmed!</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${acceptorFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      You have confirmed your video meeting with <strong style="color:#0d1f3c;">${requesterName}</strong>. Here are your meeting details and your private link to join.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #4ade80;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin:0 0 8px;">Confirmed Meeting</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${time}</p>
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 20px;">
      At the scheduled time, click the button below to join your private video call.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">💡 Banduraa Safety Advice</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0 0 8px;">
        🪪 <strong>Please keep your ID ready</strong> to show to the other person at the start of the meeting, and <strong>ask to see their ID</strong> before the conversation begins. This helps confirm you are both speaking to verified members.
      </p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0;">
        📵 Banduraa advises you <strong>not to share or ask for a mobile number</strong> during your first meeting, unless you feel completely comfortable doing so.
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendReportNotificationEmail(reporterName: string, reporterMemberId: string, reportedMemberId: string, reason: string, message: string | null) {
  const subject = `🚩 Profile report — ${reportedMemberId} reported by ${reporterMemberId}`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Profile Report Filed</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Report Details</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">👤 Reporter: <strong>${reporterName}</strong> (${reporterMemberId})</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">🚩 Reported profile: <strong>${reportedMemberId}</strong></p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📋 Reason: <strong>${reason}</strong></p>
      ${message ? `<p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">💬 Note: ${message}</p>` : ''}
      <p style="font-family:Georgia,serif;font-size:13px;color:#5a6e82;margin:0;">🕐 ${new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div style="text-align:center;">
      <a href="https://banduraa.com/admin" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Review in Admin Panel →
      </a>
    </div>
  `)
  await send('london.anup@gmail.com', subject, html)
}
