import { useSearchParams } from 'react-router'
import { useXafCrosses } from '@/entities/rate'
import { ScreenWorkspace } from '@/features/workspace-layout'
import {
  EuroBenchmarksPanel,
  FxChartPanel,
  FxConverterPanel,
  FxHeader,
  FxMatrixPanel,
  XafCrossesPanel,
} from '@/widgets/fx-dashboard-panels'
import { FX_DASHBOARD_LAYOUT } from '../config/layout'

/**
 * Screen 26, FX (spec section 9): the parity, then the cross rates against XAF, the chart of the
 * currency picked in them (?currency=, the table's first by default, as MKT's rates panel links
 * it), the converter, the cross-rate matrix and the euro area's benchmarks.
 */
export function FxDashboardPage() {
  const [params, setParams] = useSearchParams()
  const crosses = useXafCrosses()
  const asked = params.get('currency')?.toUpperCase()
  const list = crosses.data?.crosses
  const selected =
    list?.find((cross) => cross.currency === asked)?.currency ?? list?.at(0)?.currency
  const select = (currency: string) => setParams({ currency }, { replace: true })

  const panels = {
    crosses: <XafCrossesPanel selected={selected} onSelect={select} />,
    chart: <FxChartPanel currency={selected} pending={crosses.isPending} />,
    converter: <FxConverterPanel />,
    matrix: <FxMatrixPanel />,
    euro: <EuroBenchmarksPanel />,
  }
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <FxHeader />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="FX" defaultLayout={FX_DASHBOARD_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
