async function vonageSend(toPhone: string, body: string) {
  const apiKey    = process.env.VONAGE_API_KEY
  const apiSecret = process.env.VONAGE_API_SECRET

  if (!apiKey || !apiSecret) {
    console.warn('Vonage SMS env vars not set — SMS skipped')
    return
  }

  // US & Canada (+1) don't support alphanumeric sender IDs — skip until a US number is added
  const isNorthAmerica = toPhone.startsWith('+1') || toPhone.startsWith('1')
  if (isNorthAmerica) {
    console.info('SMS skipped for US/CA number (alphanumeric sender not supported):', toPhone)
    return
  }

  const from = 'Banduraa'

  try {
    const res = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ api_key: apiKey, api_secret: apiSecret, from, to: toPhone, text: body }).toString(),
    })
    const json = await res.json() as { messages?: Array<{ status: string; 'error-text'?: string }> }
    const msg = json.messages?.[0]
    if (msg?.status !== '0') {
      console.error('Vonage SMS error:', msg?.['error-text'])
    }
  } catch (err) {
    console.error('Vonage SMS error:', err)
  }
}

export async function sendOnboardingCompleteSMS(toPhone: string, firstName: string) {
  await vonageSend(
    toPhone,
    `Hi ${firstName}, your Banduraa profile is now live. Start browsing matches: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendAdminNewSubscriberSMS(memberName: string, plan: string) {
  const adminPhone = process.env.ADMIN_PHONE
  if (!adminPhone) return
  await vonageSend(
    adminPhone,
    `Banduraa: New subscriber - ${memberName} joined the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan. https://banduraa.com/admin`
  )
}

export async function sendPhotoRevealSMS(toPhone: string, ownerFirstName: string, viewerProfileId: string) {
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${ownerFirstName}, member ${viewerProfileId} has revealed your face photo. If you both like each other's profiles, you will be able to request an online video meeting. Log in: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendLikeSMS(toPhone: string, firstName: string, likerMemberId: string) {
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${firstName}, member ${likerMemberId} has liked your profile. If you like them back, you will both be able to request an online video meeting. Log in to check their profile: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingRequestSMS(
  toPhone: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
) {
  await vonageSend(
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
  await vonageSend(
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
  await vonageSend(
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
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${recipientFirstName}, ${cancellerName} has withdrawn their video meeting request for ${dateStr}. You can still connect with other members: https://banduraa.com/discover\n\nReply STOP to opt out.`
  )
}

export async function sendBillingReminderSMS(toPhone: string, firstName: string, plan: string, amount: string) {
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${firstName}, your ${plan} plan renews soon. $${amount}/month will be charged to your payment method. To manage your subscription visit: https://banduraa.com/pricing\n\nReply STOP to opt out.`
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
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${acceptorFirstName}, your video meeting with ${requesterName} is confirmed for ${dateStr} at ${time}. Join here: https://meet.jit.si/Banduraa-${roomId}\n\nSafety: Keep your ID ready and do not share your phone number unless you feel comfortable.\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingReminderSMS(
  toPhone: string,
  firstName: string,
  otherName: string,
  time: string,
  tzLabel: string,
  minutesBefore: number,
  roomId: string,
) {
  const whenLabel = minutesBefore >= 60 ? '1 hour' : `${minutesBefore} minutes`
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${firstName}, your video meeting with ${otherName} starts in ${whenLabel} at ${time} (${tzLabel}). Join here: https://meet.jit.si/Banduraa-${roomId}\n\nNeed to change it? Visit your profile to reschedule or cancel.\n\nReply STOP to opt out.`
  )
}

export async function sendMeetingRescheduledSMS(
  toPhone: string,
  firstName: string,
  otherName: string,
  dateStr: string,
  time: string,
) {
  await vonageSend(
    toPhone,
    `Banduraa: Hi ${firstName}, ${otherName} changed your video meeting to ${dateStr} at ${time}. View it in your profile: https://banduraa.com/profile\n\nReply STOP to opt out.`
  )
}
