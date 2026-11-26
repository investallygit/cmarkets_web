import { useTranslation } from 'react-i18next'
import { aggregateUnit, periodLabel, useBeacAggregates } from '@/entities/beac'
import type { MonetaryFigureDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/**
 * The CEMAC's monetary aggregates (screen 34): M2 and the credit to the economy over a year, the
 * FX reserves in months of imports, the external coverage, the inflation and the growth forecast,
 * each with its month or year. API /beac/aggregates.
 */
export function MonetaryAggregatesPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const aggregates = useBeacAggregates()
  const value = (figure: MonetaryFigureDto) => {
    const unit = aggregateUnit(figure.indicator)
    if (unit === 'months')
      return t('beac.aggregates.months', { value: format.number(figure.value, 1) })
    return format.percent(figure.value, 1, unit === 'growth')
  }

  return (
    <Panel
      title={t('panels.beacAggregates')}
      code="BEAC"
      options={t('beac.aggregates.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={aggregates}
        isEmpty={(result) => result.items.length === 0}
        emptyMessage={t('beac.aggregates.empty')}
      >
        {(result) => (
          <ScrollArea className="min-h-0 flex-1">
            <dl className="font-sans text-data">
              {result.items.map((figure) => (
                <div
                  key={figure.indicator}
                  className="flex items-center justify-between gap-3 border-b px-3 py-1.5 even:bg-row-alt"
                >
                  <dt className="min-w-0">
                    <span className="block text-primary">
                      {t(`beac.aggregates.items.${figure.indicator}`)}
                    </span>
                    <span className="block font-mono text-title text-secondary">
                      {periodLabel(figure.period, figure.yearly)}
                    </span>
                  </dt>
                  <dd className="shrink-0 text-right font-mono text-accent-amber tabular-nums">
                    {value(figure)}
                  </dd>
                </div>
              ))}
            </dl>
          </ScrollArea>
        )}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {aggregates.data?.illustrative
          ? t('beac.aggregates.illustrative')
          : t('beac.aggregates.source')}
      </p>
    </Panel>
  )
}
