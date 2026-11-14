import { useTranslation } from 'react-i18next'
import { useOptimizerTexts } from '@/entities/optimizer'
import type { OptResultDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/**
 * Screen 29's constraints and comparison: the constraints that bind at the optimum, then the optimal
 * portfolio beside equal weights and the portfolio compared (return, risk, Sharpe).
 */
export function ComparisonPanel({ result }: { result: OptResultDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const texts = useOptimizerTexts()
  const pct = (value: number) => format.percent(value, 2, false)
  const ratio = (value: number | null) => (value === null ? '—' : format.number(value, 2))
  const rows = [
    {
      key: 'optimal',
      name: t('opt.comparison.optimal'),
      point: { ...result.frontier.optimal, sharpe: result.indicators.sharpe },
      tone: 'text-accent-amber',
    },
    {
      key: 'equal',
      name: t('opt.comparison.equal'),
      point: result.frontier.equalWeights,
      tone: 'text-primary',
    },
    ...(result.frontier.portfolio
      ? [
          {
            key: 'portfolio',
            name: t('opt.comparison.current', { name: result.frontier.portfolio.name }),
            point: result.frontier.portfolio,
            tone: 'text-primary',
          },
        ]
      : []),
  ]
  return (
    <Panel title={t('opt.comparison.title')} code="OPT RES">
      <ScrollArea className="h-full">
        <div className="space-y-3 p-2 font-sans text-data">
          <section>
            <h3 className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
              {t('opt.comparison.binding')}
            </h3>
            {result.binding.length === 0 ? (
              <p className="text-secondary">{t('opt.comparison.noBinding')}</p>
            ) : (
              <ul className="space-y-0.5 text-warning">
                {result.binding.map((reference, index) => (
                  <li key={index}>
                    ·{' '}
                    {reference.kind === 'targetReturn' || reference.kind === 'targetRisk'
                      ? t('opt.constraintRefs.metExactly', {
                          constraint: texts.constraint(reference),
                        })
                      : texts.constraint(reference)}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-1 font-semibold tracking-wide text-accent-amber uppercase">
              {t('opt.comparison.heading')}
            </h3>
            <table className="w-full border-collapse">
              <thead className="bg-panel-header text-secondary">
                <tr>
                  <th scope="col" className="px-2 py-1 text-left font-normal">
                    {t('opt.comparison.columns.portfolio')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.comparison.columns.return')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.comparison.columns.risk')}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-normal">
                    {t('opt.comparison.columns.sharpe')}
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row" className={`px-2 py-1 text-left font-normal ${row.tone}`}>
                      {row.name}
                    </th>
                    <td className="px-2 py-1 text-right">{pct(row.point.returnPct)}</td>
                    <td className="px-2 py-1 text-right">{pct(row.point.volatilityPct)}</td>
                    <td className="px-2 py-1 text-right">{ratio(row.point.sharpe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.frontier.portfolio && (
              <p className="mt-1 text-secondary">{t('opt.comparison.noPortfolio')}</p>
            )}
          </section>
        </div>
      </ScrollArea>
    </Panel>
  )
}
