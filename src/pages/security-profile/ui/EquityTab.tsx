import { lazy, Suspense, type ReactNode } from 'react'
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
import { LatestTradesPanel } from '@/widgets/latest-trades-panel'
import { OrderBookPanel } from '@/widgets/order-book-panel'
import { PriceChartPanel } from '@/widgets/price-chart-panel'
import { RatiosPanel } from '@/widgets/ratios-panel'
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
 * Screen 2, an equity's own tabs: DES as its mockup (chart, order book, trades, key data,
 * dividends, documents and news), GP, FA with the panels of EQS, DVD and HDS.
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
    />
  )
  const keyData = <KeyDataPanel profile={security} />
  const panels: Record<EquityFunction, Record<string, ReactNode>> = {
    des: {
      chart: chart('compact'),
      orderbook: <OrderBookPanel securityId={id} securityType={type} currency={currency} />,
      trades: <LatestTradesPanel securityId={id} securityType={type} currency={currency} />,
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
