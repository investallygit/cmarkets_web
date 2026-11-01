import { http, HttpResponse } from 'msw'
import type { ReportJobDto, ReportRequestDto, ReportSection } from '@/shared/api/contracts'
import { formatIsoDate, formatNumber, formatPercent } from '@/shared/lib/format'
import { currentUser, marketData, securities } from '../../db'
import { api, latency, problem } from '../../lib/http'
import { newId } from '../../lib/ids'
import { createPdf } from '../../lib/pdf'
import {
  effectiveTransactions,
  incomeOf,
  performanceOf,
  positionsOf,
  riskOf,
  type MarketData,
  type StoredPortfolio,
} from '../../lib/portfolioEngine'
import { normalize } from '../../lib/text'
import { isIsoDate } from '../../lib/validation'
import { invalid, valuationOf, withPortfolio, type Errors } from './common'

const REPORT_SECTIONS: readonly ReportSection[] = [
  'positions',
  'performance',
  'risk',
  'income',
  'transactions',
]

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

/** PDF reports of a portfolio: a job builds the file, then it is downloaded. */
export const reportHandlers = [
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
