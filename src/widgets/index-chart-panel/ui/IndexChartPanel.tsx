import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIndexHistory, useMarketSummary } from '@/entities/market'
import { INDEX_DECIMALS, useLiveIndex } from '@/entities/quote'
import { CHART_PERIODS, isIntraday, type ChartPeriod } from '@/shared/lib/chartPeriods'
import { AreaChart } from '@/shared/ui/charts/AreaChart'
import { useChartLabel } from '@/shared/ui/charts/useChartLabel'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

const PERIOD_OPTIONS = CHART_PERIODS.map((period) => ({ value: period, label: period }))
const NO_VALUES: readonly { close: number }[] = []

/**
 * Screen 1, central chart: the given index (null: the first one), periods 1D to 5Y.
 * API /indices/{code}/history.
 */
export function IndexChartPanel({ indexCode = null }: { indexCode?: string | null }) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<ChartPeriod>('1Y')
  const summary = useMarketSummary()
  const index =
    summary.data?.indices.find((item) => item.code === indexCode) ?? summary.data?.indices.at(0)
  const history = useIndexHistory(index?.code, period)
  const liveValue = useLiveIndex(index?.code ?? '')?.value
  const values = useMemo(
    () => history.data?.map((point) => ({ close: point.value })) ?? NO_VALUES,
    [history.data],
  )
  const label = useChartLabel(index?.name ?? '', period, values, INDEX_DECIMALS, liveValue)

  return (
    <Panel
      title={index?.name ?? t('panels.indexChart')}
      code="GP"
      options={<PanelTabs value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />}
    >
      {/* The history waits for the summary that names the index: its failure shows here. */}
      {index ? (
        <QueryView query={history}>
          {(points) => (
            <AreaChart
              points={points}
              label={label}
              intraday={isIntraday(period)}
              decimals={INDEX_DECIMALS}
              liveValue={liveValue}
            />
          )}
        </QueryView>
      ) : (
        <QueryView query={summary}>{() => <PanelEmpty />}</QueryView>
      )}
    </Panel>
  )
}
