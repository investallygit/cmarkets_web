import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { useBonds } from '@/entities/bond'
import { BondPricingInputsPanel, useBondPricingStore } from '@/features/price-bond'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { bondPricingPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import {
  CalculationMethodPanel,
  CashFlowSchedulePanel,
  CurveUsedPanel,
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
 * schedule, the calculation method, the price-yield curve (or the curve used, fifth version) and
 * the rate sensitivity of the last calculation.
 */
export function BondPricingPage() {
  const { t } = useTranslation()
  const { bondId } = useParams()
  const navigate = useNavigate()
  const bonds = useBonds()
  const current = bondId ?? bonds.data?.at(0)?.id ?? null
  const calculated = useBondPricingStore((state) => state.submitted)
  const seededFrom = useBondPricingStore((state) => state.seededFrom)
  const currency = useBondPricingStore((state) => state.form?.currency ?? XAF)
  const country = useBondPricingStore((state) => state.form?.country ?? null)
  // The figures of the bond the inputs hold: not the last bond's beside a bond the address names
  // and the API does not know (B56).
  const submitted = seededFrom === current ? calculated : null

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
    // From a curve or rates entered, the curve used in place of the price-yield relationship.
    priceYield: submitted?.discount ? (
      <CurveUsedPanel request={submitted} country={country} />
    ) : (
      <PriceYieldPanel request={submitted} />
    ),
    sensitivity: <RateSensitivityPanel request={submitted} />,
    method: <CalculationMethodPanel request={submitted} />,
  }
  return <ScreenWorkspace screenId="BP" defaultLayout={BOND_PRICING_LAYOUT} panels={panels} />
}
