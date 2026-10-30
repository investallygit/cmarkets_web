import { http, HttpResponse } from 'msw'
import type {
  AllocationBy,
  ModelAllocationDto,
  Permission,
  PortfolioCreateDto,
  PortfolioDto,
  PortfolioKind,
  PortfolioLimit,
  PortfolioLimitsDto,
  PortfolioSummaryDto,
  PortfolioUpdateDto,
  ReportJobDto,
  ReportRequestDto,
  ReportSection,
  RiskDto,
  TransactionDto,
  TransactionImportResultDto,
  TransactionInputDto,
  TransactionType,
} from '@/shared/api/contracts'
import { formatIsoDate, formatNumber, formatPercent } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import {
  currentUser,
  indices,
  marketData,
  portfolioStore,
  securities,
  triggerPortfolioAlerts,
} from '../db'
import { api, latency, noContent, problem } from '../lib/http'
import { createPdf } from '../lib/pdf'
import {
  allocationOf,
  effectiveTransactions,
  incomeOf,
  outstandingPct,
  performanceOf,
  portfolioValuation,
  positionsOf,
  riskOf,
  transactionAmount,
  type MarketData,
  type StoredPortfolio,
  type StoredTransaction,
  type TransactionFields,
  type Valuation,
} from '../lib/portfolioEngine'
import { normalize } from '../lib/text'
import { cellDate, cellNumber, cellText, readTransactionFile } from '../lib/transactionFile'
import { isIsoDate, isNumber } from '../lib/validation'

type Errors = Record<string, string[]>

const MAX_NAME_LENGTH = 40
const MAX_NOTE_LENGTH = 200
const MAX_MODEL_LINES = 30
const MAX_IMPORT_ROWS = 1000
const MAX_FILE_SIZE = 2 * 1024 * 1024
const CURRENCIES = ['XAF', 'EUR']
const LIMITS: readonly PortfolioLimit[] = [
  'issuerWeightPct',
  'volatilityPct',
  'drawdownPct',
  'beta',
  'durationYears',
]
const TRANSACTION_TYPES: readonly TransactionType[] = [
  'buy',
  'sell',
  'subscription',
  'redemption',
  'dividend',
  'coupon',
  'fees',
  'deposit',
  'withdrawal',
]
const ALLOCATIONS: readonly AllocationBy[] = ['asset', 'sector', 'country', 'maturity']
const REPORT_SECTIONS: readonly ReportSection[] = [
  'positions',
  'performance',
  'risk',
  'income',
  'transactions',
]

const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
const forbidden = (detail: string) => problem(403, 'Forbidden', detail)
const notFound = (id: unknown) => problem(404, 'Portfolio not found', `No portfolio ${String(id)}.`)
const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
const isTrade = (type: TransactionType) =>
  type === 'buy' || type === 'sell' || type === 'subscription'

function findPortfolio(id: unknown) {
  const portfolios = portfolioStore.read()
  return { portfolios, portfolio: portfolios.find((candidate) => candidate.id === id) }
}

function savePortfolio(portfolios: readonly StoredPortfolio[], updated: StoredPortfolio) {
  portfolioStore.write(
    portfolios.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
  )
}

/** Valuations are kept a moment, so the panels of one screen share the work. */
const VALUATION_TTL_MS = 1_500
const valuations = new WeakMap<StoredPortfolio, { at: number; valuation: Valuation }>()

function valuationOf(portfolio: StoredPortfolio, market: MarketData): Valuation {
  const cached = valuations.get(portfolio)
  if (cached && Date.now() - cached.at < VALUATION_TTL_MS) return cached.valuation
  const valuation = portfolioValuation(portfolio, market)
  valuations.set(portfolio, { at: Date.now(), valuation })
  return valuation
}

function toSummary(portfolio: StoredPortfolio, market: MarketData): PortfolioSummaryDto {
  const { id, name, kind, currency, benchmark } = portfolio
  const first = effectiveTransactions(portfolio, market).at(0)
  return { id, name, kind, currency, benchmark, inceptionDate: first?.date ?? null }
}

function toDto(portfolio: StoredPortfolio, market: MarketData): PortfolioDto {
  return {
    ...toSummary(portfolio, market),
    limits: { ...portfolio.limits },
    model: portfolio.model,
    version: String(portfolio.version),
  }
}

