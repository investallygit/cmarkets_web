import type { RichTextDoc, RichTextNode } from '@/shared/api/contracts'

/** The node of a CMarket chart frozen in a publication; `chartId` points into its charts. */
export const CHART_NODE = 'cmarketChart'

/** A block of a document as plain text: what a PDF or a search index needs. */
export interface TextBlock {
  kind: 'heading' | 'paragraph' | 'item' | 'row' | 'chart' | 'image'
  text: string
  /** Heading level. */
  level?: number
  chartId?: string
}

/** The text of a node and its children, marks left out. */
export function nodeText(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  return (node.content ?? []).map(nodeText).join('')
}

/** Section titles, in order: the table of contents shown before purchase (spec section 13). */
export function docHeadings(doc: RichTextDoc, level = 2): string[] {
  return (doc.content ?? [])
    .filter((node) => node.type === 'heading' && node.attrs?.level === level)
    .map((node) => nodeText(node).trim())
    .filter(Boolean)
}

function hasContent(node: RichTextNode): boolean {
  if (node.type === 'text') return Boolean(node.text?.trim())
  if (node.type === 'image' || node.type === 'table' || node.type === CHART_NODE) return true
  return (node.content ?? []).some(hasContent)
}

/** No text, table, image or chart. */
export function isDocEmpty(doc: RichTextDoc): boolean {
  return !(doc.content ?? []).some(hasContent)
}

/** Ids of the charts in a document, in order. */
export function docChartIds(doc: RichTextDoc | RichTextNode): string[] {
  const ids: string[] = []
  const visit = (node: RichTextNode | RichTextDoc) => {
    if (node.type === CHART_NODE && typeof node.attrs?.chartId === 'string') {
      ids.push(node.attrs.chartId)
    }
    node.content?.forEach(visit)
  }
  visit(doc)
  return ids
}

/** Blocks of plain text in reading order: list items one by one, a table row by row. */
export function docBlocks(doc: RichTextDoc): TextBlock[] {
  const blocks: TextBlock[] = []
  const visit = (node: RichTextNode) => {
    switch (node.type) {
      case 'heading':
        blocks.push({
          kind: 'heading',
          text: nodeText(node).trim(),
          level: Number(node.attrs?.level ?? 2),
        })
        return
      case 'paragraph': {
        const text = nodeText(node).trim()
        if (text) blocks.push({ kind: 'paragraph', text })
        return
      }
      case 'listItem':
        blocks.push({ kind: 'item', text: nodeText(node).trim() })
        return
      case 'tableRow':
        blocks.push({
          kind: 'row',
          text: (node.content ?? []).map((cell) => nodeText(cell).trim()).join(' | '),
        })
        return
      case 'image':
        blocks.push({ kind: 'image', text: String(node.attrs?.alt ?? '') })
        return
      case CHART_NODE:
        blocks.push({ kind: 'chart', text: '', chartId: String(node.attrs?.chartId ?? '') })
        return
      default:
        node.content?.forEach(visit)
    }
  }
  doc.content?.forEach(visit)
  return blocks
}

/** The text of each block, in reading order: the Data admin's paragraphs, a preview's lines. */
export function docParagraphs(doc: RichTextDoc): string[] {
  return docBlocks(doc)
    .map((block) => block.text)
    .filter(Boolean)
}

/** The characters of a document's text, as the API counts its limit (marks and cards left out). */
export function docLength(doc: RichTextDoc | RichTextNode): number {
  if (doc.type === 'text') return (doc as RichTextNode).text?.length ?? 0
  return (doc.content ?? []).reduce((total, node) => total + docLength(node), 0)
}

/** Some text: a body of images or cards alone is no article. */
export function docHasText(doc: RichTextDoc | null): boolean {
  return doc !== null && docParagraphs(doc).some((paragraph) => paragraph.trim().length > 0)
}

const WORDS_PER_PAGE = 450

/** Pages of the PDF: the words at 450 a page; a chart, an image or a table takes a third. */
export function estimatePages(summary: string, body: RichTextDoc): number {
  const blocks = docBlocks(body)
  const words = [summary, ...blocks.map((block) => block.text)]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  const figures =
    blocks.filter((block) => block.kind === 'chart' || block.kind === 'image').length +
    (body.content ?? []).filter((node) => node.type === 'table').length
  return Math.max(1, Math.ceil(words / WORDS_PER_PAGE + figures / 3))
}

/** A document of plain paragraphs and level-2 headings, for samples and tests. */
export function textDoc(blocks: readonly (string | { heading: string })[]): RichTextDoc {
  return {
    type: 'doc',
    content: blocks.map((block) =>
      typeof block === 'string'
        ? { type: 'paragraph', content: [{ type: 'text', text: block }] }
        : {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: block.heading }],
          },
    ),
  }
}
