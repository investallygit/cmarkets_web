import { clsx } from 'clsx'
import { Check, Minus, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { openPortfolioDialog, PORTFOLIO_LIMITS, usePortfolio, useRisk } from '@/entities/portfolio'
import { usePortfolioAccess } from '@/features/manage-portfolios'
import type { PortfolioLimit, RiskDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/** The figure a limit is checked against; drawdowns are negative, their limit a depth. */
function currentValue(risk: RiskDto, limit: PortfolioLimit): number | null {
  switch (limit) {
    case 'issuerWeightPct':
      return risk.issuers.at(0)?.weightPct ?? null
    case 'volatilityPct':
      return risk.volatilityPct
    case 'drawdownPct':
      return risk.maxDrawdownPct
    case 'beta':
      return risk.beta
    case 'durationYears':
      return risk.durationYears
  }
}

/**
 * Screen 5, Risk tab: each limit of the portfolio against its current figure, as checked after
 * each valuation; a breach sets off the user's portfolio alerts. EDIT opens the settings.
 */
export function PortfolioLimitsPanel({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const risk = useRisk(portfolioId)
  const portfolio = usePortfolio(portfolioId).data
  const { canWrite } = usePortfolioAccess(portfolioId)

  const show = (limit: PortfolioLimit, value: number | null) => {
    if (value === null) return '—'
    switch (limit) {
      case 'beta':
        return format.number(value, 2)
      case 'durationYears':
        return t('portfolio.limits.years', { value: format.number(value, 2) })
      case 'drawdownPct':
        return format.percent(value, 1)
      default:
        return format.percent(value, 1, false)
    }
  }

  return (
    <Panel
      title={t('panels.limits')}
      code="PORT"
      options={
        canWrite && portfolio ? (
          <button
            type="button"
            onClick={() => openPortfolioDialog({ mode: 'edit', portfolio })}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('portfolio.limits.edit')}
          </button>
        ) : null
      }
    >
      <QueryView query={risk}>
        {(data) => (
          <table className="w-full font-mono text-data">
            <thead className="bg-panel-header">
              <tr className="h-row text-left font-sans text-secondary">
                <th scope="col" className="px-2 font-normal">
                  {t('portfolio.limits.limit')}
                </th>
                <th scope="col" className="px-2 text-right font-normal">
                  {t('portfolio.limits.current')}
                </th>
                <th scope="col" className="px-2 text-right font-normal">
                  {t('portfolio.limits.maximum')}
                </th>
                <th scope="col" className="px-2 font-normal">
                  {t('portfolio.limits.status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {PORTFOLIO_LIMITS.map((limit, index) => {
                const value = data.limits[limit]
                const breached = data.breaches.includes(limit)
                return (
                  <tr key={limit} className={clsx('h-row', index % 2 === 1 && 'bg-row-alt')}>
                    <th scope="row" className="px-2 text-left font-sans font-normal">
                      {t(`portfolio.limits.${limit}`)}
                    </th>
                    <td className={clsx('px-2 text-right', breached && 'text-down')}>
                      {show(limit, currentValue(data, limit))}
                    </td>
                    <td className="px-2 text-right">
                      {value === null ? '—' : show(limit, limit === 'drawdownPct' ? -value : value)}
                    </td>
                    <td className="px-2 font-sans">
                      {value === null ? (
                        <span className="inline-flex items-center gap-1 text-secondary">
                          <Minus aria-hidden className="size-3" />
                          {t('portfolio.limitStatus.none')}
                        </span>
                      ) : breached ? (
                        <span className="inline-flex items-center gap-1 text-down">
                          <TriangleAlert aria-hidden className="size-3" />
                          {t('portfolio.limitStatus.breached')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-up">
                          <Check aria-hidden className="size-3" />
                          {t('portfolio.limitStatus.within')}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </QueryView>
    </Panel>
  )
}
