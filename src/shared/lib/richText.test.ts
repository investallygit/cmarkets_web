import { describe, expect, it } from 'vitest'
import type { RichTextDoc } from '@/shared/api/contracts'
import {
  CHART_NODE,
  docBlocks,
  docChartIds,
  docHeadings,
  estimatePages,
  isDocEmpty,
  textDoc,
} from './richText'

const text = (value: string) => ({ type: 'text', text: value })
const paragraph = (value: string) => ({ type: 'paragraph', content: [text(value)] })

const note: RichTextDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [text('1. Growth driven by volumes')] },
    paragraph('Revenue grew on volumes.'),
    { type: CHART_NODE, attrs: { chartId: 'chart-semc-1y' } },
    { type: 'heading', attrs: { level: 3 }, content: [text('Packaging')] },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [paragraph('PET resin follows oil.')] }],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [paragraph('XAF M')] },
            { type: 'tableHeader', content: [paragraph('2025')] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [paragraph('Revenue')] },
            { type: 'tableCell', content: [paragraph('28,500')] },
          ],
        },
      ],
    },
  ],
}

describe('publication text', () => {
  it('takes the level-2 headings as the table of contents', () => {
    expect(docHeadings(note)).toEqual(['1. Growth driven by volumes'])
    expect(docHeadings(note, 3)).toEqual(['Packaging'])
  })

  it('reads the blocks in order: items one by one, a table row by row, charts by id', () => {
    expect(docBlocks(note)).toEqual([
      { kind: 'heading', text: '1. Growth driven by volumes', level: 2 },
      { kind: 'paragraph', text: 'Revenue grew on volumes.' },
      { kind: 'chart', text: '', chartId: 'chart-semc-1y' },
      { kind: 'heading', text: 'Packaging', level: 3 },
      { kind: 'item', text: 'PET resin follows oil.' },
      { kind: 'row', text: 'XAF M | 2025' },
      { kind: 'row', text: 'Revenue | 28,500' },
    ])
    expect(docChartIds(note)).toEqual(['chart-semc-1y'])
  })

  it('tells an empty document: blank paragraphs only', () => {
    expect(isDocEmpty({ type: 'doc', content: [{ type: 'paragraph' }, paragraph('  ')] })).toBe(
      true,
    )
    expect(
      isDocEmpty({ type: 'doc', content: [{ type: CHART_NODE, attrs: { chartId: 'x' } }] }),
    ).toBe(false)
    expect(isDocEmpty(textDoc(['A word.']))).toBe(false)
  })

  it('counts a page per 450 words, a third of one per chart or table', () => {
    expect(estimatePages('', textDoc([]))).toBe(1)
    expect(estimatePages('', textDoc(Array.from({ length: 91 }, () => 'word '.repeat(10))))).toBe(3)
    // 18 words, one chart and one table: 18/450 + 2/3 rounds up to one page.
    expect(estimatePages('Summary.', note)).toBe(1)
  })
})
