export const MIN_AGE = 18

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--
  return age
}

/** Requires a valid date of birth showing the person is at least MIN_AGE. */
export function isOldEnough(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return false
  return calculateAge(dateOfBirth) >= MIN_AGE
}

export const UNDERAGE_MESSAGE = `You must be at least ${MIN_AGE} years old to create a Banduraa account.`
