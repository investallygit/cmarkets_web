import { useMemo, type ReactNode } from 'react'
import type { FrozenChartDto, RichTextDoc, RichTextNode } from '@/shared/api/contracts'
import { resolveApiUrl } from '@/shared/config/env'
import { CHART_NODE } from '@/shared/lib/richText'
import { FrozenChart } from './FrozenChart'

/** Links open other sites; images come from the attachments; nothing else is followed. */
const SAFE_LINK = /^(https?:|mailto:)/i
const SAFE_IMAGE = /^(https:|data:image\/(png|jpeg|webp|gif);base64,|\/)/i

type Charts = ReadonlyMap<string, FrozenChartDto>

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

function nodes(content: readonly RichTextNode[] | undefined, charts: Charts): ReactNode[] {
  return (content ?? []).map((node, index) => <Node key={index} node={node} charts={charts} />)
}

function Node({ node, charts }: { node: RichTextNode; charts: Charts }): ReactNode {
  const children = nodes(node.content, charts)
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
      return SAFE_IMAGE.test(src) ? (
        <img src={resolveApiUrl(src)} alt={String(node.attrs?.alt ?? '')} />
      ) : null
    }
    case CHART_NODE: {
      const chart = charts.get(String(node.attrs?.chartId))
      return chart ? <FrozenChart chart={chart} /> : null
    }
    default:
      return <>{children}</>
  }
}

interface PublicationBodyProps {
  body: RichTextDoc
  charts: readonly FrozenChartDto[]
}

/**
 * The body of a publication as readers see it, drawn from the editor's JSON without loading the
 * editor. Only the nodes of the studio's toolbar are known; links and images are checked.
 */
export function PublicationBody({ body, charts }: PublicationBodyProps) {
  const byId = useMemo(() => new Map(charts.map((chart) => [chart.id, chart])), [charts])
  return <div className="publication-text">{nodes(body.content, byId)}</div>
}
