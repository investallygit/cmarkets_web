import { http, HttpResponse } from 'msw'
import type { AllocationBy } from '@/shared/api/contracts'
import { indices, marketData } from '../../db'
import { api, latency } from '../../lib/http'
import { allocationOf, incomeOf, performanceOf, positionsOf } from '../../lib/portfolioEngine'
import { isIsoDate } from '../../lib/validation'
import { invalid, valuationOf, withPortfolio } from './common'
import { checkLimits, riskNow } from './limits'

const ALLOCATIONS: readonly AllocationBy[] = ['asset', 'sector', 'country', 'maturity']

/** What the panels of PORT show: positions, performance, allocation, risk and income. */
export const valuationHandlers = [
  http.get(api('/portfolios/:id/positions'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const market = marketData()
    const valuation = valuationOf(found.portfolio, market)
    return HttpResponse.json(
      positionsOf(found.portfolio, valuation, market, new Date().toISOString()),
    )
  }),

  http.get(api('/portfolios/:id/performance'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const query = new URL(request.url).searchParams
    const from = query.get('from')
    const to = query.get('to')
    const benchmark = query.get('benchmark')
    if ((from && !isIsoDate(from)) || (to && !isIsoDate(to))) {
      return invalid('Invalid period', { from: ['Dates as YYYY-MM-DD.'] })
    }
    if (benchmark && !indices.has(benchmark)) {
      return invalid('Invalid benchmark', { benchmark: ['An index of GET /indices.'] })
    }
    const market = marketData()
    const valuation = valuationOf(found.portfolio, market)
    return HttpResponse.json(
      performanceOf(found.portfolio, valuation, market, { from, to, benchmark }),
    )
  }),

  http.get(api('/portfolios/:id/allocation'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const by = ALLOCATIONS.find(
      (candidate) => candidate === new URL(request.url).searchParams.get('by'),
    )
    if (!by) return invalid('Invalid allocation', { by: [`One of ${ALLOCATIONS.join(', ')}.`] })
    const market = marketData()
    const valuation = valuationOf(found.portfolio, market)
    const positions = positionsOf(found.portfolio, valuation, market, new Date().toISOString())
    return HttpResponse.json(allocationOf(positions, by, market))
  }),

  // Also the valuation that checks the limits.
  http.get(api('/portfolios/:id/risk'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const market = marketData()
    const risk = riskNow(found.portfolio, market)
    checkLimits(found.portfolio, market, risk)
    return HttpResponse.json(risk)
  }),

  http.get(api('/portfolios/:id/income'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const market = marketData()
    return HttpResponse.json(
      incomeOf(found.portfolio, valuationOf(found.portfolio, market), market),
    )
  }),
]
