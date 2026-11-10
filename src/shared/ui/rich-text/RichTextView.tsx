import type { ReactNode } from 'react'
import type { RichTextDoc, RichTextNode } from '@/shared/api/contracts'
import { resolveApiUrl } from '@/shared/config/env'

/** Links open other sites; images come from the attachments; nothing else is followed. */
const SAFE_LINK = /^(https?:|mailto:)/i
const SAFE_IMAGE = /^(https:|data:image\/(png|jpeg|webp|gif);base64,|\/)/i

/** A node of the app's own (a frozen chart, a security card): what to draw, or undefined for nothing. */
export type RenderBlock = (node: RichTextNode) => ReactNode

const span = (value: unknown) => (typeof value === 'number' && value > 1 ? value : undefined)

function Inline({ node }: { node: RichTextNode }) {
  let content: ReactNode = node.text
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') content = <strong>{content}</strong>
    if (mark.type === 'italic') content = <em>{content}</em>
    if (mark.type === 'link') {
      const href = String(mark.attrs?.href ?? '')
      if (SAFE_LINK.test(href)) {
        content = (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow">
            {content}
          </a>
        )
      }
    }
  }
  return content
}

function nodes(content: readonly RichTextNode[] | undefined, renderBlock: RenderBlock | undefined) {
  return (content ?? []).map((node, index) => (
    <Node key={index} node={node} renderBlock={renderBlock} />
  ))
}

function Node({ node, renderBlock }: { node: RichTextNode; renderBlock?: RenderBlock }): ReactNode {
  const children = nodes(node.content, renderBlock)
  switch (node.type) {
    case 'text':
      return <Inline node={node} />
    case 'paragraph':
      return <p>{children}</p>
    case 'heading':
      return node.attrs?.level === 3 ? <h3>{children}</h3> : <h2>{children}</h2>
    case 'bulletList':
      return <ul>{children}</ul>
    case 'orderedList':
      return <ol start={span(node.attrs?.start)}>{children}</ol>
    case 'listItem':
      return <li>{children}</li>
    case 'blockquote':
      return <blockquote>{children}</blockquote>
    case 'hardBreak':
      return <br />
    case 'table':
      return (
        <table>
          <tbody>{children}</tbody>
        </table>
      )
    case 'tableRow':
      return <tr>{children}</tr>
    case 'tableHeader':
    case 'tableCell': {
      const Cell = node.type === 'tableHeader' ? 'th' : 'td'
      return (
        <Cell colSpan={span(node.attrs?.colspan)} rowSpan={span(node.attrs?.rowspan)}>
          {children}
        </Cell>
      )
    }
    case 'image': {
      const src = String(node.attrs?.src ?? '')
      if (!SAFE_IMAGE.test(src)) return null
      const image = <img src={resolveApiUrl(src)} alt={String(node.attrs?.alt ?? '')} />
      const credit = typeof node.attrs?.credit === 'string' ? node.attrs.credit.trim() : ''
      // A news image shows its credit (spec section 16).
      return credit ? (
        <figure>
          {image}
          <figcaption>{credit}</figcaption>
        </figure>
      ) : (
        image
      )
    }
    default:
      return renderBlock ? renderBlock(node) : <>{children}</>
  }
}

interface RichTextViewProps {
  doc: RichTextDoc
  /** The nodes of the app's own: a publication's charts, a news item's security cards. */
  renderBlock?: RenderBlock
}

/**
 * A document of the studios' editor as readers see it, drawn from its JSON without loading the
 * editor. Only the editor's nodes are known; links and images are checked.
 */
export function RichTextView({ doc, renderBlock }: RichTextViewProps) {
  return <div className="publication-text">{nodes(doc.content, renderBlock)}</div>
}
