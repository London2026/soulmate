export const TRIAL_LENGTH_DAYS = 30

/** True once a free-plan member's 30-day trial window has passed. Paid plans never expire this way. */
export function isTrialExpired(plan: string | null | undefined, createdAt: string | null | undefined): boolean {
  if ((plan ?? 'free') !== 'free') return false
  if (!createdAt) return false
  const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  return daysSinceCreation > TRIAL_LENGTH_DAYS
}

export const TRIAL_EXPIRED_MESSAGE = 'Your free trial has ended. Upgrade your plan to continue.'
export const OTHER_TRIAL_EXPIRED_LIKE_MESSAGE = "This member's free trial has ended, so they can't receive new likes right now."
export const OTHER_TRIAL_EXPIRED_MEETING_MESSAGE = "This member's free trial has ended, so video meetings aren't available with them right now."
