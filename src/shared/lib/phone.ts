/** A phone number: 8 to 15 digits once spaces, dots, dashes and the plus sign are left out. */
export function isPhoneNumber(value: string): boolean {
  return /^\d{8,15}$/.test(value.replace(/[\s.+-]/g, ''))
}
