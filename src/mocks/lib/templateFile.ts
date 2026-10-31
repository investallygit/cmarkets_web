import { parseDate, parseNumber } from '@/shared/lib/parse'

/** Columns of the transaction import template, in this order (spec section 4). */
export const TRANSACTION_COLUMNS = [
  'date',
  'type',
  'security',
  'quantity',
  'price',
  'fees',
  'amount',
  'note',
] as const
export type TransactionColumn = (typeof TRANSACTION_COLUMNS)[number]

export type Cell = string | number | boolean | Date | null

export interface FileRow<C extends string> {
  /** Line in the file, the header being line 1. */
  line: number
  cells: Record<C, Cell>
}

/** Splits CSV text, ';' or ',' separated, with "quoted" cells; the delimiter comes from the header. */
export function parseCsv(text: string): string[][] {
  const content = text.replace(/^\uFEFF/, '')
  const header = content.slice(0, content.search(/\r?\n|$/))
  const delimiter = header.split(';').length >= header.split(',').length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < content.length; index++) {
    const char = content[index]
    if (quoted) {
      if (char === '"' && content[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === delimiter) {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[index + 1] === '\n') index += 1
      rows.push([...row, cell])
      row = []
      cell = ''
    } else cell += char
  }
  if (cell !== '' || row.length > 0) rows.push([...row, cell])
  return rows
}

function toCell(value: unknown): Cell {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
    ? value
    : null
}

/**
 * The rows of a CSV or Excel file of a template (spec sections 4 and 11), matched to its columns
 * by their header; a column left out of `required` may be missing from the file.
 */
export async function readTemplateFile<C extends string>(
  file: File,
  columns: readonly C[],
  required: readonly C[] = columns,
): Promise<{ rows: FileRow<C>[] } | { error: string }> {
  let table: Cell[][]
  if (/\.xlsx$/i.test(file.name)) {
    try {
      const { readSheet } = await import('read-excel-file/web-worker')
      table = (await readSheet(file)).map((row) => row.map(toCell))
    } catch {
      return { error: 'The Excel file cannot be read.' }
    }
  } else if (/\.csv$/i.test(file.name)) {
    table = parseCsv(await file.text())
  } else {
    return { error: 'A .csv or .xlsx file of the template.' }
  }
  const [header = [], ...body] = table
  const positions = columns.map((column) =>
    header.findIndex(
      (title) =>
        String(title ?? '')
          .trim()
          .toLowerCase() === column,
    ),
  )
  const missing = columns.filter(
    (column, index) => positions[index] === -1 && required.includes(column),
  )
  if (missing.length > 0) return { error: `Missing columns: ${missing.join(', ')}.` }
  const rows = body
    .map((cells, index) => ({
      line: index + 2,
      cells: Object.fromEntries(
        columns.map((column, position) => [
          column,
          positions[position] === -1 ? null : (cells[positions[position]] ?? null),
        ]),
      ) as Record<C, Cell>,
    }))
    .filter((row) =>
      Object.values<Cell>(row.cells).some((cell) => String(cell ?? '').trim() !== ''),
    )
  return { rows }
}

/** The rows of a transaction import file. */
export function readTransactionFile(file: File) {
  return readTemplateFile(file, TRANSACTION_COLUMNS)
}

/** Excel stores dates as days since 30/12/1899. */
const EXCEL_EPOCH = Date.UTC(1899, 11, 30)

/** An ISO date from 2026-10-28, 28/10/2026, an Excel date or its serial number; null otherwise. */
export function cellDate(cell: Cell): string | null {
  if (cell instanceof Date) return cell.toISOString().slice(0, 10)
  if (typeof cell === 'number') {
    return new Date(EXCEL_EPOCH + Math.round(cell) * 86_400_000).toISOString().slice(0, 10)
  }
  const text = String(cell ?? '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text))) return text
  return parseDate(text)
}

/** A number written 52500.25 or 52 500,25; null when empty, NaN when not a number. */
export function cellNumber(cell: Cell): number | null {
  if (typeof cell === 'number') return cell
  const text = String(cell ?? '').trim()
  if (text === '') return null
  return parseNumber(text, 'fr') ?? Number.NaN
}

export function cellText(cell: Cell): string {
  return cell instanceof Date ? cell.toISOString().slice(0, 10) : String(cell ?? '').trim()
}
