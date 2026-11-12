import type {
  EtfAllocationItemDto,
  EtfDistributionItemDto,
  EtfHoldingDto,
  IsoDate,
} from '@/shared/api/contracts'
import { addMonths } from '@/shared/lib/isoDate'

/** The allocation of the screen 19 mockup: its six largest classes, the rest as "Other". */
export const ALLOCATION_SHOWN = 6

export const OTHER = 'other'

/**
 * The classes the allocation shows: the largest first, past the sixth folded with what the source
 * itself calls other into one "Other", last.
 */
export function foldAllocation(
  items: readonly EtfAllocationItemDto[],
  shown = ALLOCATION_SHOWN,
): { key: string; weightPct: number }[] {
  const named = items.filter((item) => item.key !== OTHER)
  const kept = named.slice(0, shown)
  const rest = [...named.slice(shown), ...items.filter((item) => item.key === OTHER)].reduce(
    (sum, item) => sum + item.weightPct,
    0,
  )
  return rest > 0
    ? [...kept.map(({ key, weightPct }) => ({ key, weightPct })), { key: OTHER, weightPct: rest }]
    : kept.map(({ key, weightPct }) => ({ key, weightPct }))
}

/** The lines listed and what they leave out: the other lines and their weight. */
export function holdingsRest(items: readonly EtfHoldingDto[], total: number | null) {
  const listed = items.reduce((sum, item) => sum + item.weightPct, 0)
  const others = (total ?? items.length) - items.length
  return { listed, others, othersPct: others > 0 ? Math.max(0, 100 - listed) : 0 }
}

/** Each line's bar as a share of the largest one's. */
export function barWidths(items: readonly EtfHoldingDto[]): number[] {
  const largest = Math.max(0, ...items.map((item) => item.weightPct))
  return items.map((item) => (largest > 0 ? (item.weightPct / largest) * 100 : 0))
}

/** What the fund paid each calendar year, by ex-date, the latest first. */
export function paidPerYear(
  items: readonly EtfDistributionItemDto[],
): { year: number; amount: number }[] {
  const years = new Map<number, number>()
  for (const item of items) {
    const year = Number(item.exDate.slice(0, 4))
    years.set(year, (years.get(year) ?? 0) + item.amount)
  }
  return [...years.entries()].sort(([a], [b]) => b - a).map(([year, amount]) => ({ year, amount }))
}

/** What went ex over the twelve months to the day (after the same day a year before). */
export function paidOverYear(items: readonly EtfDistributionItemDto[], today: IsoDate): number {
  const since = addMonths(today, -12)
  return items
    .filter((item) => item.exDate > since && item.exDate <= today)
    .reduce((sum, item) => sum + item.amount, 0)
}
