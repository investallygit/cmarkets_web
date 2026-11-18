import {
  constructSortFn,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_basic,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'

export interface DataColumnMeta {
  /** Figures are right-aligned (spec section 8). */
  align?: 'left' | 'right'
  /**
   * CSS grid track of the column: "72px", "1.2fr" (a share of the width, at least
   * MIN_COLUMN_WIDTH) or a track of its own, "minmax(96px, 1.1fr)". Defaults to "1fr".
   */
  width?: string
  /** false keeps the column out of CSV exports (sparklines, buttons). */
  exportable?: boolean
}

/**
 * The least width of a column given as a share: a table narrower than its columns scrolls sideways
 * in its panel, as WCAG 1.4.10 lets a data table do, instead of squeezing them unreadable.
 */
export const MIN_COLUMN_WIDTH = 56

/**
 * The grid track of a column (DataColumnMeta.width), widened to `fitted` px, what its header and
 * its widest figure need (`DataTable` measures it), so that neither is ever cut (ROADMAP step 48).
 */
export function columnTrack(width = '1fr', fitted = 0): string {
  if (/^\d*\.?\d+fr$/.test(width))
    return `minmax(${Math.max(MIN_COLUMN_WIDTH, fitted)}px, ${width})`
  const fixed = /^(\d*\.?\d+)px$/.exec(width)
  if (fixed) return `${Math.max(Number(fixed[1]), fitted)}px`
  const share = /^minmax\((\d*\.?\d+)px,\s*(.+)\)$/.exec(width)
  if (share) return `minmax(${Math.max(Number(share[1]), fitted)}px, ${share[2]})`
  return width
}

/**
 * A figure: digits with their signs, separators and units, a date or a time ("1 282,84", "+0.30%",
 * "15/11 17:13", "XAF 2.2 Bn"), a unit of a few letters after it included ("+0.51 pts", "12 ans";
 * B24). A table never cuts one; a text may end in an ellipsis.
 */
export function isFigure(text: string): boolean {
  return /\d/.test(text) && /^[\s\d.,:;%+\-–−/()×xMBnkXAF€$]+(?:\p{L}{1,4}\.?)?$/u.test(text)
}

/**
 * Words in the order of a dictionary, whatever their accents and case ("ÉCO HEBDO" among the E,
 * not after Z; B94), and the numbers inside them by their value ("item 2" before "item 10").
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

const sortFn_words = constructSortFn({
  resolveDataValue: (value) =>
    typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '',
  sort: (a: string, b: string) => collator.compare(a, b),
})

/**
 * Features shared by every data table: sorting by clicking a column header (spec section 9). The
 * columns of words sort as a dictionary does (B94): table-core gives a column of strings its
 * `text` or `alphanumeric` function, which compare the characters' codes.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_words, basic: sortFn_basic, text: sortFn_words },
  columnMeta: {} as DataColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

// Same type as helper.columns() returns: per-column value types are erased in the array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataColumns<TRow extends RowData> = Array<ColumnDef<DataTableFeatures, TRow, any>>

export function createDataColumnHelper<TRow extends RowData>() {
  return createColumnHelper<DataTableFeatures, TRow>()
}
