import { http, HttpResponse } from 'msw'
import type {
  ChartDrawingDto,
  ChartDrawingsDto,
  DividendDto,
  HistoryInterval,
  HistoryPointDto,
  IndicatorDto,
  IndicatorType,
  OrderBookDto,
  QuoteDto,
  SearchResultsDto,
  SecurityListItemDto,
  SecurityProfileDto,
  SecuritySearchItemDto,
  ShareholdersDto,
  TradeDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import {
  changePct,
  currentAccountType,
  currentUser,
  readDrawings,
  securities,
  writeDrawings,
  type MockSecurity,
} from '../db'
import { bondOf } from '../fixtures/bonds'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { dayOffset, priceHistory, warmUpDays } from '../lib/bars'
import { publishedDividends } from '../imports'
import { api, latency, noContent, problem } from '../lib/http'
import { bollinger, macd, rsi, sma } from '../lib/indicators'
import { orderBook } from '../lib/orderBook'
import { normalize } from '../lib/text'

const INTERVALS: readonly HistoryInterval[] = ['5m', '30m', '1d', '1w']
const INDICATOR_TYPES: readonly IndicatorType[] = ['SMA', 'BBANDS', 'RSI', 'MACD']
const DEFAULT_PERIOD: Record<IndicatorType, number> = { SMA: 20, BBANDS: 20, RSI: 14, MACD: 26 }
/** Latest trades returned, newest first. */
const TRADES_SHOWN = 20

function searchableWords(security: MockSecurity): string[] {
  const text = normalize(
    [security.code, security.id, security.name, ...(security.aliases ?? [])].join(' '),
  )
  return [...new Set([...text.split(' '), ...text.split(/[\s-]+/)])]
}

function toSearchItem(security: MockSecurity): SecuritySearchItemDto {
  const { id, code, name, type, exchange, country, currency } = security
  return { id, code, name, type, exchange, country, currency }
}

function unknownSecurity(id: unknown) {
  return problem(404, 'Unknown security', `No security ${String(id)}.`)
}

function toProfile(security: MockSecurity): SecurityProfileDto | undefined {
  const profile = PROFILE_FIXTURES[security.id]
  if (!profile) return undefined
  const today = toMarketDay(Date.now())
  const paid = profile.dividends.find((dividend) => dividend.paymentDate <= today)
  return {
    ...toSearchItem(security),
    isin: profile.isin,
    issuer: profile.issuer,
    sector: security.sector,
    sharesOutstanding: profile.sharesOutstanding,
    freeFloatPct: profile.freeFloatPct,
    high52w: profile.high52w,
    low52w: profile.low52w,
    beta1y: profile.beta1y,
    betaIndex: 'BVMAC',
    pe: profile.pe,
    yieldPct: profile.yieldPct,
    lastDividend: paid ? { amount: paid.amount, paymentDate: paid.paymentDate } : null,
    nextEvent: profile.nextEvent,
  }
}

function toQuote(security: MockSecurity): QuoteDto {
  const shares = PROFILE_FIXTURES[security.id]?.sharesOutstanding
  const bond = bondOf(security.id)
  const marketCap = shares
    ? shares * security.last
    : bond
      ? (bond.amountOutstanding * security.last) / 100
      : 0
  return {
    securityId: security.id,
    name: security.name,
    currency: security.currency,
    last: security.last,
    previousClose: security.previousClose,
    change: security.last - security.previousClose,
    changePct: changePct(security.last, security.previousClose),
    open: security.open,
    high: security.high,
    low: security.low,
    volume: security.volume,
    marketCap,
    source: 'FILE',
    // Students see delayed prices (spec section 12).
    isDelayed: currentAccountType() === 'student',
    timestamp: security.updatedAt,
  }
}

function historyRange(query: URLSearchParams) {
  const interval = INTERVALS.find((candidate) => candidate === query.get('interval')) ?? '1d'
  const to = query.get('to') ?? toMarketDay(Date.now())
  return { interval, to, from: query.get('from') ?? to }
}

function indicatorLines(
  type: IndicatorType,
  period: number,
  closes: HistoryPointDto[],
): IndicatorDto['lines'] {
  switch (type) {
    case 'SMA':
      return { value: sma(closes, period) }
    case 'BBANDS':
      return bollinger(closes, period)
    case 'RSI':
      return { value: rsi(closes, period) }
    case 'MACD':
      return macd(closes)
  }
}

function isDrawing(value: unknown): value is ChartDrawingDto {
  const drawing = value as Partial<ChartDrawingDto> | null
  return (
    typeof drawing?.id === 'string' &&
    (drawing.kind === 'horizontal' || drawing.kind === 'trendline')
  )
}

export const securityHandlers = [
  // Each typed word must start a word of the code, name or aliases: "ECMR 6.25 2029", "SCG".
  http.get(api('/search'), async ({ request }) => {
    await latency()
    const words = normalize(new URL(request.url).searchParams.get('q') ?? '')
      .split(' ')
      .filter(Boolean)
    const first = words.at(0) ?? ''
    const matches = [...securities.values()]
      .filter((security) => {
        const candidates = searchableWords(security)
        return (
          words.length > 0 &&
          words.every((word) => candidates.some((candidate) => candidate.startsWith(word)))
        )
      })
      .sort((a, b) => {
        const rank = (security: MockSecurity) =>
          normalize(security.code).startsWith(first) ? 0 : 1
        return rank(a) - rank(b) || a.code.localeCompare(b.code)
      })
    return HttpResponse.json<SearchResultsDto>({
      securities: matches.slice(0, 8).map(toSearchItem),
    })
  }),

  http.get(api('/securities'), async ({ request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const filters = {
      type: query.get('type'),
      sector: query.get('sector'),
      country: query.get('country'),
      exchange: query.get('market'),
    }
    const items = [...securities.values()]
      .filter((security) =>
        Object.entries(filters).every(
          ([field, value]) => !value || security[field as keyof typeof filters] === value,
        ),
      )
      .map((security): SecurityListItemDto => ({
        ...toSearchItem(security),
        sector: security.sector,
      }))
      .sort((a, b) => a.code.localeCompare(b.code))
    return HttpResponse.json(items)
  }),

  http.get(api('/securities/:id'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    const profile = security && toProfile(security)
    if (!profile) return unknownSecurity(params.id)
    return HttpResponse.json<SecurityProfileDto>(profile)
  }),

  http.get(api('/securities/:id/quote'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    return HttpResponse.json<QuoteDto>(toQuote(security))
  }),

  http.get(api('/securities/:id/history'), async ({ params, request }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    const { from, to, interval } = historyRange(new URL(request.url).searchParams)
    return HttpResponse.json(priceHistory(security, from, to, interval))
  }),

  http.get(api('/securities/:id/orderbook'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    if (currentAccountType() === 'student') {
      return problem(403, 'Forbidden', 'The order book is not part of a Student account.')
    }
    return HttpResponse.json<OrderBookDto>(orderBook(security))
  }),

  http.get(api('/securities/:id/trades'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    if (currentAccountType() === 'student') {
      return problem(403, 'Forbidden', 'Intraday data is not part of a Student account.')
    }
    return HttpResponse.json<TradeDto[]>(security.trades.slice(0, TRADES_SHOWN))
  }),

  http.get(api('/securities/:id/dividends'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    // A corporate actions file replaces the sample dividend of the same ex-date.
    const published = publishedDividends(security.id)
    const exDates = new Set(published.map((dividend) => dividend.exDate))
    const dividends = [
      ...published,
      ...(PROFILE_FIXTURES[security.id]?.dividends ?? []).filter(
        (dividend) => !exDates.has(dividend.exDate),
      ),
    ].sort((a, b) => b.exDate.localeCompare(a.exDate))
    return HttpResponse.json<DividendDto[]>(
      dividends.map((dividend) => ({ ...dividend, currency: security.currency })),
    )
  }),

  http.get(api('/securities/:id/shareholders'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    const profile = security && PROFILE_FIXTURES[security.id]
    if (!profile) return unknownSecurity(params.id)
    const shares = profile.sharesOutstanding ?? 0
    return HttpResponse.json<ShareholdersDto>({
      asOf: '2025-12-31',
      items: profile.shareholders.map((holder) => ({
        ...holder,
        shares: Math.round((shares * holder.pct) / 100),
      })),
    })
  }),

  // Computed on a longer history than asked, so the lines start at the first bar shown.
  http.get(api('/indicators/:id'), async ({ params, request }) => {
    await latency()
    const security = securities.get(String(params.id))
    if (!security) return unknownSecurity(params.id)
    const query = new URL(request.url).searchParams
    const type = INDICATOR_TYPES.find((candidate) => candidate === query.get('type'))
    if (!type)
      return problem(400, 'Unknown indicator', `type must be ${INDICATOR_TYPES.join(', ')}.`)
    const period = Number(query.get('period')) || DEFAULT_PERIOD[type]
    const { from, to, interval } = historyRange(query)
    const warmUp = warmUpDays(interval, type === 'MACD' ? 26 + 9 : period)
    const closes = priceHistory(security, dayOffset(from, -warmUp), to, interval).map((bar) => ({
      time: bar.time,
      value: bar.close,
    }))
    const lines = Object.fromEntries(
      Object.entries(indicatorLines(type, period, closes)).map(([name, points]) => [
        name,
        points.filter((point) => toMarketDay(point.time) >= from),
      ]),
    )
    return HttpResponse.json<IndicatorDto>({ type, period, lines })
  }),

  http.get(api('/charts/:id/drawings'), async ({ params }) => {
    await latency()
    const securityId = String(params.id)
    return HttpResponse.json<ChartDrawingsDto>({ securityId, drawings: readDrawings(securityId) })
  }),

  http.put(api('/charts/:id/drawings'), async ({ params, request }) => {
    // "Read" in spec section 12 views the charts without saving drawings.
    if (!currentUser().permissions.includes('analysis:save')) {
      return problem(
        403,
        'Forbidden',
        'This account type views the charts without saving drawings.',
      )
    }
    const body = (await request.json()) as Partial<ChartDrawingsDto>
    if (!Array.isArray(body.drawings) || !body.drawings.every(isDrawing)) {
      return problem(
        400,
        'Invalid drawings',
        'drawings must be a list of trend or horizontal lines.',
      )
    }
    writeDrawings(String(params.id), body.drawings)
    return noContent()
  }),
]
