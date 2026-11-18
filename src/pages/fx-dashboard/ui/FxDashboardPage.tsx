import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      <div className="flex shrink-0 flex-col gap-1 px-2 pt-2">
        <FxHeader />
        {/* A currency the table has not is said, as ECO says an unknown economy (B11). */}
        {asked && list && selected !== asked && (
          <p role="status" className="font-sans text-data text-warning">
            {t('fx.unknownCurrency', { code: asked, currency: selected ?? '' })}
          </p>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="FX" defaultLayout={FX_DASHBOARD_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
