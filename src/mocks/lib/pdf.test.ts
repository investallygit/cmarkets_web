import { describe, expect, it } from 'vitest'
import { createPdf } from './pdf'

describe('createPdf', () => {
  it('writes a PDF whose cross-reference table points at each object', () => {
    const pdf = new TextDecoder('latin1').decode(
      createPdf('2025 annual report', ['Société (SEMC)']),
    )
    expect(pdf.startsWith('%PDF-1.4\n')).toBe(true)
    const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1])
    expect(pdf.slice(xref, xref + 4)).toBe('xref')
    const offsets = [...pdf.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((match) =>
      Number(match[1]),
    )
    expect(offsets).toHaveLength(6)
    offsets.forEach((offset, index) => {
      expect(pdf.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true)
    })
  })

  it('runs long text over several pages', () => {
    const lines = Array.from({ length: 100 }, (_, index) => `Line ${index + 1}`)
    const pdf = new TextDecoder('latin1').decode(createPdf('Portfolio report', lines))
    expect(pdf).toContain('/Kids [5 0 R 7 0 R 9 0 R] /Count 3')
    expect(pdf).toContain('(Line 100) Tj')
    expect(pdf.match(/\(Portfolio report\) Tj/g)).toHaveLength(1)
  })

  it('keeps French accents and escapes parentheses', () => {
    const pdf = new TextDecoder('latin1').decode(createPdf('Note', ['Société (SEMC)']))
    expect(pdf).toContain('(Société \\(SEMC\\)) Tj')
    expect(pdf).toContain('/Title (Note)')
  })

  it('prints the watermark under the text of every page', () => {
    const lines = Array.from({ length: 60 }, (_, index) => `Line ${index + 1}`)
    const pdf = new TextDecoder('latin1').decode(
      createPdf('Note', lines, { watermark: 'P. Owona - 30/10/2026' }),
    )
    // Twice on each of the two pages, before the page's text.
    expect(pdf.match(/\(P\. Owona - 30\/10\/2026\) Tj/g)).toHaveLength(4)
    expect(pdf.indexOf('(P. Owona')).toBeLessThan(pdf.indexOf('(Line 1) Tj'))
  })
})
