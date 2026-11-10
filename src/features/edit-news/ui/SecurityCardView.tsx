import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react'
import { clsx } from 'clsx'
import { QuoteCard } from '@/entities/quote'

/** A CMarket security card in the editor, drawn as readers will see it. */
export function SecurityCardView({ node, selected }: ReactNodeViewProps) {
  const securityId = String(node.attrs.securityId ?? '')
  const code = typeof node.attrs.code === 'string' ? node.attrs.code : null
  return (
    <NodeViewWrapper
      data-drag-handle
      className={clsx(selected && 'outline-1 outline-offset-2 outline-accent-amber')}
    >
      <QuoteCard securityId={securityId} code={code} linked={false} />
    </NodeViewWrapper>
  )
}