function toTransactionDto(
  transaction: StoredTransaction,
  realized: ReadonlyMap<string, number>,
): TransactionDto {
  const security = transaction.securityId ? securities.get(transaction.securityId) : undefined
  return {
    ...transaction,
    securityCode: security?.code ?? null,
    realizedGain: realized.get(transaction.id) ?? null,
    version: String(transaction.version),
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

/** The settings of a portfolio, or the errors by field as FluentValidation reports them. */
function readSettings(
  body: Partial<PortfolioCreateDto & PortfolioUpdateDto>,
  kind: PortfolioKind,
  market: MarketData,
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
  return { errors, settings: { name, benchmark, limits, model } }
}

/** Shares and bonds held never go below zero, sale by sale; the first one that does. */
function oversold(transactions: readonly StoredTransaction[]) {
  const held = new Map<string, number>()
  for (const transaction of [...transactions].sort((a, b) => a.date.localeCompare(b.date))) {
    const { securityId, quantity, type } = transaction
    if (!securityId || !isTrade(type)) continue
    const before = held.get(securityId) ?? 0
    const after = type === 'sell' ? before - (quantity ?? 0) : before + (quantity ?? 0)
    if (after < -1e-9) return { transaction, held: before }
    held.set(securityId, after)
  }
  return null
}

/** What each type needs: a share, a bond, any security, or none. */
function securityRule(type: TransactionType): 'any' | 'equity' | 'bond' | 'optional' | 'none' {
  switch (type) {
    case 'buy':
    case 'sell':
    case 'subscription':
      return 'any'
    case 'dividend':
      return 'equity'
    case 'coupon':
    case 'redemption':
      return 'bond'
    case 'fees':
      return 'optional'
    case 'deposit':
    case 'withdrawal':
      return 'none'
  }
}

/** The fields of a transaction, or its errors by field. */
function readTransaction(
  body: Partial<TransactionInputDto>,
  market: MarketData,
): { fields: TransactionFields & { note: string } } | { errors: Errors } {
  const errors: Errors = {}
  const type = TRANSACTION_TYPES.find((candidate) => candidate === body.type)
  if (!type) return { errors: { type: [`One of ${TRANSACTION_TYPES.join(', ')}.`] } }
  const date = isIsoDate(body.date) ? body.date : ''
  if (!date || date > market.today || date < '2000-01-01') errors.date = ['A date up to today.']

  const rule = securityRule(type)
  const securityId = body.securityId ?? null
  const security = securityId ? market.security(securityId) : undefined
  if (rule === 'none' && securityId) errors.securityId = ['No security for this type.']
  if (rule !== 'none' && rule !== 'optional' && !security)
    errors.securityId = ['A security is required.']
  if (securityId && rule !== 'none' && !security) errors.securityId = ['Unknown security.']
  if (security && rule === 'equity' && security.type !== 'equity') errors.securityId = ['A share.']
  if (security && rule === 'bond' && security.type !== 'bond') errors.securityId = ['A bond.']
  const bond = security ? market.bond(security.id) : undefined
  if (bond && date && date < bond.issueDate) {
    errors.date = [`The bond was issued on ${formatIsoDate(bond.issueDate)}.`]
  }

  const quantity = isTrade(type) ? (body.quantity ?? null) : null
  const price = isTrade(type) ? (body.price ?? null) : null
  const amount = isTrade(type) ? null : (body.amount ?? null)
  const fees = body.fees ?? 0
  if (isTrade(type)) {
    if (!isNumber(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      errors.quantity = ['A whole number above 0.']
    }
    if (!isNumber(price) || price <= 0) errors.price = ['Above 0.']
    if (!isNumber(fees) || fees < 0) errors.fees = ['0 or more.']
  } else if (!isNumber(amount) || amount <= 0) errors.amount = ['Above 0.']
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if (note.length > MAX_NOTE_LENGTH) errors.note = [`${MAX_NOTE_LENGTH} characters at most.`]

  if (Object.keys(errors).length > 0) return { errors }
  return {
    fields: {
      type,
      date,
      securityId: rule === 'none' ? null : (security?.id ?? null),
      quantity,
      price,
      fees: isTrade(type) ? fees : 0,
      amount,
      note,
    },
  }
}

function storeTransaction(
  fields: TransactionFields & { note: string },
  portfolio: StoredPortfolio,
  market: MarketData,
  id: string,
  version: number,
): StoredTransaction {
  return {
    ...fields,
    id,
    version,
    amount: transactionAmount(fields, portfolio.currency, market),
  }
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`

/**
 * Breaches seen at the last valuation, per user and portfolio: a limit, or for the limit on one
 * issuer each issuer above it, so a second issuer going over sets the alerts off again.
 */
const knownBreaches = new Map<string, ReadonlySet<string>>()
const breachKey = (portfolioId: string) => `${currentUser().id}|${portfolioId}`

function riskNow(portfolio: StoredPortfolio, market: MarketData): RiskDto {
  const valuation = valuationOf(portfolio, market)
  const positions = positionsOf(portfolio, valuation, market, new Date().toISOString())
  return riskOf(portfolio, valuation, positions, market)
}

interface Breach {
  key: string
  message: string
}

function breachesOf(risk: RiskDto): Breach[] {
  const pct = (number: number | null | undefined) => `${(number ?? 0).toFixed(1)}%`
  return risk.breaches.flatMap((limit): Breach[] => {
    const value = risk.limits[limit]
    switch (limit) {
      case 'issuerWeightPct':
        return risk.issuers
          .filter((issuer) => value !== null && issuer.weightPct > value)
          .map((issuer) => ({
            key: `${limit}|${issuer.issuer}`,
            message: `${issuer.issuer} is ${pct(issuer.weightPct)} of the portfolio, above the ${value}% limit on one issuer.`,
          }))
      case 'volatilityPct':
        return [
          {
            key: limit,
            message: `Volatility ${pct(risk.volatilityPct)}, above the ${value}% limit.`,
          },
        ]
      case 'drawdownPct':
        return [
          {
            key: limit,
            message: `Drawdown ${pct(risk.maxDrawdownPct)}, beyond the -${value}% limit.`,
          },
        ]
      case 'beta':
        return [
          { key: limit, message: `Beta ${(risk.beta ?? 0).toFixed(2)}, above the ${value} limit.` },
        ]
      case 'durationYears':
        return [
          {
            key: limit,
            message: `Bond sleeve duration ${(risk.durationYears ?? 0).toFixed(2)} years, above the ${value}-year limit.`,
          },
        ]
    }
  })
}

/**
 * Checks the limits after a valuation (spec section 14.3): a breach that was not there sets off
 * the user's portfolio alerts. The first check of a portfolio only notes what is breached.
 */
function checkLimits(
  portfolio: StoredPortfolio,
  market: MarketData,
  risk = riskNow(portfolio, market),
) {
  const key = breachKey(portfolio.id)
  const before = knownBreaches.get(key)
  const breaches = breachesOf(risk)
  knownBreaches.set(key, new Set(breaches.map((breach) => breach.key)))
  if (!before) return
  for (const breach of breaches.filter((candidate) => !before.has(candidate.key))) {
    triggerPortfolioAlerts(portfolio.id, portfolio.name, breach.message)
  }
}

/** Notes the breaches before a change, so that only the ones it causes set off alerts. */
function noteLimits(portfolio: StoredPortfolio, market: MarketData) {
  if (!knownBreaches.has(breachKey(portfolio.id))) checkLimits(portfolio, market)
}

const modelHasNoTransactions = () =>
  problem(409, 'Model portfolio', 'A model portfolio has no transactions: change its allocation.')

/** A security as typed in a file: its code, its id or another name ("ECMR 6.25 2029"). */
function findSecurityId(text: string): string | null {
  const wanted = normalize(text)
  if (!wanted) return null
  for (const security of securities.values()) {
    const names = [security.id, security.code, ...(security.aliases ?? [])]
    if (names.some((name) => normalize(name) === wanted)) return security.id
  }
  return null
}

interface ReportJob {
  dto: Omit<ReportJobDto, 'status' | 'progress' | 'downloadPath' | 'fileName'>
  userId: string
  startedAt: number
  fileName: string
  pdf: Uint8Array<ArrayBuffer>
}

const reportJobs = new Map<string, ReportJob>()
/** The job waits in the queue, then the report takes a few seconds to build. */
const REPORT_QUEUED_MS = 700
const REPORT_RUNNING_MS = 2_300

function jobDto(job: ReportJob): ReportJobDto {
  const elapsed = Date.now() - job.startedAt
  const done = elapsed >= REPORT_QUEUED_MS + REPORT_RUNNING_MS
  return {
    ...job.dto,
    status: done ? 'done' : elapsed < REPORT_QUEUED_MS ? 'queued' : 'running',
    progress: done
      ? 100
      : Math.max(0, Math.round(((elapsed - REPORT_QUEUED_MS) / REPORT_RUNNING_MS) * 100)),
    downloadPath: done ? `/reports/${job.dto.jobId}/file` : null,
    fileName: done ? job.fileName : null,
  }
}

const REPORT_WORDS = {
  en: {
    period: 'Period',
    since: 'since inception',
    generated: 'Generated on',
    benchmark: 'Benchmark',
    comments: 'Comments',
    positions: 'Positions',
    cash: 'Cash',
    total: 'Total value',
    performance: 'Performance (time-weighted)',
    portfolio: 'Portfolio',
    outperformance: 'Outperformance',
    irr: 'Money-weighted return (IRR)',
    risk: 'Risk, rolling year',
    volatility: 'Annualized volatility',
    drawdown: 'Maximum drawdown',
    beta: 'Beta',
    sharpe: 'Sharpe ratio',
    duration: 'Bond sleeve duration',
    issuer: 'Largest issuer',
    insufficient: 'insufficient data',
    income: 'Upcoming income',
    transactions: 'Transactions',
    none: 'None.',
    kinds: { dividend: 'Dividend', coupon: 'Coupon', redemption: 'Redemption' },
    types: {
      buy: 'Buy',
      sell: 'Sell',
      subscription: 'Subscription',
      redemption: 'Redemption',
      dividend: 'Dividend',
      coupon: 'Coupon',
      fees: 'Fees',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
    },
  },
  fr: {
    period: 'Période',
    since: 'depuis la création',
    generated: 'Généré le',
    benchmark: 'Indice de référence',
    comments: 'Commentaires',
    positions: 'Positions',
    cash: 'Liquidités',
    total: 'Valeur totale',
    performance: 'Performance (pondérée par le temps)',
    portfolio: 'Portefeuille',
    outperformance: 'Surperformance',
    irr: 'Rendement pondéré par les capitaux (TRI)',
    risk: 'Risque, sur un an glissant',
    volatility: 'Volatilité annualisée',
    drawdown: 'Perte maximale',
    beta: 'Bêta',
    sharpe: 'Ratio de Sharpe',
    duration: 'Duration de la poche obligataire',
    issuer: 'Premier émetteur',
    insufficient: 'données insuffisantes',
    income: 'Revenus à venir',
    transactions: 'Transactions',
    none: 'Aucune.',
    kinds: { dividend: 'Dividende', coupon: 'Coupon', redemption: 'Remboursement' },
    types: {
      buy: 'Achat',
      sell: 'Vente',
      subscription: 'Souscription',
      redemption: 'Remboursement',
      dividend: 'Dividende',
      coupon: 'Coupon',
      fees: 'Frais',
      deposit: 'Apport',
      withdrawal: 'Retrait',
    },
  },
}

/** The report's text, from the same figures as the screen. */
function reportLines(
  portfolio: StoredPortfolio,
  request: ReportRequestDto,
  market: MarketData,
): string[] {
  const { language } = request
  const words = REPORT_WORDS[language]
  // The screen's formats: no-break spaces, which the PDF's Latin-1 font has, group the digits.
  const number = (value: number, decimals = 0) => formatNumber(value, language, decimals)
  const percent = (value: number | null) =>
    value === null ? words.insufficient : formatPercent(value, language, 2, false)
  const valuation = valuationOf(portfolio, market)
  const positions = positionsOf(portfolio, valuation, market, new Date().toISOString())
  const performance = performanceOf(portfolio, valuation, market, {
    from: request.from,
    to: request.to,
    benchmark: null,
  })
  const lines = [
    `${portfolio.name} · ${portfolio.currency}`,
    `${words.period}: ${request.from ? formatIsoDate(performance.from) : words.since} - ${formatIsoDate(performance.to)}`,
    `${words.generated} ${formatIsoDate(market.today)} · ${words.benchmark}: ${performance.benchmark.name}`,
  ]
  if (request.comments) lines.push('', `${words.comments}:`, ...request.comments.split(/\r?\n/))
  for (const section of request.sections) {
    lines.push('')
    switch (section) {
      case 'positions':
        lines.push(`${words.positions}:`)
        positions.items.forEach((item) =>
          lines.push(
            `  ${item.code}  ${number(item.quantity)} @ ${number(item.price, item.type === 'bond' ? 2 : 0)}  ${number(item.value)}  ${number(item.weightPct, 1)}%`,
          ),
        )
        lines.push(
          `  ${words.cash}  ${number(positions.cash)}`,
          `  ${words.total}  ${number(positions.totalValue)}`,
        )
        break
      case 'performance':
        lines.push(
          `${words.performance}:`,
          `  ${words.portfolio} ${percent(performance.twrPct)} · ${words.benchmark} ${percent(performance.benchmarkPct)}`,
          `  ${words.outperformance} ${performance.outperformancePts === null ? '-' : number(performance.outperformancePts, 2)} pts`,
          `  ${words.irr} ${percent(performance.irrPct)}`,
        )
        break
      case 'risk': {
        const risk = riskOf(portfolio, valuation, positions, market)
        const issuer = risk.issuers.at(0)
        lines.push(
          `${words.risk}:`,
          `  ${words.volatility} ${percent(risk.volatilityPct)}`,
          `  ${words.drawdown} ${percent(risk.maxDrawdownPct)}`,
          `  ${words.beta} ${risk.beta === null ? words.insufficient : number(risk.beta, 2)}`,
          `  ${words.sharpe} ${risk.sharpe === null ? words.insufficient : number(risk.sharpe, 2)}`,
          `  ${words.duration} ${risk.durationYears === null ? '-' : number(risk.durationYears, 2)}`,
          `  ${words.issuer} ${issuer ? `${issuer.issuer} ${number(issuer.weightPct, 1)}%` : '-'}`,
        )
        break
      }
      case 'income': {
        const income = incomeOf(portfolio, valuation, market)
        lines.push(`${words.income}:`)
        if (income.upcoming.length === 0) lines.push(`  ${words.none}`)
        income.upcoming.forEach((item) =>
          lines.push(
            `  ${formatIsoDate(item.date)}  ${item.securityCode}  ${words.kinds[item.kind]}  ${number(item.income + item.principal)}`,
          ),
        )
        break
      }
      case 'transactions': {
        const from = request.from ?? '0000-01-01'
        const recorded = effectiveTransactions(portfolio, market).filter(
          (transaction) => transaction.date >= from && transaction.date <= request.to,
        )
        lines.push(`${words.transactions}:`)
        if (recorded.length === 0) lines.push(`  ${words.none}`)
        recorded.forEach((transaction) =>
          lines.push(
            `  ${formatIsoDate(transaction.date)}  ${words.types[transaction.type]}  ${transaction.securityId ? (securities.get(transaction.securityId)?.code ?? '') : ''}  ${number(transaction.amount)}`,
          ),
        )
        break
      }
    }
  }
  return lines
}

function readReportRequest(value: unknown, market: MarketData) {
  const input = (value ?? {}) as Partial<ReportRequestDto>
  const errors: Errors = {}
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  if (title === '' || title.length > 80) errors.title = ['Between 1 and 80 characters.']
  const to = isIsoDate(input.to) ? input.to : ''
  if (!to || to > market.today) errors.to = ['A date up to today.']
  const from = input.from === null || input.from === undefined ? null : input.from
  if (from !== null && (!isIsoDate(from) || (to && from >= to)))
    errors.from = ['A date before the end.']
  const sections = REPORT_SECTIONS.filter((section) => input.sections?.includes(section))
  if (sections.length === 0) errors.sections = ['At least one section.']
  const comments = typeof input.comments === 'string' ? input.comments.trim() : ''
  if (comments.length > 2000) errors.comments = ['2000 characters at most.']
  const language = input.language === 'fr' ? 'fr' : 'en'
  return {
    errors,
    request: { title, from, to, sections, comments, language } satisfies ReportRequestDto,
  }
}

/** Reads the portfolio named by the route, after the permission checks. */
function withPortfolio(
  permission: Permission,
  id: unknown,
): { portfolios: StoredPortfolio[]; portfolio: StoredPortfolio } | { response: Response } {
  if (!allowed('portfolios:read') || !allowed(permission)) {
    return { response: forbidden('Your account type has no access to this function.') }
  }
  const { portfolios, portfolio } = findPortfolio(id)
  return portfolio ? { portfolios, portfolio } : { response: notFound(id) }
}

export const portfolioHandlers = [
  http.get(api('/portfolios'), async () => {
    await latency()
    if (!allowed('portfolios:read')) return forbidden('Your account type has no portfolios.')
    const market = marketData()
    return HttpResponse.json(portfolioStore.read().map((portfolio) => toSummary(portfolio, market)))
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
    return HttpResponse.json(toDto(found.portfolio, marketData()))
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
    const { errors, settings } = readSettings(body, portfolio.kind, market)
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

  // A model portfolio has none: its allocation stands for them.
  http.get(api('/portfolios/:id/transactions'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:read', params.id)
    if ('response' in found) return found.response
    const { portfolio } = found
    if (portfolio.kind === 'model') return HttpResponse.json<TransactionDto[]>([])
    const { realizedById } = valuationOf(portfolio, marketData())
    return HttpResponse.json(
      [...portfolio.transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((transaction) => toTransactionDto(transaction, realizedById)),
    )
  }),

  http.post(api('/portfolios/:id/transactions'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const market = marketData()
    const read = readTransaction((await request.json()) as Partial<TransactionInputDto>, market)
    if ('errors' in read) return invalid('Invalid transaction', read.errors)
    const transaction = storeTransaction(read.fields, portfolio, market, newId('tx'), 1)
    const transactions = [...portfolio.transactions, transaction]
    const short = oversold(transactions)
    if (short) {
      return invalid('Invalid transaction', {
        quantity: [
          `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`,
        ],
      })
    }
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const { realizedById } = valuationOf(updated, market)
    return HttpResponse.json(toTransactionDto(transaction, realizedById), { status: 201 })
  }),

  http.put(api('/portfolios/:id/transactions/:txId'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const existing = portfolio.transactions.find((candidate) => candidate.id === params.txId)
    if (!existing)
      return problem(404, 'Transaction not found', `No transaction ${String(params.txId)}.`)
    const body = (await request.json()) as Partial<TransactionInputDto>
    if (body.version !== String(existing.version)) {
      return problem(409, 'Transaction changed', 'Someone else changed this transaction meanwhile.')
    }
    const market = marketData()
    const read = readTransaction(body, market)
    if ('errors' in read) return invalid('Invalid transaction', read.errors)
    const transaction = storeTransaction(
      read.fields,
      portfolio,
      market,
      existing.id,
      existing.version + 1,
    )
    const transactions = portfolio.transactions.map((candidate) =>
      candidate === existing ? transaction : candidate,
    )
    const short = oversold(transactions)
    if (short) {
      const message = `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`
      return short.transaction === transaction
        ? invalid('Invalid transaction', { quantity: [message] })
        : problem(409, 'Holdings', `A later sale would sell more than held: ${message}`)
    }
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const { realizedById } = valuationOf(updated, market)
    return HttpResponse.json(toTransactionDto(transaction, realizedById))
  }),

  http.delete(api('/portfolios/:id/transactions/:txId'), async ({ params }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const transactions = portfolio.transactions.filter((candidate) => candidate.id !== params.txId)
    if (transactions.length === portfolio.transactions.length) {
      return problem(404, 'Transaction not found', `No transaction ${String(params.txId)}.`)
    }
    const short = oversold(transactions)
    if (short) {
      return problem(
        409,
        'Holdings',
        `Without it, the sale of ${formatIsoDate(short.transaction.date)} would sell more than held.`,
      )
    }
    const market = marketData()
    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    return noContent()
  }),

  // All rows or none, so a file can be fixed and sent again.
  http.post(api('/portfolios/:id/transactions/import'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:write', params.id)
    if ('response' in found) return found.response
    const { portfolios, portfolio } = found
    if (portfolio.kind === 'model') return modelHasNoTransactions()
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) return invalid('Invalid file', { file: ['A .csv or .xlsx file.'] })
    if (file.size > MAX_FILE_SIZE) return invalid('Invalid file', { file: ['2 MB at most.'] })
    const read = await readTransactionFile(file)
    if ('error' in read) return invalid('Invalid file', { file: [read.error] })
    if (read.rows.length === 0)
      return invalid('Invalid file', { file: ['No transaction in the file.'] })
    if (read.rows.length > MAX_IMPORT_ROWS) {
      return invalid('Invalid file', { file: [`${MAX_IMPORT_ROWS} rows at most.`] })
    }

    const market = marketData()
    const errors: Errors = {}
    const imported: StoredTransaction[] = []
    const lineOf = new Map<StoredTransaction, number>()
    for (const { line, cells } of read.rows) {
      const securityText = cellText(cells.security)
      const securityId = securityText ? findSecurityId(securityText) : null
      const number = (value: number | null) =>
        value === null || Number.isNaN(value) ? null : value
      const parsed = {
        type: cellText(cells.type).toLowerCase() as TransactionType,
        date: cellDate(cells.date) ?? '',
        securityId: securityText && !securityId ? securityText : securityId,
        quantity: number(cellNumber(cells.quantity)),
        price: number(cellNumber(cells.price)),
        fees: number(cellNumber(cells.fees)),
        amount: number(cellNumber(cells.amount)),
        note: cellText(cells.note),
      }
      const result = readTransaction(parsed, market)
      if ('errors' in result) {
        for (const [field, messages] of Object.entries(result.errors)) {
          errors[`rows[${line}].${field === 'securityId' ? 'security' : field}`] = messages
        }
        continue
      }
      const transaction = storeTransaction(result.fields, portfolio, market, newId('tx'), 1)
      imported.push(transaction)
      lineOf.set(transaction, line)
    }
    const short =
      Object.keys(errors).length === 0 ? oversold([...portfolio.transactions, ...imported]) : null
    if (short) {
      const line = lineOf.get(short.transaction)
      errors[line ? `rows[${line}].quantity` : 'file'] = [
        `${short.held.toLocaleString('en-US')} held on ${formatIsoDate(short.transaction.date)}.`,
      ]
    }
    if (Object.keys(errors).length > 0) return invalid('Invalid file', errors)

    noteLimits(portfolio, market)
    const updated = { ...portfolio, transactions: [...portfolio.transactions, ...imported] }
    savePortfolio(portfolios, updated)
    checkLimits(updated, market)
    const dates = imported.map((transaction) => transaction.date).sort()
    return HttpResponse.json<TransactionImportResultDto>(
      { imported: imported.length, from: dates.at(0) ?? null, to: dates.at(-1) ?? null },
      { status: 201 },
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

  // A job, as the server queues the PDF for Hangfire; the logo is accepted and left aside.
  http.post(api('/portfolios/:id/reports'), async ({ params, request }) => {
    await latency()
    const found = withPortfolio('portfolios:reports', params.id)
    if ('response' in found) return found.response
    const form = await request.formData()
    const logo = form.get('logo')
    if (
      logo instanceof File &&
      (logo.size > 1024 * 1024 || !/^image\/(png|jpeg)$/.test(logo.type))
    ) {
      return invalid('Invalid report', { logo: ['A PNG or JPEG image of 1 MB at most.'] })
    }
    let options: unknown
    try {
      options = JSON.parse(String(form.get('options') ?? '{}'))
    } catch {
      return invalid('Invalid report', { options: ['JSON options.'] })
    }
    const market = marketData()
    const { errors, request: report } = readReportRequest(options, market)
    if (Object.keys(errors).length > 0) return invalid('Invalid report', errors)
    const { portfolio } = found
    const jobId = newId('report')
    const job: ReportJob = {
      dto: {
        jobId,
        portfolioId: portfolio.id,
        title: report.title,
        createdAt: new Date().toISOString(),
        error: null,
      },
      userId: currentUser().id,
      startedAt: Date.now(),
      fileName: `${normalize(portfolio.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-${report.to}.pdf`,
      pdf: createPdf(report.title, reportLines(portfolio, report, market)),
    }
    reportJobs.set(jobId, job)
    return HttpResponse.json(jobDto(job), { status: 202 })
  }),

  http.get(api('/reports/:jobId'), async ({ params }) => {
    await latency()
    const job = reportJobs.get(String(params.jobId))
    if (!job || job.userId !== currentUser().id) return problem(404, 'Report not found')
    return HttpResponse.json(jobDto(job))
  }),

  http.get(api('/reports/:jobId/file'), async ({ params }) => {
    await latency()
    const job = reportJobs.get(String(params.jobId))
    if (!job || job.userId !== currentUser().id) return problem(404, 'Report not found')
    if (jobDto(job).status !== 'done') return problem(409, 'Report not ready')
    return new HttpResponse(job.pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${job.fileName}"`,
      },
    })
  }),
]
