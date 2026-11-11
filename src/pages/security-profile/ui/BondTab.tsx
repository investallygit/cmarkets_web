import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { BondPricingInputsPanel, useBondPricingStore } from '@/features/price-bond'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { securityPath, type SecurityFunction } from '@/shared/routes/paths'
import {
  BondCharacteristicsPanel,
  BondRatingsPanel,
  PriceYieldHistoryPanel,
  RatingHistoryPanel,
  TodayAnalyticsPanel,
  UpcomingCashFlowsPanel,
} from '@/widgets/bond-profile-panels'
import {
  CashFlowSchedulePanel,
  PriceYieldPanel,
  PricingResultsPanel,
  RateSensitivityPanel,
} from '@/widgets/bond-pricing-panels'
import { RedemptionSchedulePanel } from '@/widgets/redemption-schedule-panel'
import { SecurityDocumentsPanel } from '@/widgets/security-documents-panel'
import { defaultLayout, layoutKey } from '../config/layouts'

export type BondFunction = Extract<SecurityFunction, 'des' | 'gp' | 'bp' | 'cf' | 'rat'>

/**
 * Screen 20, a bond's own tabs: DES as its mockup (price and yield history, today's analytics,
 * ratings, characteristics, upcoming cash flows, documents and news), GP, the history alone; BP,
 * the bond's pricing with the panels of screen 16; CF, the whole schedule; RAT, the ratings.
 */
export function BondTab({ fn, security }: { fn: BondFunction; security: SecurityProfileDto }) {
  if (fn === 'bp') return <BondPricingTab security={security} />
  const { id } = security
  const panels: Record<Exclude<BondFunction, 'bp'>, Record<string, ReactNode>> = {
    des: {
      history: <PriceYieldHistoryPanel bondId={id} />,
      analytics: <TodayAnalyticsPanel bondId={id} />,
      ratings: <BondRatingsPanel bondId={id} />,
      characteristics: <BondCharacteristicsPanel bondId={id} />,
      cashFlows: <UpcomingCashFlowsPanel bondId={id} />,
      documents: <SecurityDocumentsPanel securityId={id} />,
    },
    gp: { history: <PriceYieldHistoryPanel bondId={id} /> },
    cf: {
      schedule: <RedemptionSchedulePanel securityId={id} />,
      cashFlows: <UpcomingCashFlowsPanel bondId={id} />,
      characteristics: <BondCharacteristicsPanel bondId={id} />,
    },
    rat: {
      ratings: <BondRatingsPanel bondId={id} />,
      analytics: <TodayAnalyticsPanel bondId={id} />,
      history: <RatingHistoryPanel bondId={id} />,
    },
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey(fn, security.type)}
      defaultLayout={defaultLayout(fn, security.type)}
      panels={panels[fn]}
    />
  )
}

/**
 * BP inside the profile: screen 16's panels on the bond, its form shared with BP's own screen.
 * Another bond of the drop-down opens that bond's profile on the same tab.
 */
function BondPricingTab({ security }: { security: SecurityProfileDto }) {
  const navigate = useNavigate()
  const submitted = useBondPricingStore((state) => state.submitted)
  const currency = useBondPricingStore((state) => state.form?.currency ?? security.currency)
  const panels = {
    inputs: (
      <BondPricingInputsPanel
        bondId={security.id}
        onBondChange={(bondId) => void navigate(securityPath(bondId, 'bp'))}
      />
    ),
    results: <PricingResultsPanel request={submitted} currency={currency} />,
    cashFlows: <CashFlowSchedulePanel request={submitted} />,
    priceYield: <PriceYieldPanel request={submitted} />,
    sensitivity: <RateSensitivityPanel request={submitted} />,
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey('bp', security.type)}
      defaultLayout={defaultLayout('bp', security.type)}
      panels={panels}
    />
  )
}
