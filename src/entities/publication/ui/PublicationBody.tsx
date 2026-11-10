import { useMemo } from 'react'
import type { FrozenChartDto, RichTextDoc } from '@/shared/api/contracts'
import { CHART_NODE } from '@/shared/lib/richText'
import { RichTextView } from '@/shared/ui/rich-text/RichTextView'
import { FrozenChart } from './FrozenChart'

interface PublicationBodyProps {
  body: RichTextDoc
  charts: readonly FrozenChartDto[]
}

/**
 * The body of a publication as readers see it: the editor's nodes, and its CMarket charts frozen
 * at insertion.
 */
export function PublicationBody({ body, charts }: PublicationBodyProps) {
  const byId = useMemo(() => new Map(charts.map((chart) => [chart.id, chart])), [charts])
  return (
    <RichTextView
      doc={body}
      renderBlock={(node) => {
        if (node.type !== CHART_NODE) return null
        const chart = byId.get(String(node.attrs?.chartId))
        return chart ? <FrozenChart chart={chart} /> : null
      }}
    />
  )
}
