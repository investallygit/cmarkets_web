import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AreaChart } from '@/shared/ui/charts/AreaChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { useIndexHistory, useMarketSummary } from '../api'
import { useLiveIndex } from '../live/hooks'
import { CHART_PERIODS, isIntraday, type ChartPeriod } from '../periods'
import { INDEX_DECIMALS } from '../price'
import { useMarketSelection } from '../selection'

const PERIOD_OPTIONS = CHART_PERIODS.map((period) => ({ value: period, label: period }))

/** Screen 1, central chart: the selected index, periods 1D to 5Y. API /indices/{code}/history. */
export function IndexChartPanel() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<ChartPeriod>('1Y')
  const summary = useMarketSummary()
  const selectedCode = useMarketSelection((state) => state.indexCode)
  const index =
    summary.data?.indices.find((item) => item.code === selectedCode) ?? summary.data?.indices.at(0)
  const history = useIndexHistory(index?.code, period)
  const liveValue = useLiveIndex(index?.code ?? '')?.value

  return (
    <Panel
      title={index?.name ?? t('panels.indexChart')}
      code="GP"
      options={<PanelTabs value={period} options={PERIOD_OPTIONS} onChange={setPeriod} />}
    >
      <QueryView query={history}>
        {(points) => (
          <AreaChart
            points={points}
            intraday={isIntraday(period)}
            decimals={INDEX_DECIMALS}
            liveValue={liveValue}
          />
        )}
      </QueryView>
    </Panel>
  )
}
