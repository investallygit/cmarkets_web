import type { SheetData } from 'write-excel-file/browser'

export type XlsxCell = string | number | null | undefined

/** Column widths, in characters. */
const MIN_WIDTH = 8
const MAX_WIDTH = 50

export interface XlsxSheet {
  data: SheetData
  columns: { width: number }[]
}

/** First row in bold; numbers stay numbers so the user can compute on them in Excel. */
export function toXlsxSheet(rows: readonly (readonly XlsxCell[])[]): XlsxSheet {
  const [header = [], ...body] = rows
  const data: SheetData = [
    header.map((cell) => ({ value: cell ?? '', fontWeight: 'bold' as const })),
    ...body.map((row) => row.map((cell) => cell ?? null)),
  ]
  const columnCount = Math.max(0, ...rows.map((row) => row.length))
  const columns = Array.from({ length: columnCount }, (_, index) => {
    const longest = Math.max(0, ...rows.map((row) => String(row[index] ?? '').length))
    return { width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, longest + 2)) }
  })
  return { data, columns }
}

/** Excel export of a data table (spec section 3), with the header row frozen. */
export async function downloadXlsx(
  filename: string,
  rows: readonly (readonly XlsxCell[])[],
): Promise<void> {
  // Loaded on the first export only: the writer is not needed to display a table.
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const { data, columns } = toXlsxSheet(rows)
  await writeXlsxFile(data, { columns, stickyRowsCount: 1 }).toFile(
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  )
}
