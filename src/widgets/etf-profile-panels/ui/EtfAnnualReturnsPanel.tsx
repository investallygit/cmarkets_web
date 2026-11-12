import { useTranslation } from 'react-i18next'
import { useEtfAnnualReturns } from '@/entities/etf'
import type { EtfAnnualReturnsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH } from './words'

/**
 * PERF, the calendar years: each year's total return, the fund's and its index's, and the gap in
 * points, the latest first, the current year to date. API /etfs/{id}/annual-returns.
 */
export function EtfAnnualReturnsPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const years = useEtfAnnualReturns(etfId)
  return (
    <Panel title={t('panels.etfAnnualReturns')} code="PERF" bodyClassName="overflow-y-auto">
      <QueryView query={years}>
        {(data) =>
          data.years.length === 0 ? (
            <p className="p-3 font-sans text-data text-secondary">{t('etfProfile.annual.empty')}</p>
          ) : (
            <YearsTable data={data} />
          )
        }
      </QueryView>
    </Panel>
  )
}

function YearsTable({ data }: { data: EtfAnnualReturnsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const head = 'px-2 py-1 font-sans text-title font-normal text-secondary'
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" className={`${head} text-left`}>
            {t('etfProfile.annual.year')}
          </th>
          <th scope="col" className={`${head} text-right`}>
            {t('etfProfile.annual.etf')}
          </th>
          <th scope="col" className={`${head} text-right`}>
            {data.benchmark ?? t('etfProfile.annual.index')}
          </th>
          <th scope="col" className={`${head} text-right`}>
            {t('etfProfile.annual.gap')}
          </th>
        </tr>
      </thead>
      <tbody className="font-mono text-data">
        {data.years.map((year) => (
          <tr key={year.year} className="even:bg-panel-header/40">
            <th scope="row" className="px-2 py-1 text-left font-normal">
              {year.toDate ? t('etfProfile.annual.toDate', { year: year.year }) : year.year}
            </th>
            <td className="px-2 py-1 text-right">
              {year.etfPct === null ? (
                DASH
              ) : (
                <ChangeText value={year.etfPct} percent decimals={1} />
              )}
            </td>
            <td className="px-2 py-1 text-right">
              {year.indexPct === null ? DASH : format.percent(year.indexPct, 1)}
            </td>
            <td className="px-2 py-1 text-right">
              {year.gapPts === null ? DASH : format.signed(year.gapPts, 1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
