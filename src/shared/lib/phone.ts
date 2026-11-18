/** A phone number: 8 to 15 digits once spaces, dots, dashes and the plus sign are left out. */
export function isPhoneNumber(value: string): boolean {
  return /^\d{8,15}$/.test(value.replace(/[\s.+-]/g, ''))
}

/**
 * A mobile money number of the CEMAC, whose operators take the payments (MTN Mobile Money, Orange
 * Money): its country code, then 8 or 9 digits. Cameroon +237, Gabon +241, Congo +242, Chad +235,
 * the Central African Republic +236, Equatorial Guinea +240 (B71 of ROADMAP step 50: a French
 * number paid a note). The profile's phone, for the codes by SMS, takes any number.
 */
export function isMobileMoneyNumber(value: string): boolean {
  return /^(?:00)?(?:23[5-7]|24[0-2])\d{8,9}$/.test(value.replace(/[\s.+-]/g, ''))
}
