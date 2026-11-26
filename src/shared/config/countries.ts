/** The six CEMAC countries, in the order of the screen 4 mockup (spec section 9). */
export const CEMAC_COUNTRIES = ['CM', 'GA', 'CG', 'TD', 'CF', 'GQ'] as const
export type CemacCountry = (typeof CEMAC_COUNTRIES)[number]

export function isCemacCountry(code: string): code is CemacCountry {
  return CEMAC_COUNTRIES.some((country) => country === code)
}

/** The three-letter codes the sixth version's mockups write the CEMAC states with ("CMR", "GAB"). */
const CEMAC_CODES3: Readonly<Record<CemacCountry, string>> = {
  CM: 'CMR',
  GA: 'GAB',
  CG: 'COG',
  TD: 'TCD',
  CF: 'CAF',
  GQ: 'GNQ',
}

/** "CMR" for "CM"; another country's code as it comes. */
export function cemacCode3(code: string): string {
  const upper = code.toUpperCase()
  return isCemacCountry(upper) ? CEMAC_CODES3[upper] : code
}
