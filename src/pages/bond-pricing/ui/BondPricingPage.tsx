import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useBonds } from '@/entities/bond'
import { BondPricingInputsPanel, useBondPricingStore } from '@/features/price-bond'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { bondPricingPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import {
  CashFlowSchedulePanel,
  PriceYieldPanel,
  PricingResultsPanel,
  RateSensitivityPanel,
} from '@/widgets/bond-pricing-panels'
import { BOND_PRICING_LAYOUT } from '../config/layout'

/** The currency of the amounts until the form is filled: the CEMAC's. */
const XAF = 'XAF'

/**
 * Screen 16, bond pricing (BP): "ECMR 6.25 2029 BP" (/bp/{bondId}) opens it on that bond, BP and
 * YAS alone on the first of the master list. The inputs on the left; the results, the cash-flow
 * schedule, the price-yield curve and the rate sensitivity of the last calculation.
 */
export function BondPricingPage() {
  const { t } = useTranslation()
  const { bondId } = useParams()
  const navigate = useNavigate()
  const bonds = useBonds()
  const current = bondId ?? bonds.data?.at(0)?.id ?? null
  const submitted = useBondPricingStore((state) => state.submitted)
  const currency = useBondPricingStore((state) => state.form?.currency ?? XAF)

  const panels = {
    inputs:
      current !== null ? (
        <BondPricingInputsPanel
          bondId={current}
          onBondChange={(id) => void navigate(bondPricingPath(id))}
        />
      ) : (
        <Panel title={t('bondPricing.inputs')} code="BP">
          <QueryView
            query={bonds}
            isEmpty={(list) => list.length === 0}
            emptyMessage={t('calculator.noBond')}
          >
            {() => null}
          </QueryView>
        </Panel>
      ),
    results: <PricingResultsPanel request={submitted} currency={currency} />,
    cashFlows: <CashFlowSchedulePanel request={submitted} />,
    priceYield: <PriceYieldPanel request={submitted} />,
    sensitivity: <RateSensitivityPanel request={submitted} />,
  }
  return <ScreenWorkspace screenId="BP" defaultLayout={BOND_PRICING_LAYOUT} panels={panels} />
}
