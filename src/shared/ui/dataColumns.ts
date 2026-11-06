import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
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

/** The grid track of a column (DataColumnMeta.width). */
export function columnTrack(width = '1fr'): string {
  return /^\d*\.?\d+fr$/.test(width) ? `minmax(${MIN_COLUMN_WIDTH}px, ${width})` : width
}

/** Features shared by every data table: sorting by clicking a column header (spec section 9). */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, text: sortFn_text },
  columnMeta: {} as DataColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

// Same type as helper.columns() returns: per-column value types are erased in the array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataColumns<TRow extends RowData> = Array<ColumnDef<DataTableFeatures, TRow, any>>

export function createDataColumnHelper<TRow extends RowData>() {
  return createColumnHelper<DataTableFeatures, TRow>()
}
