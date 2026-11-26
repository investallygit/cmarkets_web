import type { BeacDecisionDto, InterbankTenor, MonetaryIndicator } from '@/shared/api/contracts'

/** The tone of a BEAC figure: a cut eases (green), a hike tightens (red), as the mockup colours them. */
export type BeacTone = 'up' | 'down' | 'neutral'

/** A decision: unchanged, or the policy rate's change; null for a meeting announced or the first. */
export type DecisionKind =
  { kind: 'announced' } | { kind: 'unchanged' } | { kind: 'move'; bp: number } | { kind: 'first' }

export function decisionKind(decision: Pick<BeacDecisionDto, 'rates' | 'changeBp'>): DecisionKind {
  if (!decision.rates) return { kind: 'announced' }
  if (decision.changeBp === null) return { kind: 'first' }
  return decision.changeBp === 0 ? { kind: 'unchanged' } : { kind: 'move', bp: decision.changeBp }
}

/** A cut shows green, a hike red, the mockup's colours (a higher rate costs the banks). */
export function rateMoveTone(bp: number | null): BeacTone {
  if (bp === null || bp === 0) return 'neutral'
  return bp > 0 ? 'down' : 'up'
}

/** "+3 bp", "−25 bp", "0 bp"; an empty string without a week or meeting before. */
export function formatBp(bp: number | null, unit: string): string {
  if (bp === null) return ''
  const sign = bp > 0 ? '+' : bp < 0 ? '−' : ''
  return `${sign}${Math.abs(bp)} ${unit}`
}

/** The CEMAC's convergence ceiling on inflation, 3% (the BEAC's target): above it, a warning. */
export const INFLATION_CEILING = 3

/** The order of the interbank panel's tenors, as the mockup lists them. */
export const INTERBANK_TENORS: readonly InterbankTenor[] = ['overnight', '1w', '1m', '3m']

/** How an aggregate's value reads: a growth in percent, a ratio in percent, months of imports. */
export function aggregateUnit(indicator: MonetaryIndicator): 'growth' | 'percent' | 'months' {
  if (indicator === 'fx_reserves') return 'months'
  if (indicator === 'external_coverage' || indicator === 'inflation') return 'percent'
  return 'growth'
}

/** "08/2026" for a month, "2026" for a year, from the period's first day. */
export function periodLabel(period: string, yearly: boolean): string {
  const [year, month] = period.split('-')
  return yearly ? year : `${month}/${year}`
}
