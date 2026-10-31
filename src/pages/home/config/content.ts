import type { ModuleCode } from '@/shared/api/contracts'

/** Sections of the page reached from the header. */
export const NAV_SECTIONS = ['features', 'markets', 'audience', 'plans'] as const

export const FACTS = ['countries', 'exchange', 'world', 'languages'] as const

/** The three uses of spec section 1 and the research marketplace, with their function codes. */
export const FEATURES: readonly {
  id: 'monitoring' | 'analysis' | 'portfolio' | 'research'
  /** The subscription module that opens them; research is in every account. */
  module: ModuleCode | null
  codes: readonly string[]
}[] = [
  { id: 'monitoring', module: 'monitoring', codes: ['MKT', 'DES', 'N', 'CAL', 'ALRT'] },
  { id: 'analysis', module: 'analysis', codes: ['EQS', 'FA', 'YCRV', 'YAS'] },
  { id: 'portfolio', module: 'portfolio', codes: ['PORT'] },
  { id: 'research', module: null, codes: ['PUB', 'PUB NEW'] },
]

/** Each card lists three points: point1, point2 and point3 in the translations. */
export const POINTS = [1, 2, 3] as const

export const TRUST = ['independent', 'secure', 'audited'] as const
