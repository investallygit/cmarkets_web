import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { clsx } from 'clsx'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { FrozenChart } from '@/entities/publication'
import { FrozenChartsContext } from './chartsContext'

/** A CMarket chart in the editor, drawn as readers will see it. */
export function ChartNodeView({ node, selected }: ReactNodeViewProps) {
  const { t } = useTranslation()
  const chart = useContext(FrozenChartsContext).get(String(node.attrs.chartId))
  return (
    <NodeViewWrapper
      data-drag-handle
      className={clsx('my-2', selected && 'outline-1 outline-offset-2 outline-accent-amber')}
    >
      {chart ? (
        <FrozenChart chart={chart} />
      ) : (
        <p className="border border-dashed p-3 font-sans text-data text-secondary">
          {t('studio.chart.missing')}
        </p>
      )}
    </NodeViewWrapper>
  )
}
