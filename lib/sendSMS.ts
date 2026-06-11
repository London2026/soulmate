async function twilioSend(toPhone: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_SMS_FROM

  if (!accountSid || !authToken || !from) {
    console.warn('Twilio SMS env vars not set — SMS skipped')
    return
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({ From: from, To: toPhone, Body: body }).toString(),
      }
    )
    const json = await res.json() as { sid?: string; status?: string; to?: string; message?: string }
    if (!res.ok) {
      console.error('SMS send error:', JSON.stringify(json))
    } else {
      console.log('SMS sent:', json.sid, 'status:', json.status, 'to:', json.to)
    }
  } catch (err) {
    console.error('SMS send error:', err)
  }
}

export async function sendOnboardingCompleteSMS(toPhone: string, firstName: string) {
  await twilioSend(
    toPhone,
    `Hi ${firstName}, congratulations! 🌹 Your Soul Mate profile is now live. Log in to start browsing matches and take the next step towards finding your forever: https://mysoulmate.live/discover\n\nReply STOP to opt out.`
  )
}
