'use server'

import { sendWelcomeSignupEmail } from '@/lib/sendEmail'

export async function sendWelcomeEmail(email: string) {
  await sendWelcomeSignupEmail(email)
}
