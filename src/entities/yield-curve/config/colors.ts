import type { CemacCountry } from '@/shared/config/countries'

/** One colour per country, as in the screen 4 mockup: design tokens of spec section 8. */
export const CURVE_COLOR_TOKENS: Record<CemacCountry, `--${string}`> = {
  CM: '--accent-amber',
  GA: '--info',
  CG: '--down',
  TD: '--warning',
  CF: '--text-secondary',
  GQ: '--up',
}
