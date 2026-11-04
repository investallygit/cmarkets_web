import { http, HttpResponse } from 'msw'
import type {
  ModelAllocationDto,
  PortfolioCreateDto,
  PortfolioDto,
  PortfolioKind,
  PortfolioLimit,
  PortfolioLimitsDto,
  PortfolioSummaryDto,
  PortfolioUpdateDto,
} from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'
import {
  currentUser,
  indices,
  marketData,
  portfolioStore,
  securities,
  sharedPortfolios,
} from '../../db'
import type { StoredAccount } from '../../fixtures/accounts'
import { api, latency, noContent, problem } from '../../lib/http'
import { newId } from '../../lib/ids'
import {
  effectiveTransactions,
  outstandingPct,
  type MarketData,
  type StoredPortfolio,
} from '../../lib/portfolioEngine'
import { isIsoDate, isNumber } from '../../lib/validation'
import { allowed, forbidden, invalid, savePortfolio, withPortfolio, type Errors } from './common'
import { checkLimits, noteLimits } from './limits'

const MAX_NAME_LENGTH = 40

const MAX_MODEL_LINES = 30

const CURRENCIES = ['XAF', 'EUR']
const LIMITS: readonly PortfolioLimit[] = [
  'issuerWeightPct',
  'volatilityPct',
  'drawdownPct',
  'beta',
  'durationYears',
]

/** The owner is the colleague who shares the portfolio; none for the user's own. */
function toSummary(
  portfolio: StoredPortfolio,
  market: MarketData,
  owner: StoredAccount | null = null,
): PortfolioSummaryDto {
  const { id, name, kind, currency, benchmark, sharedWithOrganization } = portfolio
  const first = effectiveTransactions(portfolio, market).at(0)
  return {
    id,
    name,
    kind,
    currency,
    benchmark,
    inceptionDate: first?.date ?? null,
    sharedWithOrganization,
    sharedBy: owner && { userId: owner.id, displayName: owner.displayName },
  }
}

function toDto(
  portfolio: StoredPortfolio,
  market: MarketData,
  owner: StoredAccount | null = null,
): PortfolioDto {
  return {
    ...toSummary(portfolio, market, owner),
    limits: { ...portfolio.limits },
    model: portfolio.model,
    version: String(portfolio.version),
  }
}

function readLimits(value: unknown, errors: Errors): PortfolioLimitsDto {
  const input = (value ?? {}) as Partial<Record<PortfolioLimit, unknown>>
  const limits = {} as PortfolioLimitsDto
  for (const key of LIMITS) {
    const limit = input[key]
    const percent = key === 'issuerWeightPct' || key === 'drawdownPct'
    if (limit === null || limit === undefined) limits[key] = null
    else if (!isNumber(limit) || limit <= 0 || (percent && limit > 100)) {
      errors[`limits.${key}`] = [percent ? 'Between 0 and 100.' : 'Above 0.']
      limits[key] = null
    } else limits[key] = limit
  }
  return limits
}

function readModel(value: unknown, errors: Errors, market: MarketData): ModelAllocationDto {
  const input = (value ?? {}) as Partial<ModelAllocationDto>
  const notional = isNumber(input.notional) && input.notional > 0 ? input.notional : 0
  if (notional === 0) errors['model.notional'] = ['Above 0.']
  const startDate = isIsoDate(input.startDate) ? input.startDate : ''
  if (!startDate || startDate > market.today || startDate < addDays(market.today, -3650)) {
    errors['model.startDate'] = ['A date in the last ten years.']
  }
  const lines = Array.isArray(input.lines) ? input.lines : []
  if (lines.length === 0 || lines.length > MAX_MODEL_LINES) {
    errors['model.lines'] = [`Between 1 and ${MAX_MODEL_LINES} lines.`]
  }
  const seen = new Set<string>()
  lines.forEach((line, index) => {
    const bond = market.bond(line.securityId)
    if (!securities.has(line.securityId) || seen.has(line.securityId)) {
      errors[`model.lines[${index}].securityId`] = ['A security, once.']
    } else if (
      bond &&
      startDate &&
      (startDate < bond.issueDate || outstandingPct(bond, startDate) === 0)
    ) {
      errors[`model.lines[${index}].securityId`] = ['Not outstanding on the start date.']
    }
    seen.add(line.securityId)
    if (!isNumber(line.weightPct) || line.weightPct <= 0 || line.weightPct > 100) {
      errors[`model.lines[${index}].weightPct`] = ['Between 0 and 100.']
    }
  })
  const total = lines.reduce(
    (sum, line) => sum + (isNumber(line.weightPct) ? line.weightPct : 0),
    0,
  )
  if (total > 100.000001) errors['model.lines'] = ['The weights add up to 100% at most.']
  return {
    notional,
    startDate,
    lines: lines.map(({ securityId, weightPct }) => ({ securityId, weightPct })),
  }
}

