import { useTranslation } from 'react-i18next'
import { useEtfPerformance } from '@/entities/etf'
import type { EtfPerformanceDto, EtfPeriod, EtfReturnDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH } from './words'

interface EtfPerformancePanelProps {
  etfId: string
  /** The periods shown, all of them by default (PERF). */
  periods?: readonly EtfPeriod[]
  code?: string
}

/**
 * Screen 19, performance: the ETF's total return, its benchmark index's and the gap in points
 * over each period, 3 and 5 years (and since inception past a year) per year. API
 * /etfs/{id}/performance.
 */
export function EtfPerformancePanel({ etfId, periods, code = 'PERF' }: EtfPerformancePanelProps) {
  const { t } = useTranslation()
  const performance = useEtfPerformance(etfId)
  return (
    <Panel
      title={t('panels.etfPerformance')}
      code={code}
      options={<span>{t('etfProfile.performance.legend')}</span>}
      bodyClassName="overflow-y-auto"
    >
      <QueryView query={performance}>
        {(data) => <ReturnsTable data={data} periods={periods} />}
      </QueryView>
    </Panel>
  )
}

function ReturnsTable({
  data,
  periods,
}: {
  data: EtfPerformanceDto
  periods?: readonly EtfPeriod[]
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const rows = periods
    ? periods.flatMap((period) => data.returns.filter((row) => row.period === period))
    : data.returns
  const name = (row: EtfReturnDto) => {
    const period = t(`etfProfile.performance.periods.${row.period}`)
    return row.annualized ? t('etfProfile.performance.perYear', { period }) : period
  }
  const head = 'px-2 py-1 font-sans text-title font-normal text-secondary'
  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th scope="col" className={`${head} text-left`}>
              {t('etfProfile.performance.period')}
            </th>
            <th scope="col" className={`${head} text-right`}>
              {t('etfProfile.performance.etf')}
            </th>
            <th scope="col" className={`${head} text-right`}>
              {data.benchmark
                ? t('etfProfile.performance.index', { index: data.benchmark })
                : t('etfProfile.performance.indexColumn')}
            </th>
            <th scope="col" className={`${head} text-right`}>
              {t('etfProfile.performance.gap')}
            </th>
          </tr>
        </thead>
        <tbody className="font-mono text-data">
          {rows.map((row) => (
            <tr key={row.period} className="even:bg-panel-header/40">
              <th scope="row" className="px-2 py-1 text-left font-normal">
                {name(row)}
              </th>
              <td className="px-2 py-1 text-right">
                {row.etfPct === null ? (
                  DASH
                ) : (
                  <ChangeText value={row.etfPct} percent decimals={1} />
                )}
              </td>
              <td className="px-2 py-1 text-right">
                {row.indexPct === null ? DASH : format.percent(row.indexPct, 1)}
              </td>
              <td className="px-2 py-1 text-right">
                {row.gapPts === null ? DASH : format.signed(row.gapPts, 1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.returns.every((row) => row.indexPct === null) && (
        <p className="px-2 py-1 font-sans text-title text-secondary">
          {t('etfProfile.performance.noIndex')}
        </p>
      )}
    </div>
  )
}
