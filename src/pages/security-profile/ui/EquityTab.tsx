import { lazy, Suspense, type ReactNode } from 'react'
import { tradesAtFixing } from '@/entities/security'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { DividendsPanel } from '@/widgets/dividends-panel'
import {
  FinancialStatementsPanel,
  FinancialSummaryPanel,
} from '@/widgets/financial-statements-panel'
import { KeyDataPanel } from '@/widgets/key-data-panel'
import { PriceChartPanel } from '@/widgets/price-chart-panel'
import { RatiosPanel } from '@/widgets/ratios-panel'
import { RecentSessionsPanel } from '@/widgets/recent-sessions-panel'
import { SecurityDescriptionPanel } from '@/widgets/security-description-panel'
import { SecurityDocumentsPanel } from '@/widgets/security-documents-panel'
import { ShareholdersPanel } from '@/widgets/shareholders-panel'
import { defaultLayout, layoutKey } from '../config/layouts'

// The chart library of the comparison loads with the FA tab, not with every profile.
const FundamentalsComparison = lazy(() =>
  import('./FundamentalsComparison').then((module) => ({
    default: module.FundamentalsComparison,
  })),
)

export type EquityFunction = Extract<SecurityFunction, 'des' | 'gp' | 'fa' | 'dvd' | 'hds'>

/**
 * Screen 2, an equity's own tabs: DES as its mockup of the fifth version (the closing prices, the
 * description, the prices of recent sessions, key data, dividends, documents and news), GP, FA with
 * the panels of EQS, DVD and HDS.
 */
export function EquityTab({ fn, security }: { fn: EquityFunction; security: SecurityProfileDto }) {
  const { id, type, currency, code } = security
  const chart = (variant: 'compact' | 'full') => (
    <PriceChartPanel
      securityId={id}
      code={code}
      securityType={type}
      currency={currency}
      variant={variant}
      atFixing={tradesAtFixing(security)}
    />
  )
  const keyData = <KeyDataPanel profile={security} />
  const panels: Record<EquityFunction, Record<string, ReactNode>> = {
    des: {
      chart: chart('compact'),
      description: <SecurityDescriptionPanel id={id} code={code} screen="DES" />,
      sessions: <RecentSessionsPanel profile={security} />,
      keydata: keyData,
      income: <DividendsPanel securityId={id} />,
      documents: <SecurityDocumentsPanel securityId={id} />,
    },
    gp: { chart: chart('full') },
    fa: {
      comparison: (
        <Suspense fallback={<PanelLoading />}>
          <FundamentalsComparison security={security} />
        </Suspense>
      ),
      ratios: <RatiosPanel securityId={id} code={code} />,
      statements: <FinancialStatementsPanel securityId={id} code={code} />,
      summary: <FinancialSummaryPanel securityId={id} code={code} />,
      chart: chart('compact'),
    },
    dvd: {
      dividends: <DividendsPanel securityId={id} variant="full" />,
      keydata: keyData,
      chart: chart('compact'),
    },
    hds: {
      shareholders: <ShareholdersPanel securityId={id} />,
      keydata: keyData,
      chart: chart('compact'),
    },
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey(fn, type)}
      defaultLayout={defaultLayout(fn, type)}
      panels={panels[fn]}
    />
  )
}
