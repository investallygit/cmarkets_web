import { http, HttpResponse } from 'msw'
import type {
  ComparisonItemDto,
  FinancialStatement,
  FinancialStatementDto,
  RatiosDto,
  SavedScreenDto,
  SavedScreenInputDto,
  ScreenerRequestDto,
  ScreenerResultDto,
  ScreenerRowDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import {
  changePct,
  currentAccountType,
  savedScreenStore,
  securities,
  type MockSecurity,
} from '../db'
import {
  FISCAL_YEARS,
  FUNDAMENTALS_BY_ID,
  lineGrowth,
  ratiosAt,
  revenueGrowth,
  SECTOR_AVERAGES,
  type Fundamentals,
} from '../fixtures/fundamentals'
import { PROFILE_FIXTURES } from '../fixtures/profiles'
import { dayOffset, priceHistory } from '../lib/bars'
import { api, latency, noContent, problem } from '../lib/http'
import { meetsCriterion, readCriteria, type ScreenerValues } from '../lib/screener'

const STATEMENTS: readonly FinancialStatement[] = ['income', 'balance', 'cashflow']
const MAX_NAME_LENGTH = 40
const MAX_COMPARED = 20

/** The equities with published accounts, and their accounts. */
function equities(): [MockSecurity, Fundamentals][] {
  return [...securities.values()].flatMap((security) => {
    const fundamentals = FUNDAMENTALS_BY_ID.get(security.id)
    return fundamentals ? [[security, fundamentals] as [MockSecurity, Fundamentals]] : []
  })
}

/** Against the last close a year ago (or the session before it). */
function oneYearChange(security: MockSecurity): number | null {
  const yearAgo = dayOffset(toMarketDay(Date.now()), -365)
  const close = priceHistory(security, dayOffset(yearAgo, -7), yearAgo, '1d').at(-1)?.close
  return close ? Number(changePct(security.last, close).toFixed(1)) : null
}

function screenerRow(security: MockSecurity, fundamentals: Fundamentals): ScreenerRowDto {
  const ratios = ratiosAt(fundamentals, security.last)
  return {
    securityId: security.id,
    code: security.code,
    name: security.name,
    sector: security.sector,
    country: security.country,
    currency: security.currency,
    last: security.last,
    changePct: changePct(security.last, security.previousClose),
    // Students see delayed prices (spec section 12).
    isDelayed: currentAccountType() === 'student',
    marketCap: fundamentals.sharesOutstanding * security.last,
    pe: ratios.pe,
    dividendYield: ratios.dividendYield,
    roe: ratios.roe,
    netDebtToEquity: ratios.netDebtToEquity,
    change1y: oneYearChange(security),
    priceToBook: ratios.priceToBook,
    netMargin: ratios.netMargin,
    revenueGrowth: revenueGrowth(fundamentals),
    beta: PROFILE_FIXTURES[security.id]?.beta1y ?? null,
  }
}

function screenerValues(security: MockSecurity, row: ScreenerRowDto): ScreenerValues {
  return { ...row, market: security.exchange }
}

function readName(value: unknown): string | null {
  const name = typeof value === 'string' ? value.trim() : ''
  return name === '' || name.length > MAX_NAME_LENGTH ? null : name
}

const noAccounts = (id: unknown) =>
  problem(404, 'No financial statements', `No accounts are published for ${String(id)}.`)

export const analysisHandlers = [
  http.post(api('/analysis/screener'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<ScreenerRequestDto>
    const read = readCriteria(body.criteria)
    if ('errors' in read) return problem(400, 'Invalid criteria', undefined, read.errors)
    const market = read.criteria.find((criterion) => criterion.field === 'market')
    const universe = equities()
      .map(([security, fundamentals]) => {
        const row = screenerRow(security, fundamentals)
        return { row, values: screenerValues(security, row) }
      })
      .filter(({ values }) => !market || meetsCriterion(values, market))
    const items = universe
      .filter(({ values }) => read.criteria.every((criterion) => meetsCriterion(values, criterion)))
      .map(({ row }) => row)
      .sort((a, b) => b.marketCap - a.marketCap)
    return HttpResponse.json<ScreenerResultDto>({ universe: universe.length, items })
  }),

  http.get(api('/analysis/screens'), async () => {
    await latency()
    return HttpResponse.json<SavedScreenDto[]>(savedScreenStore.read())
  }),

  http.post(api('/analysis/screens'), async ({ request }) => {
    await latency()
    const body = (await request.json()) as Partial<SavedScreenInputDto>
    const name = readName(body.name)
    const read = readCriteria(body.criteria)
    const errors = {
      ...(name ? {} : { name: [`Between 1 and ${MAX_NAME_LENGTH} characters.`] }),
      ...('errors' in read ? read.errors : {}),
    }
    if (!name || 'errors' in read) return problem(400, 'Invalid screen', undefined, errors)
    const screen: SavedScreenDto = {
      id: `screen-${Date.now().toString(36)}`,
      name,
      criteria: read.criteria,
    }
    savedScreenStore.write([...savedScreenStore.read(), screen])
    return HttpResponse.json(screen, { status: 201 })
  }),

  http.delete(api('/analysis/screens/:id'), async ({ params }) => {
    await latency()
    const screens = savedScreenStore.read()
    if (!screens.some((screen) => screen.id === params.id)) {
      return problem(404, 'Screen not found', `No saved screen ${String(params.id)}.`)
    }
    savedScreenStore.write(screens.filter((screen) => screen.id !== params.id))
    return noContent()
  }),

  // Unknown ids and securities without accounts are left out.
  http.get(api('/analysis/compare'), async ({ request }) => {
    await latency()
    const ids = (new URL(request.url).searchParams.get('ids') ?? '')
      .split(',')
      .filter(Boolean)
      .slice(0, MAX_COMPARED)
    const items = ids.flatMap((id): ComparisonItemDto[] => {
      const security = securities.get(id)
      const fundamentals = FUNDAMENTALS_BY_ID.get(id)
      if (!security || !fundamentals) return []
      const { code, name, sector } = security
      return [{ securityId: id, code, name, sector, ratios: ratiosAt(fundamentals, security.last) }]
    })
    return HttpResponse.json(items)
  }),

  http.get(api('/securities/:id/ratios'), async ({ params }) => {
    await latency()
    const security = securities.get(String(params.id))
    const fundamentals = FUNDAMENTALS_BY_ID.get(String(params.id))
    if (!security || !fundamentals) return noAccounts(params.id)
    const sectorAverages = SECTOR_AVERAGES[security.sector]
    return HttpResponse.json<RatiosDto>({
      securityId: security.id,
      sector: security.sector,
      fiscalYear: FISCAL_YEARS[FISCAL_YEARS.length - 1],
      ratios: ratiosAt(fundamentals, security.last),
      sectorAverages: sectorAverages ?? ratiosAt(fundamentals, security.last),
    })
  }),

  http.get(api('/securities/:id/financials'), async ({ params, request }) => {
    await latency()
    const query = new URL(request.url).searchParams
    const statement = STATEMENTS.find((candidate) => candidate === query.get('statement'))
    if (!statement) {
      return problem(400, 'Invalid statement', `statement must be ${STATEMENTS.join(', ')}.`)
    }
    const security = securities.get(String(params.id))
    const fundamentals = FUNDAMENTALS_BY_ID.get(String(params.id))
    if (!security || !fundamentals) return noAccounts(params.id)
    const years = Math.min(FISCAL_YEARS.length, Math.max(1, Number(query.get('years')) || 5))
    return HttpResponse.json<FinancialStatementDto>({
      securityId: security.id,
      statement,
      currency: security.currency,
      fiscalYears: FISCAL_YEARS.slice(-years),
      lines: fundamentals.statements[statement].map(({ key, unit, values }) => {
        const shown = values.slice(-years)
        return { key, unit, values: shown, growth: lineGrowth(unit, shown) }
      }),
    })
  }),
]