/**
 * The settings of a portfolio, or the errors by field as FluentValidation reports them. Without
 * the field, the sharing stays as it was.
 */
function readSettings(
  body: Partial<PortfolioCreateDto & PortfolioUpdateDto>,
  kind: PortfolioKind,
  market: MarketData,
  shared = false,
) {
  const errors: Errors = {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (name === '' || name.length > MAX_NAME_LENGTH) {
    errors.name = [`Between 1 and ${MAX_NAME_LENGTH} characters.`]
  }
  const benchmark = String(body.benchmark ?? '')
  // MCAP is the market capitalization, not an index one can invest in.
  if (!indices.has(benchmark) || benchmark === 'MCAP')
    errors.benchmark = ['An index of GET /indices.']
  const limits = readLimits(body.limits, errors)
  const model = kind === 'model' ? readModel(body.model, errors, market) : null
  const sharing = body.sharedWithOrganization ?? shared
  if (typeof sharing !== 'boolean') errors.sharedWithOrganization = ['true or false.']
  else if (sharing && !currentUser().organization) {
    errors.sharedWithOrganization = ['Your account belongs to no organisation.']
  }
  const sharedWithOrganization = sharing === true
  return { errors, settings: { name, benchmark, limits, model, sharedWithOrganization } }
}

/**
 * The portfolios of the user: list, creation within the quota, settings, deletion; then those
 * colleagues share with the organisation, read only.
 */
export const manageHandlers = [
  http.get(api('/portfolios'), async () => {
    await latency()
    if (!allowed('portfolios:read')) return forbidden('Your account type has no portfolios.')
    const market = marketData()
    return HttpResponse.json([
      ...portfolioStore.read().map((portfolio) => toSummary(portfolio, market)),
      ...sharedPortfolios().map(({ portfolio, owner }) => toSummary(portfolio, market, owner)),
    ])
  }),

  // The quota of the account type (spec section 12); Students only simulate.
  http.post(api('/portfolios'), async ({ request }) => {
    await latency()
    if (!allowed('portfolios:write')) return forbidden('Your account type cannot hold portfolios.')
    const body = (await request.json()) as Partial<PortfolioCreateDto>
    const { quotas, accountType } = currentUser()
    const kind = body.kind === 'real' || body.kind === 'model' ? body.kind : null
    if (kind === 'real' && accountType === 'student') {
      return forbidden('A Student account simulates model portfolios only.')
    }
    const market = marketData()
    const { errors, settings } = readSettings(body, kind ?? 'real', market)
    if (!kind) errors.kind = ['real or model.']
    if (!CURRENCIES.includes(String(body.currency)))
      errors.currency = [`One of ${CURRENCIES.join(', ')}.`]
    if (Object.keys(errors).length > 0) return invalid('Invalid portfolio', errors)
    const portfolios = portfolioStore.read()
    if (quotas.portfolios !== null && portfolios.length >= quotas.portfolios) {
      return problem(
        409,
        'Portfolio quota reached',
        `A ${accountType} account can hold ${quotas.portfolios} portfolios.`,
      )
    }
    const portfolio: StoredPortfolio = {
      id: newId('portfolio'),
      ...settings,
      kind: kind ?? 'real',
      currency: String(body.currency),
      transactions: [],
      version: 1,
    }
    portfolioStore.write([...portfolios, portfolio])
    return HttpResponse.json(toDto(portfolio, market), { status: 201 })
  }),

  http.get(api('/portfolios/:id'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    return HttpResponse.json(toDto(found.portfolio, marketData(), found.owner))
  }),

  // The kind and the currency stay; a stale version means someone else saved meanwhile.
  http.put(api('/portfolios/:id'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    const body = (await request.json()) as Partial<PortfolioUpdateDto>
    if (body.version !== String(portfolio.version)) {
      return problem(409, 'Portfolio changed', 'Someone else changed this portfolio meanwhile.')
    }
    const market = marketData()
    const { errors, settings } = readSettings(
      body,
      portfolio.kind,
      market,
      portfolio.sharedWithOrganization,
    )
    if (Object.keys(errors).length > 0) return invalid('Invalid portfolio', errors)
    noteLimits(portfolio, market)
    const updated: StoredPortfolio = { ...portfolio, ...settings, version: portfolio.version + 1 }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    return HttpResponse.json(toDto(updated, market))
  }),

  http.delete(api('/portfolios/:id'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    portfolioStore.write(found.portfolios.filter((candidate) => candidate !== found.portfolio))
    return noContent()
  }),
]
