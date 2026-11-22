import { rateAt, TENOR_YEARS } from '@/entities/bond'
import { STANDARD_TENORS, type CurvePointDto } from '@/shared/api/contracts'
import {
  emptyTenors,
  ratesByDate,
  roundRate,
  type DiscountForm,
  type ScheduleRow,
} from './discountForm'

// The entry panel of block B (ROADMAP decision 46, the client's answer of 22 November 2026): each
// row's reference rate and spread, and the helpers that start from a curve, shift every row,
// paste from Excel or clear.

interface TableContext {
  rows: readonly ScheduleRow[]
  /** The rate each row shows, in percent. */
  shown: readonly (number | null)[]
}

/** The curve the rates are compared with: the curve chosen, else the one they started from. */
export function referenceOf(discount: DiscountForm, cmarketId: string): string {
  if (discount.mode === 'curve') return discount.curveId ?? cmarketId
  return discount.referenceId ?? cmarketId
}

/** The spread of a rate over its reference, in bp to one decimal; null when either is missing. */
export function spreadBp(rate: number | null, reference: number | null): number | null {
  if (rate === null || reference === null) return null
  return Math.round((rate - reference) * 1000) / 10
}

/** The reference curve read at each row's time and at each tenor. */
export function referenceRates(
  points: readonly CurvePointDto[] | null,
  rows: readonly ScheduleRow[],
) {
  const read = (years: number) => (points ? rateAt(points, years) : null)
  return {
    rows: rows.map((row) => read(row.years)),
    tenors: Object.fromEntries(
      STANDARD_TENORS.map((tenor) => [tenor, read(TENOR_YEARS[tenor])]),
    ) as Record<keyof DiscountForm['tenors'], number | null>,
  }
}

/** Rates entered from here on: from a curve, by date, its rates on every row and it the reference. */
function asEntered(discount: DiscountForm, context: TableContext): DiscountForm {
  if (discount.mode !== 'curve') return { ...discount, mode: 'rates' }
  return {
    ...discount,
    mode: 'rates',
    entry: 'dates',
    rates: { ...discount.rates, ...ratesByDate(context.rows, context.shown) },
    referenceId: discount.curveId,
  }
}

const shifted = (rate: number | null, bp: number) =>
  rate === null ? null : Math.round((rate + bp / 100) * 1e6) / 1e6

/** "Shift all rows": a number of bp added to every rate of the table, empty ones left empty. */
export function shiftRates(
  discount: DiscountForm,
  bp: number,
  context: TableContext,
): DiscountForm {
  const next = asEntered(discount, context)
  if (next.entry === 'tenors') {
    return {
      ...next,
      tenors: Object.fromEntries(
        STANDARD_TENORS.map((tenor) => [tenor, shifted(next.tenors[tenor], bp)]),
      ) as DiscountForm['tenors'],
    }
  }
  return {
    ...next,
    rates: {
      ...next.rates,
      ...Object.fromEntries(
        context.rows.map((row) => [row.date, shifted(next.rates[row.date] ?? null, bp)]),
      ),
    },
  }
}

/** "Clear": every row of the table emptied; Calculate waits for them. */
export function clearRates(discount: DiscountForm, context: TableContext): DiscountForm {
  const next = asEntered(discount, context)
  if (next.entry === 'tenors') return { ...next, tenors: emptyTenors() }
  return {
    ...next,
    rates: { ...next.rates, ...Object.fromEntries(context.rows.map((row) => [row.date, null])) },
  }
}

/** "Start from a curve": its rates on every row (or tenor), rounded as typed, and it the reference. */
export function startFromCurve(
  discount: DiscountForm,
  curve: { id: string; points: readonly CurvePointDto[] },
  rows: readonly ScheduleRow[],
): DiscountForm {
  const read = (years: number) => {
    const rate = rateAt(curve.points, years)
    return rate === null ? null : roundRate(rate)
  }
  const entry = discount.mode === 'curve' ? 'dates' : discount.entry
  const next: DiscountForm = { ...discount, mode: 'rates', entry, referenceId: curve.id }
  if (entry === 'tenors') {
    next.tenors = Object.fromEntries(
      STANDARD_TENORS.map((tenor) => [tenor, read(TENOR_YEARS[tenor])]),
    ) as DiscountForm['tenors']
  } else {
    next.rates = {
      ...discount.rates,
      ...Object.fromEntries(rows.map((row) => [row.date, read(row.years)])),
    }
  }
  return next
}

