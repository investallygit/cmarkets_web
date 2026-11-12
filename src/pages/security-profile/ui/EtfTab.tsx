import type { ReactNode } from 'react'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'
import { EtfBlocksPanel } from '@/widgets/etf-blocks-panel'
import { PriceChartPanel } from '@/widgets/price-chart-panel'
import { SecurityDocumentsPanel } from '@/widgets/security-documents-panel'
import { defaultLayout, layoutKey } from '../config/layouts'

export type EtfFunction = Extract<SecurityFunction, 'des' | 'gp'>

/**
 * An ETF's own tabs until screen 19's mockup (ROADMAP step 33): DES with its price chart, the five
 * blocks of ETFS and its documents and news; GP, the chart.
 */
export function EtfTab({ fn, security }: { fn: EtfFunction; security: SecurityProfileDto }) {
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
  const panels: Record<EtfFunction, Record<string, ReactNode>> = {
    des: {
      chart: chart('compact'),
      blocks: <EtfBlocksPanel etfId={id} profileLink={false} code="DES" />,
      documents: <SecurityDocumentsPanel securityId={id} />,
    },
    gp: { chart: chart('full') },
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey(fn, type)}
      defaultLayout={defaultLayout(fn, type)}
      panels={panels[fn]}
    />
  )
}
