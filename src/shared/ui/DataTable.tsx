import { useTable, type Row, type RowData } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp, Download, FileSpreadsheet } from 'lucide-react'
import { useCallback, useContext, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadCsv, type CsvCell } from '@/shared/lib/csv'
import { downloadXlsx } from '@/shared/lib/xlsx'
import { ContextMenu } from './ContextMenu'
import { dataTableFeatures, type DataColumns, type DataTableFeatures } from './dataColumns'
import type { MenuItem } from './menu'
import { PanelEmpty } from './StatusViews'
import { TableExportContext } from './tableExport'
import { toast } from './toast'

/** Table row height, spec section 8. */
const ROW_HEIGHT = 22
/** Small tables render every row; from this size rows are virtualized. */
const VIRTUALIZE_FROM = 60

export interface DataTableProps<TRow extends RowData> {
  data: TRow[]
  columns: DataColumns<TRow>
  getRowId: (row: TRow) => string
  selectedRowId?: string | null
  onRowClick?: (row: TRow) => void
  onRowDoubleClick?: (row: TRow) => void
  /** Row entries of the right-click menu; the export entries follow when the user may export. */
  rowMenu?: (row: TRow) => MenuItem[]
  exportName?: string
  rowClassName?: (row: TRow) => string | undefined
  enableSorting?: boolean
  emptyMessage?: string
}

interface MenuState {
  x: number
  y: number
  items: MenuItem[]
}

function toCsvCell(value: unknown): CsvCell {
  return typeof value === 'number' || typeof value === 'string' ? value : ''
}

/**
 * Dense terminal table: 22 px rows, alternate row background, sorting by clicking a column
 * header, right-click menu with Excel and CSV export, virtualization for thousands of rows.
 */
export function DataTable<TRow extends RowData>({
  data,
  columns,
  getRowId,
  selectedRowId,
  onRowClick,
  onRowDoubleClick,
  rowMenu,
  exportName = 'cmarket-export',
  rowClassName,
  enableSorting = true,
  emptyMessage,
}: DataTableProps<TRow>) {
  const { t } = useTranslation()
  const canExport = useContext(TableExportContext)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])

  const table = useTable({ features: dataTableFeatures, columns, data, getRowId, enableSorting })
  const rows = table.getRowModel().rows
  const virtualize = rows.length >= VIRTUALIZE_FROM
  // The app does not run the React Compiler; nothing here is memoized around the virtualizer.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    enabled: virtualize,
  })

  const leafColumns = table.getAllLeafColumns()
  const gridTemplateColumns = leafColumns
    .map((column) => column.columnDef.meta?.width ?? '1fr')
    .join(' ')

  /** The rows as shown, sorting included. */
  const exportTable = (format: 'csv' | 'xlsx') => {
    const exported = leafColumns.filter((column) => column.columnDef.meta?.exportable !== false)
    const header = exported.map((column) =>
      typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    )
    const body = rows.map((row) => exported.map((column) => toCsvCell(row.getValue(column.id))))
    if (format === 'csv') return downloadCsv(exportName, [header, ...body])
    downloadXlsx(exportName, [header, ...body]).catch((error: unknown) => {
      toast.error(
        t('menu.exportFailed', { message: error instanceof Error ? error.message : String(error) }),
      )
    })
  }

  const openMenu = (event: MouseEvent, row: TRow) => {
    const rowItems = rowMenu?.(row) ?? []
    const exportItems: MenuItem[] = canExport
      ? [
          {
            id: 'export-xlsx',
            label: t('menu.exportXlsx'),
            icon: FileSpreadsheet,
            onSelect: () => exportTable('xlsx'),
          },
          {
            id: 'export-csv',
            label: t('menu.exportCsv'),
            icon: Download,
            onSelect: () => exportTable('csv'),
          },
        ]
      : []
    const separator: MenuItem[] =
      rowItems.length > 0 && exportItems.length > 0
        ? [{ id: 'export-separator', label: '', kind: 'separator' }]
        : []
    const items = [...rowItems, ...separator, ...exportItems]
    // Nothing to offer: the browser shows its own menu.
    if (items.length === 0) return
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, items })
  }

  const renderRow = (row: Row<DataTableFeatures, TRow>, index: number, offset?: number) => (
    <tr
      key={row.id}
      data-index={index}
      className={clsx(
        'grid h-row items-center font-mono text-data',
        offset !== undefined && 'absolute inset-x-0 top-0',
        row.id === selectedRowId
          ? 'bg-selected'
          : clsx(index % 2 === 1 && 'bg-row-alt', 'hover:bg-panel-header'),
        (onRowClick || onRowDoubleClick) && 'cursor-pointer',
        rowClassName?.(row.original),
      )}
      style={{
        gridTemplateColumns,
        transform: offset === undefined ? undefined : `translateY(${offset}px)`,
      }}
      onClick={onRowClick && (() => onRowClick(row.original))}
      onDoubleClick={onRowDoubleClick && (() => onRowDoubleClick(row.original))}
      onContextMenu={(event) => openMenu(event, row.original)}
    >
      {row.getAllCells().map((cell) => (
        <td
          key={cell.id}
          className={clsx(
            'truncate px-2',
            cell.column.columnDef.meta?.align === 'right' && 'text-right tabular-nums',
          )}
        >
          <table.FlexRender cell={cell} />
        </td>
      ))}
    </tr>
  )

  return (
    <div ref={scrollRef} className="relative h-full overflow-auto">
      <table className="grid w-full">
        <thead className="sticky top-0 z-1 grid bg-panel-header">
          {table.getHeaderGroups().map((group) => (
            <tr
              key={group.id}
              className="grid h-row items-center border-b"
              style={{ gridTemplateColumns }}
            >
              {group.headers.map((header) => {
                const align = header.column.columnDef.meta?.align
                const sorted = header.column.getIsSorted()
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={clsx(
                      'truncate px-2 font-sans text-data font-normal text-secondary',
                      align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={clsx(
                          'inline-flex max-w-full items-center gap-0.5 hover:text-primary',
                          align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        <span className="truncate">
                          <table.FlexRender header={header} />
                        </span>
                        {sorted === 'asc' && <ChevronUp aria-hidden className="size-3 shrink-0" />}
                        {sorted === 'desc' && (
                          <ChevronDown aria-hidden className="size-3 shrink-0" />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody
          className="relative grid"
          style={virtualize ? { height: virtualizer.getTotalSize() } : undefined}
        >
          {virtualize
            ? virtualizer
                .getVirtualItems()
                .map((item) => renderRow(rows[item.index], item.index, item.start))
            : rows.map((row, index) => renderRow(row, index))}
        </tbody>
      </table>
      {rows.length === 0 && <PanelEmpty message={emptyMessage} />}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />}
    </div>
  )
}