/** Text pasted into a rate: cells of a spreadsheet (more than a line, a tab), else null for one number. */
export function cellsPasted(text: string): string | null {
  return /[\n\t;]/.test(text.trim()) ? text : null
}

/** A line copied from Excel: a rate, with the cash-flow date it is for when the line has one. */
export interface PastedLine {
  date: string | null
  rate: number
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const RATE = /^[+-]?(\d+\.?\d*|\.\d+)$/
const DAY_MONTH_YEAR = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/

/** A rate as Excel copies it in either language: "4,60", "4.6", "4.60 %". */
function readRate(cell: string): number | null {
  let text = cell.replace(/[\s%]/g, '')
  if (text.includes(',') && !text.includes('.')) text = text.replace(',', '.')
  return RATE.test(text) ? Number(text) : null
}

/** A date as Excel copies it: DD/MM/YYYY (or with dots or dashes), or ISO. */
function readDate(cell: string): string | null {
  const text = cell.trim()
  if (ISO_DATE.test(text)) return text
  const match = DAY_MONTH_YEAR.exec(text)
  if (!match) return null
  const [day, month, year] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day!))
  if (date.getUTCMonth() !== month! - 1 || date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}

/**
 * Cells copied from Excel: a line a row, its cells split by tabs or semicolons; a line holds a rate,
 * or a date and a rate (the rate last). A first line without a digit is a header and is skipped.
 * `bad` lists, from 1, the lines that could not be read.
 */
export function parsePasted(text: string): { lines: PastedLine[]; bad: number[] } {
  const lines: PastedLine[] = []
  const bad: number[] = []
  text
    .replace(/\r/g, '')
    .split('\n')
    .forEach((raw, index) => {
      const line = raw.trim()
      if (line === '' || (index === 0 && !/\d/.test(line))) return
      const cells = line
        .split(/[\t;]/)
        .map((cell) => cell.trim())
        .filter(Boolean)
      const rate = readRate(cells.at(-1) ?? '')
      const date = cells.length > 1 ? readDate(cells[0]!) : null
      if (rate === null || cells.length > 2 || (cells.length === 2 && date === null)) {
        bad.push(index + 1)
      } else {
        lines.push({ date, rate })
      }
    })
  return { lines, bad }
}

/**
 * The lines pasted into the table: by date when they carry dates (a date the bond does not pay on
 * is unmatched), else in order from the row (or tenor) in focus down, those beyond the last row
 * unmatched. Nothing changes when a line is unmatched.
 */
export function pasteRates(
  discount: DiscountForm,
  lines: readonly PastedLine[],
  context: TableContext & { from: number },
): { discount: DiscountForm; unmatched: number } {
  const next = asEntered(discount, context)
  if (next.entry === 'tenors') {
    const tenors = STANDARD_TENORS.slice(context.from)
    const unmatched = Math.max(0, lines.length - tenors.length) + lines.filter((l) => l.date).length
    if (unmatched > 0) return { discount, unmatched }
    const pasted = Object.fromEntries(lines.map((line, index) => [tenors[index]!, line.rate]))
    return { discount: { ...next, tenors: { ...next.tenors, ...pasted } }, unmatched: 0 }
  }
  const dated = lines.every((line) => line.date !== null)
  const dates = context.rows.map((row) => row.date)
  const targets = dated
    ? lines.map((line) => (dates.includes(line.date!) ? line.date! : null))
    : lines.map((_, index) => dates[context.from + index] ?? null)
  const unmatched = targets.filter((date) => date === null).length
  if (unmatched > 0 || lines.some((line) => line.date !== null) !== dated) {
    return { discount, unmatched: Math.max(unmatched, 1) }
  }
  const pasted = Object.fromEntries(targets.map((date, index) => [date!, lines[index]!.rate]))
  return { discount: { ...next, rates: { ...next.rates, ...pasted } }, unmatched: 0 }
}
