import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useRisk } from '@/entities/portfolio'
import type { PortfolioLimit, RiskDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** Shown when this share of the line-days had no quote (spec section 14.3). */
const QUIET_DAYS_WARNING_PCT = 20

interface Metric {
  key: string
  label: string
  value: string
  /** Under the value: the index's figure, dates, or the limit when breached. */
  detail?: string
  limit?: PortfolioLimit
}

interface PortfolioRiskPanelProps {
  portfolioId: string
  /** full: the Risk tab, with tracking error, information ratio, VaR and HHI. */
  variant?: 'compact' | 'full'
}

/**
 * Screen 5, risk metrics over a rolling year (spec section 14.3); a breached limit shows in red
 * with the limit below. API GET /portfolios/{id}/risk.
 */
export function PortfolioRiskPanel({ portfolioId, variant = 'compact' }: PortfolioRiskPanelProps) {
  const { t } = useTranslation()
  const risk = useRisk(portfolioId)
  return (
    <Panel title={t('panels.risk')} code="PORT" options={<span>{t('portfolio.risk.window')}</span>}>
      <QueryView query={risk}>{(data) => <RiskMetrics risk={data} variant={variant} />}</QueryView>
    </Panel>
  )
}

function RiskMetrics({ risk, variant }: { risk: RiskDto; variant: 'compact' | 'full' }) {
  const { t } = useTranslation()
  const format = useFormat()
  const insufficient = t('portfolio.risk.insufficient')
  const pct = (value: number | null, decimals = 1) =>
    value === null ? insufficient : format.percent(value, decimals, false)
  const ratio = (value: number | null) => (value === null ? insufficient : format.number(value, 2))
  const issuer = risk.issuers.at(0)
  const date = (day: string) => format.isoDate(day)

  const metrics: Metric[] = [
    {
      key: 'volatility',
      label: t('portfolio.risk.volatility'),
      value: pct(risk.volatilityPct),
      detail:
        risk.benchmarkVolatilityPct === null
          ? undefined
          : t('portfolio.risk.indexVolatility', { value: pct(risk.benchmarkVolatilityPct) }),
      limit: 'volatilityPct',
    },
    {
      key: 'drawdown',
      label: t('portfolio.risk.drawdown'),
      value: risk.maxDrawdownPct === null ? insufficient : format.percent(risk.maxDrawdownPct, 1),
      detail:
        risk.drawdownPeak && risk.drawdownTrough
          ? t('portfolio.risk.drawdownDates', {
              peak: date(risk.drawdownPeak),
              trough: date(risk.drawdownTrough),
            })
          : undefined,
      limit: 'drawdownPct',
    },
    {
      key: 'beta',
      label: t('portfolio.risk.beta', { index: risk.benchmark.name }),
      value: ratio(risk.beta),
      limit: 'beta',
    },
    {
      key: 'sharpe',
      label: t('portfolio.risk.sharpe'),
      value: ratio(risk.sharpe),
      detail: t('portfolio.risk.riskFree', {
        rate: format.percent(risk.riskFreeRatePct, 1, false),
      }),
    },
    ...(variant === 'full'
      ? [
          {
            key: 'annualized',
            label: t('portfolio.risk.annualizedReturn'),
            value:
              risk.annualizedReturnPct === null
                ? insufficient
                : format.percent(risk.annualizedReturnPct, 2),
          },
          {
            key: 'trackingError',
            label: t('portfolio.risk.trackingError'),
            value: pct(risk.trackingErrorPct, 2),
          },
          {
            key: 'informationRatio',
            label: t('portfolio.risk.informationRatio'),
            value: ratio(risk.informationRatio),
          },
          {
            key: 'var',
            label: t('portfolio.risk.var'),
            value: pct(risk.var95Pct, 2),
            detail:
              risk.var95Amount === null
                ? undefined
                : t('portfolio.risk.varAmount', { amount: format.compact(risk.var95Amount) }),
          },
        ]
      : []),
    {
      key: 'duration',
      label: t('portfolio.risk.duration'),
      value: risk.durationYears === null ? '—' : format.number(risk.durationYears, 2),
      limit: 'durationYears',
    },
    {
      key: 'issuer',
      label: t('portfolio.risk.largestIssuer'),
      value: issuer ? format.percent(issuer.weightPct, 1, false) : '—',
      detail: variant === 'full' && issuer ? issuer.issuer : undefined,
      limit: 'issuerWeightPct',
    },
    ...(variant === 'full'
      ? [{ key: 'hhi', label: t('portfolio.risk.hhi'), value: format.number(risk.hhi, 3) }]
      : []),
    {
      key: 'lines',
      label: t('portfolio.risk.lines'),
      value: t('portfolio.risk.linesValue', { count: risk.lines }),
    },
  ]

  const limitText = (limit: PortfolioLimit) => {
    const value = risk.limits[limit] ?? 0
    switch (limit) {
      case 'drawdownPct':
        return format.percent(-value, 1)
      case 'beta':
        return format.number(value, 2)
      case 'durationYears':
        return format.number(value, 1)
      default:
        return format.percent(value, 1, false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <dl className="min-h-0 flex-1 overflow-auto">
        {metrics.map((metric, index) => {
          const breached = metric.limit !== undefined && risk.breaches.includes(metric.limit)
          let detail: ReactNode = metric.detail
          if (breached && metric.limit) {
            detail = t('portfolio.risk.limit', { limit: limitText(metric.limit) })
          }
          return (
            <div
              key={metric.key}
              className={clsx(
                'flex items-start justify-between gap-3 px-3 py-1.5',
                index % 2 === 1 && 'bg-row-alt',
              )}
            >
              <dt className="pt-0.5 font-sans text-label text-secondary">{metric.label}</dt>
              <dd className="flex flex-col items-end">
                <span
                  className={clsx(
                    'font-mono text-label font-semibold whitespace-nowrap',
                    breached && 'text-down',
                  )}
                >
                  {metric.value}
                  {breached && (
                    <span className="sr-only"> {t('portfolio.limitStatus.breached')}</span>
                  )}
                </span>
                {detail && (
                  <span
                    className={clsx(
                      'font-mono text-caption whitespace-nowrap',
                      breached ? 'text-down' : 'text-secondary',
                    )}
                  >
                    {detail}
                  </span>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
      {(risk.observations < risk.minObservations || risk.staleDaysPct > QUIET_DAYS_WARNING_PCT) && (
        <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-warning">
          {risk.observations < risk.minObservations
            ? t('portfolio.risk.fewObservations', {
                count: risk.observations,
                minimum: risk.minObservations,
              })
            : t('portfolio.risk.quietDays', { share: format.percent(risk.staleDaysPct, 0, false) })}
        </p>
      )}
    </div>
  )
}
