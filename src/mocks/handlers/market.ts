import { http, HttpResponse } from 'msw'
import type {
  FxRateDto,
  HistoryInterval,
  IndexQuoteDto,
  MarketStatusDto,
  MarketSummaryDto,
  MoverDto,
  PolicyRateDto,
  TickerItemDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import {
  changePct,
  currentAccountType,
  indexDailyCloses,
  indices,
  securities,
  type MockIndex,
  type MockSecurity,
} from '../db'
import { BOND_FIXTURES } from '../fixtures/bonds'
import { FX_FIXTURES, POLICY_RATE_FIXTURES } from '../fixtures/market'
import { generateHistory } from '../lib/history'
import { indexHistoryPoints } from '../lib/indexHistory'
import { api, latency, problem } from '../lib/http'

const INTERVALS: readonly HistoryInterval[] = ['5m', '30m', '1d', '1w']

function toIndexQuote(index: MockIndex): IndexQuoteDto {
  return {
    code: index.code,
    name: index.name,
    value: index.value,
    previousClose: index.previousClose,
    change: index.value - index.previousClose,
    changePct: changePct(index.value, index.previousClose),
    timestamp: index.updatedAt,
  }
}

function equities(): MockSecurity[] {
  return [...securities.values()].filter((security) => security.type === 'equity')
}

function toMover(security: MockSecurity): MoverDto {
  return {
    securityId: security.id,
    code: security.code,
    name: security.name,
    type: security.type,
    currency: security.currency,
    last: security.last,
    changePct: changePct(security.last, security.previousClose),
    volume: security.volume,
    // Students see delayed prices (spec section 12).
    isDelayed: currentAccountType() === 'student',
  }
}

/** Bonds trade by number of bonds, quoted per 100 of their nominal. */
function valueTraded(security: MockSecurity): number {
  const nominal = BOND_FIXTURES[security.id]?.nominal
  return nominal
    ? (security.volume * nominal * security.last) / 100
    : security.volume * security.last
}

export const marketHandlers = [
  http.get(api('/market/status'), async () => {
    await latency()
    // The prototype keeps the market open so that real-time updates show at any hour.
    return HttpResponse.json<MarketStatusDto>({
      status: 'open',
      nextOpen: null,
      sources: ['BVMAC', 'BEAC'],
      asOf: new Date().toISOString(),
    })
  }),

  http.get(api('/market/summary'), async () => {
    await latency()
    const all = [...securities.values()]
    const changes = all.map((security) =>
      Math.round((security.last - security.previousClose) * 100),
    )
    return HttpResponse.json<MarketSummaryDto>({
      indices: [...indices.values()].map(toIndexQuote),
      advancers: changes.filter((change) => change > 0).length,
      decliners: changes.filter((change) => change < 0).length,
      unchanged: changes.filter((change) => change === 0).length,
      valueTraded: all.reduce((sum, security) => sum + valueTraded(security), 0),
      currency: 'XAF',
      asOf: new Date().toISOString(),
    })
  }),

  http.get(api('/market/movers'), async ({ request }) => {
    await latency()
    const type = new URL(request.url).searchParams.get('type') ?? 'gainers'
    const movers = equities().map(toMover)
    if (type === 'volume') movers.sort((a, b) => b.volume - a.volume)
    else if (type === 'losers') movers.sort((a, b) => a.changePct - b.changePct)
    else movers.sort((a, b) => b.changePct - a.changePct)
    return HttpResponse.json(movers)
  }),

  http.get(api('/market/ticker'), async () => {
    await latency()
    const main = indices.get('BVMAC-A')
    const items: TickerItemDto[] = equities().map((security) => ({
      kind: 'security',
      symbol: security.id,
      label: security.code,
      type: security.type,
      currency: security.currency,
      last: security.last,
      changePct: changePct(security.last, security.previousClose),
    }))
    if (main) {
      items.unshift({
        kind: 'index',
        symbol: main.code,
        label: main.code,
        type: 'index',
        currency: 'XAF',
        last: main.value,
        changePct: changePct(main.value, main.previousClose),
      })
    }
    return HttpResponse.json(items)
  }),

  http.get(api('/indices'), async () => {
    await latency()
    return HttpResponse.json([...indices.values()].map(toIndexQuote))
  }),

  http.get(api('/indices/:code/history'), async ({ params, request }) => {
    await latency()
    const index = indices.get(String(params.code))
    if (!index) return problem(404, 'Unknown index', `No index ${String(params.code)}.`)
    const query = new URL(request.url).searchParams
    const interval = INTERVALS.find((candidate) => candidate === query.get('interval')) ?? '1d'
    const to = query.get('to') ?? toMarketDay(Date.now())
    const from = query.get('from') ?? to
    // Sessions follow the index's members, so the index and its securities move together.
    if (interval === '1d' || interval === '1w') {
      const closes = indexDailyCloses(index.code, from, to)
      if (closes) return HttpResponse.json(indexHistoryPoints(closes, interval))
    }
    return HttpResponse.json(generateHistory(index.code, index.value, from, to, interval))
  }),

  http.get(api('/rates/policy'), async () => {
    await latency()
    const asOf = toMarketDay(Date.now())
    return HttpResponse.json<PolicyRateDto[]>(
      POLICY_RATE_FIXTURES.map((rate) => ({ ...rate, asOf })),
    )
  }),

  http.get(api('/fx'), async ({ request }) => {
    await latency()
    const pairs = new URL(request.url).searchParams.get('pairs')?.split(',') ?? []
    const timestamp = new Date().toISOString()
    const rates: FxRateDto[] = FX_FIXTURES.filter(
      (fx) => pairs.length === 0 || pairs.includes(fx.pair),
    ).map(({ previousClose, ...fx }) => ({
      ...fx,
      changePct: changePct(fx.value, previousClose),
      timestamp,
    }))
    return HttpResponse.json(rates)
  }),
]
