import { useState, type ReactNode } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityFunction } from '@/shared/routes/paths'
import {
  CommodityComparePanel,
  CommodityCorrelationPanel,
  CommodityDataPanel,
  CommodityDescriptionPanel,
  CommodityHistoryPanel,
  CommodityLinksPanel,
  CommodityStatisticsPanel,
  initialComparison,
  type ComparisonChoice,
} from '@/widgets/commodity-profile-panels'
import { defaultLayout, layoutKey } from '../config/layouts'
import type { ProfiledSecurity } from '../model/profiledSecurity'

export type CommodityFunction = Extract<SecurityFunction, 'des' | 'gp' | 'cmp'>

/**
 * Screen 21, a commodity's own tabs: DES as its mockup (the history, the statistics, the
 * description, the data, the CEMAC links); GP, the history; CMP, up to five series rebased to 100
 * with their correlations, the series picked kept while the tab shows.
 */
export function CommodityTab({
  fn,
  security,
  reference,
}: {
  fn: CommodityFunction
  security: ProfiledSecurity
  /** The series the statistics correlate it with, CMP's second at first. */
  reference: string | null
}) {
  const { id, type } = security
  const [choice, setChoice] = useState<ComparisonChoice>(() => ({
    codes: initialComparison(id, reference),
    period: '5Y',
  }))
  const panels: Record<CommodityFunction, Record<string, ReactNode>> = {
    des: {
      history: <CommodityHistoryPanel code={id} />,
      statistics: <CommodityStatisticsPanel code={id} />,
      description: <CommodityDescriptionPanel code={id} />,
      data: <CommodityDataPanel code={id} />,
      links: <CommodityLinksPanel code={id} />,
    },
    gp: { history: <CommodityHistoryPanel code={id} /> },
    cmp: {
      compare: <CommodityComparePanel code={id} choice={choice} onChange={setChoice} />,
      correlations: <CommodityCorrelationPanel choice={choice} />,
      statistics: <CommodityStatisticsPanel code={id} />,
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
