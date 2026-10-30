/** Latin-1 bytes; Helvetica's WinAnsi encoding covers French accents. Other characters become "?". */
function latin1(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(text, (char) => {
    const code = char.charCodeAt(0)
    return code < 256 ? code : 63
  })
}

const escapeText = (text: string) => text.replace(/[\\()]/g, (char) => `\\${char}`)

/** A one-page A4 PDF with a title and lines of text, standing in for an issuer document. */
export function createPdf(title: string, lines: readonly string[]): Uint8Array<ArrayBuffer> {
  const content = [
    'BT',
    '/F1 18 Tf',
    '56 770 Td',
    `(${escapeText(title)}) Tj`,
    '/F1 11 Tf',
    '0 -32 Td',
    ...lines.flatMap((line) => [`(${escapeText(line)}) Tj`, '0 -17 Td']),
    'ET',
  ].join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    // Shown by the PDF viewer instead of the file name.
    `<< /Title (${escapeText(title)}) /Producer (CMarket prototype) >>`,
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
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\n`
  pdf += `startxref\n${xref}\n%%EOF\n`
  return latin1(pdf)
}
