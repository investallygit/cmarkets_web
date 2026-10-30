/** Lifetimes of spec section 10: access token 15 minutes, refresh token 7 days. */
export const ACCESS_TOKEN_SECONDS = 15 * 60
export const REFRESH_TOKEN_MS = 7 * 24 * 3600_000

/** One-time codes: 6 digits, valid 5 minutes, 5 tries, a new one after 30 seconds. */
export const OTP_LENGTH = 6
export const OTP_VALID_MS = 5 * 60_000
export const OTP_RESEND_MS = 30_000
export const OTP_MAX_ATTEMPTS = 5
/** A password reset code, sent by e-mail, lasts longer. */
export const RESET_CODE_VALID_MS = 15 * 60_000

/** Wrong passwords in a row before the account is locked, and for how long. */
export const LOGIN_MAX_FAILURES = 5
export const LOCKOUT_MS = 15 * 60_000

/** Length of the free trial of a new account (spec section 6). */
export const TRIAL_DAYS = 14

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

/** SHA-256 of the salt and the password: the mock keeps no password in clear. */
export async function hashPassword(salt: string, password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + password))
  return hex(new Uint8Array(digest))
}

/** An unguessable token: refresh tokens, access tokens, challenge ids, salts. */
export function randomToken(bytes = 24): string {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)))
}

/** A one-time code of 6 digits, leading zeros included. */
export function otpCode(): string {
  const [value] = crypto.getRandomValues(new Uint32Array(1))
  return String(value % 10 ** OTP_LENGTH).padStart(OTP_LENGTH, '0')
}

/** "k.atangana@analyst.example" -> "k•••@analyst.example" */
export function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  return `${name.charAt(0)}•••@${domain}`
}

/** "+237 6 70 12 34 56" -> "+237 ••• ••• 56": the country code and the last two digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const country = phone.trim().startsWith('+') ? `+${digits.slice(0, 3)} ` : ''
  return `${country}••• ••• ${digits.slice(-2)}`
}

/** Rules of spec section 12 the server checks: 8 characters, a letter and a digit. */
export function passwordErrors(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push('At least 8 characters.')
  if (!/\p{L}/u.test(password)) errors.push('At least one letter.')
  if (!/\d/.test(password)) errors.push('At least one digit.')
  return errors
}

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

/**
 * A school address (spec section 12: a Student needs an institutional e-mail address or a proof of
 * enrolment): a domain in .edu or .ac.xx, or named after a university, a school or a college.
 */
export function isSchoolEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  const labels = domain.split('.')
  return (
    labels.includes('edu') ||
    /(^|\.)ac\.[a-z]{2}$/.test(domain) ||
    labels.some((label) => /^(univ|ecole|school|college|institut)/.test(label))
  )
}
