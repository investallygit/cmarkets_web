import { clsx } from 'clsx'
import { TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRisk } from '@/entities/portfolio'
import { useFormat } from '@/shared/i18n'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 5, Risk tab: issuer concentration, a country grouping its bonds (spec section 14.3).
 * One bar per issuer against the limit on one issuer, dashed; above it, the bar turns red.
 */
export function PortfolioIssuersPanel({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const risk = useRisk(portfolioId)

  return (
    <Panel title={t('panels.issuers')} code="PORT">
      <QueryView
        query={risk}
        isEmpty={(data) => data.issuers.length === 0}
        emptyMessage={t('portfolio.positions.empty')}
      >
        {(data) => {
          const limit = data.limits.issuerWeightPct
          // The scale leaves room for the limit and the largest weight.
          const scale = Math.max(limit ?? 0, data.issuers[0]?.weightPct ?? 0) * 1.1 || 1
          return (
            <div className="flex h-full flex-col">
              <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto px-3 py-2">
                {data.issuers.map((issuer) => {
                  const above = limit !== null && issuer.weightPct > limit
                  return (
                    <li
                      key={issuer.issuer}
                      className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_64px] items-center gap-2"
                    >
                      <span className="truncate font-sans text-data" title={issuer.issuer}>
                        {issuer.issuer}
                      </span>
                      <span className="relative h-2.5">
                        <span
                          className={clsx(
                            'absolute inset-y-0 left-0 rounded-r-xs',
                            above && 'bg-down',
                          )}
                          style={{
                            width: `${(issuer.weightPct / scale) * 100}%`,
                            backgroundColor: above ? undefined : theme.series[0],
                          }}
                        />
                        {limit !== null && (
                          <span
                            aria-hidden
                            className="absolute -inset-y-1 border-l border-dashed border-warning"
                            style={{ left: `${(limit / scale) * 100}%` }}
                          />
                        )}
                      </span>
                      <span
                        className={clsx(
                          'inline-flex items-center justify-end gap-1 font-mono text-data',
                          above && 'text-down',
                        )}
                      >
                        {above && <TriangleAlert aria-hidden className="size-3" />}
                        {format.percent(issuer.weightPct, 1, false)}
                        {above && (
                          <span className="sr-only">{t('portfolio.limitStatus.breached')}</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {limit !== null && (
                <p className="flex shrink-0 items-center gap-1.5 border-t px-3 py-1 font-sans text-title text-secondary">
                  <span aria-hidden className="h-3 border-l border-dashed border-warning" />
                  {t('portfolio.issuers.limit', { limit: format.percent(limit, 1, false) })}
                </p>
              )}
            </div>
          )
        }}
      </QueryView>
    </Panel>
  )
}
