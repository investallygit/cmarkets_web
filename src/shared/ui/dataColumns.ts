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
  /** CSS grid track of the column, e.g. "1fr" or "72px". Defaults to "1fr". */
  width?: string
  /** false keeps the column out of CSV exports (sparklines, buttons). */
  exportable?: boolean
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
