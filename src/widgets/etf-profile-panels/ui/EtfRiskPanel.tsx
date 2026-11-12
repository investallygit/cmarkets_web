import { useTranslation } from 'react-i18next'
import { useEtfPerformance } from '@/entities/etf'
import type { EtfPerformanceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH, FigureLine } from './words'

/**
 * Screen 19, risk over a year: the volatility over one and three years, the Sharpe ratio (on the
 * trading currency's risk-free rate), the maximum drawdown (its peak and trough as a tooltip), the
 * tracking error and difference, the average bid-ask spread. API /etfs/{id}/performance.
 */
export function EtfRiskPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const performance = useEtfPerformance(etfId)
  return (
    <Panel
      title={t('panels.etfRisk')}
      code="PERF"
      options={<span>{t('etfProfile.risk.window')}</span>}
      bodyClassName="overflow-y-auto"
    >
      <QueryView query={performance}>{(data) => <RiskFigures data={data} />}</QueryView>
    </Panel>
  )
}

function RiskFigures({ data }: { data: EtfPerformanceDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const percent = (value: number | null, decimals: number, signed = false) =>
    value === null ? DASH : format.percent(value, decimals, signed)
  const drawdownDates =
    data.maxDrawdownPeak && data.maxDrawdownTrough
      ? t('etfProfile.risk.drawdownDates', {
          peak: format.isoDate(data.maxDrawdownPeak),
          trough: format.isoDate(data.maxDrawdownTrough),
        })
      : undefined
  return (
    <dl className="py-1">
      <FigureLine
        label={t('etfProfile.risk.volatility')}
        value={`${percent(data.volatility1yPct, 1)} · ${percent(data.volatility3yPct, 1)}`}
      />
      <FigureLine
        label={t('etfProfile.risk.sharpe')}
        value={data.sharpe === null ? DASH : format.number(data.sharpe, 2)}
        title={
          data.riskFreeRatePct === null
            ? undefined
            : t('etfProfile.risk.sharpeRate', {
                rate: format.percent(data.riskFreeRatePct, 2, false),
              })
        }
      />
      <FigureLine
        label={t('etfProfile.risk.drawdown')}
        value={percent(data.maxDrawdownPct, 1, true)}
        title={drawdownDates}
      />
      <FigureLine
        label={t('etfProfile.risk.tracking')}
        value={`${percent(data.trackingErrorPct, 2)} · ${percent(data.trackingDifferencePct, 2, true)}`}
      />
      <FigureLine
        label={t('etfProfile.risk.spread')}
        value={
          data.averageSpreadPct === null
            ? DASH
            : t('etfScreener.spread', {
                pct: format.percent(data.averageSpreadPct, 2, false),
                bp: format.number(data.averageSpreadPct * 100, 0),
              })
        }
      />
    </dl>
  )
}
