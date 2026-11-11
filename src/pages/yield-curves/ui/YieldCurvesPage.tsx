import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useBonds } from '@/entities/bond'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { yieldCurvesPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { AuctionsPanel } from '@/widgets/auctions-panel'
import { BondCalculatorPanel } from '@/widgets/bond-calculator-panel'
import { YieldCurvesPanel } from '@/widgets/yield-curves-panel'
import { YIELD_CURVES_LAYOUT } from '../config/layout'

/**
 * Screen 4, yield curves and bond calculator: YCRV opens it on the first listed bond, /ycrv/{bondId}
 * on that bond. YAS opens BP, bond pricing (screen 16), since the third version of the spec.
 */
export function YieldCurvesPage() {
  const { t } = useTranslation()
  const { bondId } = useParams()
  const navigate = useNavigate()
  const bonds = useBonds()
  const current = bondId ?? bonds.data?.at(0)?.id
  const bond = bonds.data?.find((candidate) => candidate.id === current)

  const panels = {
    curves: <YieldCurvesPanel focusCountry={bond?.country} />,
    calculator: current ? (
      <BondCalculatorPanel
        bondId={current}
        onBondChange={(id) => void navigate(yieldCurvesPath(id))}
      />
    ) : (
      <Panel title={t('panels.bondCalculator')} code="YAS">
        <QueryView
          query={bonds}
          isEmpty={(list) => list.length === 0}
          emptyMessage={t('calculator.noBond')}
        >
          {() => null}
        </QueryView>
      </Panel>
    ),
    auctions: <AuctionsPanel />,
  }
  return <ScreenWorkspace screenId="YCRV" defaultLayout={YIELD_CURVES_LAYOUT} panels={panels} />
}
