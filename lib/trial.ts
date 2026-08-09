export const TRIAL_LENGTH_DAYS = 30

/** True once a free-plan member's 30-day trial window has passed. Paid plans never expire this way. */
export function isTrialExpired(plan: string | null | undefined, createdAt: string | null | undefined): boolean {
  if ((plan ?? 'free') !== 'free') return false
  if (!createdAt) return false
  const daysSinceCreation = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  return daysSinceCreation > TRIAL_LENGTH_DAYS
}

export const TRIAL_EXPIRED_MESSAGE = 'Your free trial has ended. Upgrade your plan to continue.'
// Shown to other members, so it deliberately doesn't mention trials, plans, or billing —
// just a respectful, neutral reason the action isn't available right now.
export const OTHER_TRIAL_EXPIRED_LIKE_MESSAGE = "This member isn't currently active on Banduraa, so we're unable to deliver a like to them at this time."
export const OTHER_TRIAL_EXPIRED_MEETING_MESSAGE = "This member isn't currently active on Banduraa, so a video meeting can't be arranged with them at this time."
export const OTHER_TRIAL_EXPIRED_REVEAL_MESSAGE = "This member isn't currently active on Banduraa, so their photo can't be revealed at this time."
