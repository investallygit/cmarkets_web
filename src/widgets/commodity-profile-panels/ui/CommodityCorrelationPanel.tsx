import { useTranslation } from 'react-i18next'
import {
  useCommodities,
  useCommodityComparison,
  useCommodityNames,
  periodStart,
} from '@/entities/commodity'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import type { ComparisonChoice } from './CommodityComparePanel'

/**
 * Screen 21, CMP's correlation matrix (spec section 9): Pearson's coefficients of the monthly
 * changes of the series compared, over the months of the period; a blank where two series have
 * under six changes in common. API /commodities/compare.
 */
export function CommodityCorrelationPanel({ choice }: { choice: ComparisonChoice }) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const today = useMarketDay()
  const list = useCommodities().data
  const from = periodStart(choice.period, today)
  const comparison = useCommodityComparison(
    choice.codes,
    from === null ? null : `${from.slice(0, 7)}-01`,
  )
  const shortName = (code: string) => {
    const item = list?.find((candidate) => candidate.code === code)
    return item ? names.name(item, true) : code
  }

  return (
    <Panel
      title={t('panels.commodityCorrelations')}
      code="CMP"
      bodyClassName="flex min-h-0 flex-col"
    >
      <QueryView query={comparison}>
        {(data) => (
          <div
            className="min-h-0 flex-1 overflow-auto"
            tabIndex={0}
            aria-label={t('panels.commodityCorrelations')}
          >
            <table className="w-full border-collapse font-mono text-data">
              <caption className="sr-only">{t('commodities.compare.matrix')}</caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="px-2 py-1 text-left font-sans text-title font-normal text-secondary"
                  >
                    <span className="sr-only">{t('commodities.compare.series')}</span>
                  </th>
                  {data.series.map((series) => (
                    <th
                      key={series.code}
                      scope="col"
                      className="px-2 py-1 text-right font-sans text-title font-semibold"
                    >
                      {shortName(series.code)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.series.map((row, rowIndex) => (
                  <tr key={row.code} className="border-t border-border/40">
                    <th
                      scope="row"
                      className="px-2 py-1 text-left font-sans text-label font-semibold"
                    >
                      {shortName(row.code)}
                    </th>
                    {data.correlations[rowIndex].map((value, column) => (
                      <td key={data.series[column].code} className="px-2 py-1 text-right">
                        {value === null ? (
                          <span className="text-secondary">—</span>
                        ) : (
                          format.number(value, 2)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryView>
      <p className="shrink-0 px-2 py-1 font-sans text-title text-secondary">
        {t('commodities.compare.note')}
      </p>
    </Panel>
  )
}
