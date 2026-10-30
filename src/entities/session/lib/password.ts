/** Rules of a new password, also checked by the server. */
export const PASSWORD_MIN_LENGTH = 8

export type PasswordIssue = 'length' | 'letter' | 'digit'

/** What a new password lacks: 8 characters at least, with a letter and a digit. */
export function passwordIssues(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = []
  if (password.length < PASSWORD_MIN_LENGTH) issues.push('length')
  if (!/\p{L}/u.test(password)) issues.push('letter')
  if (!/\d/.test(password)) issues.push('digit')
  return issues
}

/** An address of the form name@domain.tld; the server checks it further. */
export function isEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}
