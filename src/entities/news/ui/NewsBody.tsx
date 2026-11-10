import type { ReactNode } from 'react'
import { SECURITY_CARD_NODE, type RichTextDoc } from '@/shared/api/contracts'
import { RichTextView } from '@/shared/ui/rich-text/RichTextView'

interface NewsBodyProps {
  body: RichTextDoc
  /** A "CMarket security" card: the security, its code as the editor wrote it. */
  renderSecurity: (securityId: string, code: string | null) => ReactNode
}

/**
 * An ARTICLE's body as readers see it (spec section 16): the editor's paragraphs, subheadings,
 * lists, quotes, tables, images with their credit and links, and its "CMarket security" cards.
 */
export function NewsBody({ body, renderSecurity }: NewsBodyProps) {
  return (
    <RichTextView
      doc={body}
      renderBlock={(node) => {
        if (node.type !== SECURITY_CARD_NODE) return null
        const securityId = node.attrs?.securityId
        if (typeof securityId !== 'string' || !securityId) return null
        return renderSecurity(
          securityId,
          typeof node.attrs?.code === 'string' ? node.attrs.code : null,
        )
      }}
    />
  )
}
