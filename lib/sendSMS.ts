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
    }
  } catch (err) {
    console.error('SMS send error:', err)
  }
}

export async function sendOnboardingCompleteSMS(toPhone: string, firstName: string) {
  await twilioSend(
    toPhone,
    `Hi ${firstName}, your Banduraa profile is now live. Start browsing matches: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendAdminNewSubscriberSMS(memberName: string, plan: string) {
  const adminPhone = process.env.ADMIN_PHONE
  if (!adminPhone) return
  await twilioSend(
    adminPhone,
    `Banduraa: New subscriber - ${memberName} joined the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. https://banduraa.com/admin`
  )
}

export async function sendPhotoRevealSMS(toPhone: string, ownerFirstName: string) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${ownerFirstName}, someone revealed your photo. They may send you a video meeting request. Log in to view their profile: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingRequestSMS(
  toPhone: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${recipientFirstName}, ${requesterName} has requested a video meeting on ${dateStr} at ${time}. Log in to accept or decline: https://banduraa.com/profile\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingDeclinedSMS(
  toPhone: string,
  requesterFirstName: string,
  declinerName: string,
  dateStr: string,
) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${requesterFirstName}, ${declinerName} is unavailable for ${dateStr}. You can send a new request with a different date: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingAcceptedSMS(
  toPhone: string,
  requesterFirstName: string,
  acceptorName: string,
  dateStr: string,
  time: string,
  roomId: string,
) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${requesterFirstName}, your video meeting with ${acceptorName} is confirmed for ${dateStr} at ${time}. Join here: https://meet.jit.si/Banduraa-${roomId}\n\nSafety: Keep your ID ready and do not share your phone number unless you feel comfortable.\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingCancelledSMS(
  toPhone: string,
  recipientFirstName: string,
  cancellerName: string,
  dateStr: string,
) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${recipientFirstName}, ${cancellerName} has withdrawn their video meeting request for ${dateStr}. You can still connect with other members: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendBillingReminderSMS(toPhone: string, firstName: string, plan: string, amount: string) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${firstName}, your ${plan} plan renews soon. £${amount}/month will be charged to your payment method. To manage your subscription visit: https://banduraa.com/pricing\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingConfirmedAcceptorSMS(
  toPhone: string,
  acceptorFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  roomId: string,
) {
  await twilioSend(
    toPhone,
    `Banduraa: Hi ${acceptorFirstName}, your video meeting with ${requesterName} is confirmed for ${dateStr} at ${time}. Join here: https://meet.jit.si/Banduraa-${roomId}\n\nSafety: Keep your ID ready and do not share your phone number unless you feel comfortable.\n\nReply STOP to opt out.`
  )
}
