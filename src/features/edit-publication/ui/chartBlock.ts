import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { CHART_NODE } from '@/shared/lib/richText'
import { ChartNodeView } from './ChartNodeView'

/** "CMarket chart": a block that holds the id of a chart frozen by POST /publications/{id}/charts. */
export const ChartBlock = Node.create({
  name: CHART_NODE,
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      chartId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chart-id'),
        renderHTML: (attributes) => ({ 'data-chart-id': attributes.chartId as string }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'figure[data-cmarket-chart]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes({ 'data-cmarket-chart': '' }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView)
  },
})
