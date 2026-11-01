import type {
  AllocationBy,
  AllocationDto,
  AllocationItemDto,
  PositionDto,
  PositionsDto,
} from '@/shared/api/contracts'
import type { MarketData } from './model'
import { daysBetween, round2 } from './units'

/** Allocation of a portfolio by asset class, sector, country or bond maturity. */

const MATURITY_BUCKETS: readonly [key: string, years: number][] = [
  ['0-1', 1],
  ['1-3', 3],
  ['3-5', 5],
  ['5-10', 10],
  ['10+', Infinity],
]

function allocationKey(position: PositionDto, by: AllocationBy, market: MarketData): string {
  switch (by) {
    case 'asset':
      return position.type
    case 'sector':
      return position.sector
    case 'country':
      return position.country
    case 'maturity': {
      const bond = market.bond(position.securityId)
      if (!bond) return 'equity'
      const years = daysBetween(market.today, bond.maturityDate) / 365
      return MATURITY_BUCKETS.find(([, limit]) => years < limit)?.[0] ?? '10+'
    }
  }
}

/** GET /portfolios/{id}/allocation?by= : largest first, cash last. */
export function allocationOf(
  positions: PositionsDto,
  by: AllocationBy,
  market: MarketData,
): AllocationDto {
  const groups = new Map<string, number>()
  for (const position of positions.items) {
    const key = allocationKey(position, by, market)
    groups.set(key, (groups.get(key) ?? 0) + position.value)
  }
  const weight = (value: number) =>
    positions.totalValue > 0 ? (value / positions.totalValue) * 100 : 0
  const items: AllocationItemDto[] = [...groups]
    .map(([key, value]) => ({ key, value: round2(value), weightPct: weight(value) }))
    .sort((a, b) => b.value - a.value)
  if (positions.cash !== 0) {
    items.push({ key: 'cash', value: positions.cash, weightPct: weight(positions.cash) })
  }
  return { by, items }
}
