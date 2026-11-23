import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useIndexPerformance } from '@/entities/market'
import { useFormat, useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { monthGrid } from '../lib/series'

/**
 * Screen 31's PERF tab: the index's return by month, a year a row, and the year's total, each from
 * the last close of the period before; green when it rose, red when it fell.
 * API /indices/{code}/performance.
 */
export function IndexReturnsPanel({ code }: { code: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const performance = useIndexPerformance(code)
  const monthNames = Array.from({ length: 12 }, (_, month) =>
    new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2026, month, 1))),
  )
  const header = 'h-row px-1.5 font-sans text-data font-normal text-secondary'
  const tone = (value: number | null) =>
    value === null ? 'text-secondary' : value > 0 ? 'text-up' : value < 0 ? 'text-down' : ''

  return (
    <Panel title={t('panels.indexReturns')} code="PERF">
      <QueryView query={performance} isEmpty={(data) => data.months.length === 0}>
        {(data) => (
          <ScrollArea className="h-full">
            <table className="w-full border-collapse font-mono text-data tabular-nums">
              <caption className="sr-only">{t('panels.indexReturns')}</caption>
              <thead className="bg-panel-header">
                <tr>
                  <th scope="col" className={clsx(header, 'text-left')}>
                    {t('indexProfile.performance.year')}
                  </th>
                  {monthNames.map((name) => (
                    <th key={name} scope="col" className={clsx(header, 'text-right')}>
                      {name}
                    </th>
                  ))}
                  <th scope="col" className={clsx(header, 'text-right')}>
                    {t('indexProfile.performance.total')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthGrid(data.months).map((row, index) => {
                  const total = data.years.find((year) => year.year === row.year)?.returnPct ?? null
                  return (
                    <tr key={row.year} className={clsx('h-row', index % 2 === 1 && 'bg-row-alt')}>
                      <th scope="row" className="px-1.5 text-left font-normal">
                        {row.year}
                      </th>
                      {row.months.map((value, month) => (
                        <td key={month} className={clsx('px-1.5 text-right', tone(value))}>
                          {value === null ? '—' : format.signed(value, 1)}
                        </td>
                      ))}
                      <td className={clsx('px-1.5 text-right font-semibold', tone(total))}>
                        {total === null ? '—' : format.percent(total, 1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </QueryView>
    </Panel>
  )
}
