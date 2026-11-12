import type { ReactNode } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'
import {
  DES_PERIODS,
  EtfAllocationPanel,
  EtfAnnualReturnsPanel,
  EtfDistributionPolicyPanel,
  EtfDistributionsPanel,
  EtfGrowthPanel,
  EtfHoldingsPanel,
  EtfPerformancePanel,
  EtfPriceHistoryPanel,
  EtfRiskPanel,
  EtfStructurePanel,
} from '@/widgets/etf-profile-panels'
import { PriceChartPanel } from '@/widgets/price-chart-panel'
import { defaultLayout, layoutKey } from '../config/layouts'

export type EtfFunction = Extract<SecurityFunction, 'des' | 'gp' | 'hld' | 'perf' | 'dist'>

/**
 * Screen 19, an ETF's own tabs: DES as its mockup (price and NAV history, performance against the
 * index, risk, the top 10 holdings, the allocation, structure and costs); GP, the price chart;
 * HLD, every line known and the allocations by sector and by region; PERF, the total return
 * against the index, every period, the calendar years and the risk; DIST, the distributions and
 * the fund's policy.
 */
export function EtfTab({ fn, security }: { fn: EtfFunction; security: SecurityProfileDto }) {
  const { id, type, currency, code } = security
  const panels: Record<EtfFunction, Record<string, ReactNode>> = {
    des: {
      history: <EtfPriceHistoryPanel etfId={id} />,
      performance: <EtfPerformancePanel etfId={id} periods={DES_PERIODS} />,
      risk: <EtfRiskPanel etfId={id} />,
      holdings: <EtfHoldingsPanel etfId={id} variant="top" />,
      allocation: <EtfAllocationPanel etfId={id} />,
      structure: <EtfStructurePanel etfId={id} />,
    },
    gp: {
      chart: (
        <PriceChartPanel
          securityId={id}
          code={code}
          securityType={type}
          currency={currency}
          variant="full"
        />
      ),
    },
    hld: {
      holdings: <EtfHoldingsPanel etfId={id} variant="all" />,
      sectors: <EtfAllocationPanel etfId={id} by="sector" />,
      regions: <EtfAllocationPanel etfId={id} by="region" />,
    },
    perf: {
      growth: <EtfGrowthPanel etfId={id} />,
      performance: <EtfPerformancePanel etfId={id} />,
      annual: <EtfAnnualReturnsPanel etfId={id} />,
      risk: <EtfRiskPanel etfId={id} />,
    },
    dist: {
      distributions: <EtfDistributionsPanel etfId={id} />,
      policy: <EtfDistributionPolicyPanel etfId={id} />,
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
