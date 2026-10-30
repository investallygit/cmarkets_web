/** Latin-1 bytes; Helvetica's WinAnsi encoding covers French accents. Other characters become "?". */
function latin1(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(text, (char) => {
    const code = char.charCodeAt(0)
    return code < 256 ? code : 63
  })
}

const escapeText = (text: string) => text.replace(/[\\()]/g, (char) => `\\${char}`)

/** Lines of 11 pt text on an A4 page: fewer on the first page, under the title. */
const FIRST_PAGE_LINES = 40
const PAGE_LINES = 44

function pageContent(lines: readonly string[], title: string | null): string {
  const heading =
    title === null
      ? ['/F1 11 Tf', '56 790 Td']
      : ['/F1 18 Tf', '56 770 Td', `(${escapeText(title)}) Tj`, '/F1 11 Tf', '0 -32 Td']
  return [
    'BT',
    ...heading,
    ...lines.flatMap((line) => [`(${escapeText(line)}) Tj`, '0 -17 Td']),
    'ET',
  ].join('\n')
}

/**
 * An A4 PDF with a title and lines of text, standing in for an issuer document or a portfolio
 * report; the lines run on over as many pages as they need.
 */
export function createPdf(title: string, lines: readonly string[]): Uint8Array<ArrayBuffer> {
  const pages = [lines.slice(0, FIRST_PAGE_LINES)]
  for (let start = FIRST_PAGE_LINES; start < lines.length; start += PAGE_LINES) {
    pages.push(lines.slice(start, start + PAGE_LINES))
  }
  // 1 catalog, 2 page tree, 3 font, 4 document information, then a page and its content each.
  const pageNumber = (index: number) => 5 + index * 2
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${pageNumber(index)} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    // Shown by the PDF viewer instead of the file name.
    `<< /Title (${escapeText(title)}) /Producer (CMarket prototype) >>`,
    ...pages.flatMap((pageLines, index) => {
      const content = pageContent(pageLines, index === 0 ? title : null)
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageNumber(index) + 1} 0 R >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      ]
    }),
  ]
  // One character is one byte (Latin-1), so string lengths are the byte offsets of the xref table.
  let pdf = '%PDF-1.4\n'
  const offsets = objects.map((object, index) => {
    const offset = pdf.length
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 4 0 R >>\n`
  pdf += `startxref\n${xref}\n%%EOF\n`
  return latin1(pdf)
}
