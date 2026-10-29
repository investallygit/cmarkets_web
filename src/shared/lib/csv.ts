export type CsvCell = string | number | null | undefined

/** Semicolon-separated, the same convention as the data import templates (spec section 11). */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return rows.map((row) => row.map(escapeCell).join(';')).join('\r\n')
}

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return ''
  const text = String(cell)
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv(filename: string, rows: readonly (readonly CsvCell[])[]): void {
  // The BOM makes Excel read the file as UTF-8 (accents in security names).
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
