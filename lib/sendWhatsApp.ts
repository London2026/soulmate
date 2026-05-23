export async function sendPhotoRevealWhatsApp(toPhone: string, ownerFirstName: string, viewerProfileId: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    console.warn('Twilio env vars not set — WhatsApp skipped')
    return
  }

  // Normalise: strip any existing whatsapp: prefix, then re-add it
  const fromAddr = `whatsapp:${from.replace(/^whatsapp:/, '')}`
  const toAddr   = `whatsapp:${toPhone.replace(/^whatsapp:/, '')}`

  const body = [
    `💘 *Soul Mate* — Hi ${ownerFirstName},`,
    `Profile *#${viewerProfileId}* has revealed your photo.`,
    `They may send you a video meeting request. Log in to view their profile:`,
    `https://soulmate-theta.vercel.app/discover`,
  ].join('\n')

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({ From: fromAddr, To: toAddr, Body: body }).toString(),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      console.error('WhatsApp send error:', text)
    }
  } catch (err) {
    console.error('WhatsApp send error:', err)
  }
}
