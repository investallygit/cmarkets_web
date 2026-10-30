/** The six CEMAC countries, in the order of the screen 4 mockup (spec section 9). */
export const CEMAC_COUNTRIES = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] as const
export type CemacCountry = (typeof CEMAC_COUNTRIES)[number]

export function isCemacCountry(code: string): code is CemacCountry {
  return CEMAC_COUNTRIES.some((country) => country === code)
}
