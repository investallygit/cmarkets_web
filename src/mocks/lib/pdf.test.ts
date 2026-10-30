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

  it('keeps French accents and escapes parentheses', () => {
    const pdf = new TextDecoder('latin1').decode(createPdf('Note', ['Société (SEMC)']))
    expect(pdf).toContain('(Société \\(SEMC\\)) Tj')
    expect(pdf).toContain('/Title (Note)')
  })
})
