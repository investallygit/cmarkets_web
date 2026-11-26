import { ScreenWorkspace } from '@/features/workspace-layout'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import {
  BeacIndicators,
  InterbankPanel,
  LiquidityOperationsPanel,
  MonetaryAggregatesPanel,
  PolicyDecisionsPanel,
  RateCorridorPanel,
} from '@/widgets/beac-panels'
import { BEAC_LAYOUT } from '../config/layout'

/**
 * BEAC, the BEAC's monetary policy and the CEMAC's liquidity (screen 34, sixth version; ROADMAP
 * step 65): the indicators, the rate corridor since 2019, the Monetary Policy Committee's
 * decisions with their releases, the liquidity injections, the interbank market and the monetary
 * aggregates, from the Data admin's four files (decision 59).
 */
export function BeacPage() {
  const today = useMarketDay()
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <BeacIndicators />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="BEAC"
          defaultLayout={BEAC_LAYOUT}
          panels={{
            corridor: <RateCorridorPanel today={today} />,
            decisions: <PolicyDecisionsPanel today={today} />,
            operations: <LiquidityOperationsPanel />,
            interbank: <InterbankPanel />,
            aggregates: <MonetaryAggregatesPanel />,
          }}
        />
      </div>
    </div>
  )
}
