import { useTable, type Row, type RowData, type SortingState } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { ChevronDown, ChevronUp, Download, FileSpreadsheet } from 'lucide-react'
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { downloadCsv, type CsvCell } from '@/shared/lib/csv'
import { downloadXlsx } from '@/shared/lib/xlsx'
import { ContextMenu } from './ContextMenu'
import {
  columnTrack,
  dataTableFeatures,
  isFigure,
  type DataColumns,
  type DataTableFeatures,
} from './dataColumns'
import type { MenuItem } from './menu'
import { PanelEmpty } from './StatusViews'
import { TableExportContext } from './tableExport'
import { toast } from './toast'

/** Table row height, spec section 8. */
const ROW_HEIGHT = 22
/** Small tables render every row; from this size rows are virtualized. */
const VIRTUALIZE_FROM = 60

/** Exports the rows as shown, sorting included. */
export type TableExporter = (format: 'csv' | 'xlsx') => void

/** A header's sort button holds its label and, the column sorted, an arrow beside it. */
const SORT_ARROW_WIDTH = 14

/**
 * The width a cell's content takes, its padding included: its text laid out whole, which a cut
 * cell clips but does not shorten (a range's rectangles are its text's, not the clip's). 0 where
 * nothing is laid out (a test's document, a hidden panel). `content` is the part to measure when
 * the cell holds a box as wide as itself (a header's sort button): its label.
 */
function contentWidth(cell: HTMLElement, content: HTMLElement = cell): number {
  const range = document.createRange()
  range.selectNodeContents(content)
  if (typeof range.getBoundingClientRect !== 'function') return 0
  const { width } = range.getBoundingClientRect()
  if (!width) return 0
  const style = getComputedStyle(cell)
  return Math.ceil(width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight))
}

/** The letters of a text, without its spaces and separators. */
const letterCount = (text: string | null) => (text ?? '').replace(/[\s·,/|]/g, '').length

/**
 * A cell that holds tags only (a status, a newspaper, `data-tag`): a table never cuts one either,
 * since a tag has no ellipsis (B30).
 */
function holdsTagsOnly(cell: HTMLElement): boolean {
  const tags = [...cell.querySelectorAll('[data-tag]')]
  return (
    tags.length > 0 &&
    tags.reduce((count, tag) => count + letterCount(tag.textContent), 0) >=
      letterCount(cell.textContent)
  )
}

/** What each column needs on the rows shown: its header whole, its figures and tags whole. */
function measureColumns(element: HTMLElement, ids: readonly string[]): Record<string, number> {
  const fitted: Record<string, number> = {}
  const rows = [...element.querySelectorAll<HTMLElement>('tbody > tr, tfoot > tr')]
  const headers = [...element.querySelectorAll<HTMLElement>('thead > tr')]
  ids.forEach((id, index) => {
    let need = 0
    for (const row of headers) {
      const header = row.children.item(index)
      if (!(header instanceof HTMLElement)) continue
      const label = header.querySelector<HTMLElement>('[data-sort-label]')
      need = Math.max(
        need,
        label ? contentWidth(header, label) + SORT_ARROW_WIDTH : contentWidth(header),
      )
    }
    for (const row of rows) {
      const cell = row.children.item(index)
      if (
        cell instanceof HTMLElement &&
        (isFigure(cell.textContent?.trim() ?? '') || holdsTagsOnly(cell))
      )
        need = Math.max(need, contentWidth(cell))
    }
    if (need > 0) fitted[id] = need
  })
  return fitted
}

const sameWidths = (a: Record<string, number>, b: Record<string, number>) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((id) => a[id] === b[id])

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
  /**
   * Sorted by the server, for a list it sends page by page: the order of the rows as they come,
   * and the order asked for when a header is clicked.
   */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  emptyMessage?: string
  /** Set to the table's export, for Excel and CSV links outside the table (a panel title bar). */
  exportRef?: MutableRefObject<TableExporter | null>
  /**
   * A last row that stays out of the sorting, such as the cash of a portfolio: what each column
   * shows, by column id, and what the export writes.
   */
  footer?: { cells: Partial<Record<string, ReactNode>>; values?: Partial<Record<string, CsvCell>> }
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
 * The table takes the focus, so the keyboard scrolls it. Where rows do something, the up and down
 * arrows move from row to row: the selection where rows are clicked, a cursor of the table's own
 * otherwise. Enter opens the row as a double click, and the menu key or Shift + F10 opens its
 * right-click menu (WCAG 2.1.1). Screen readers hear the row reached.
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
  sorting,
  onSortingChange,
  emptyMessage,
  exportRef,
  footer,
}: DataTableProps<TRow>) {
  const { t, i18n } = useTranslation()
  const canExport = useContext(TableExportContext)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  // Rows the parent does not select still need a place for the keyboard: the cursor.
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  // table-core keeps each row's accessor values until the data change (`row._valuesCache`): the
  // rows are built again when the columns change (the language, a clock), or a cell, the sorting
  // and the export would keep the former words and times (B41, B80).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- new columns are the reason for a copy
  const rowData = useMemo(() => data.slice(), [data, columns])
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: rowData,
    getRowId,
    enableSorting,
    ...(onSortingChange && {
      manualSorting: true,
      // The server has an order for every column, both ways: a third click turns it back, it
      // never asks for no order (B81).
      enableSortingRemoval: false,
      state: { sorting: sorting ?? [] },
      onSortingChange: (updater) =>
        onSortingChange(typeof updater === 'function' ? updater(sorting ?? []) : updater),
    }),
  })
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
    // A row brought into view stays clear of the sticky header.
    scrollPaddingStart: ROW_HEIGHT,
  })

  const leafColumns = table.getAllLeafColumns()
  // What its header and its figures need, measured on the rows shown when the data, the columns or
  // the language change: a column narrower than that widens, and the table scrolls sideways in its
  // panel rather than cut a figure (WCAG 1.4.10 lets a data table do so; ROADMAP step 48).
  const [fitted, setFitted] = useState<Record<string, number>>({})
  const columnIds = JSON.stringify(leafColumns.map((column) => column.id))
  useLayoutEffect(() => {
    if (!scrollRef.current) return
    const next = measureColumns(scrollRef.current, JSON.parse(columnIds) as string[])
    setFitted((current) => (sameWidths(current, next) ? current : next))
  }, [data, columns, columnIds, i18n.language])
  const gridTemplateColumns = leafColumns
    .map((column) => columnTrack(column.columnDef.meta?.width, fitted[column.id]))
    .join(' ')

  /** The rows as shown, sorting included. */
  const exportTable: TableExporter = (format) => {
    const exported = leafColumns.filter((column) => column.columnDef.meta?.exportable !== false)
    const header = exported.map((column) =>
      typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
    )
    const body = rows.map((row) => exported.map((column) => toCsvCell(row.getValue(column.id))))
    if (footer?.values) body.push(exported.map((column) => footer.values?.[column.id] ?? ''))
    if (format === 'csv') return downloadCsv(exportName, [header, ...body])
    downloadXlsx(exportName, [header, ...body]).catch((error: unknown) => {
      toast.error(
        t('menu.exportFailed', { message: error instanceof Error ? error.message : String(error) }),
      )
    })
  }

  // After each render, so the export sees the rows and the sorting of the last one.
  useEffect(() => {
    if (exportRef) exportRef.current = exportTable
  })

  const menuItemsOf = (row: TRow): MenuItem[] => {
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
    return [...rowItems, ...separator, ...exportItems]
  }

  /** The row's menu at the given point; false when it has nothing to offer. */
  const openMenu = (row: TRow, x: number, y: number) => {
    const items = menuItemsOf(row)
    if (items.length === 0) return false
    setMenu({ x, y, items })
    return true
  }

  const onRowContextMenu = (event: MouseEvent, row: TRow) => {
    // Nothing to offer: the browser shows its own menu.
    if (openMenu(row, event.clientX, event.clientY)) event.preventDefault()
  }

  const selects = onRowClick !== undefined
  const activeId = selects ? (selectedRowId ?? null) : cursorId
  const keyboardRows =
    selects || onRowDoubleClick !== undefined || rowMenu !== undefined || canExport

  const rowElement = (index: number) =>
    scrollRef.current?.querySelector<HTMLElement>(`tbody > [data-index="${index}"]`)

  const scrollToRow = (index: number) => {
    if (virtualize) {
      virtualizer.scrollToIndex(index)
      return
    }
    rowElement(index)?.scrollIntoView({ block: 'nearest' })
  }

  /** The row's cells as shown, once a virtualized row has been drawn. */
  const announceRow = (index: number) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const cells = rowElement(index)?.querySelectorAll('td') ?? []
        const text = [...cells]
          .map((cell) => cell.textContent?.trim())
          .filter(Boolean)
          .join(', ')
        if (text) setAnnouncement(text)
      }),
    )
  }

  /** From the keyboard: the menu of the row the keys are on, below it. */
  const openActiveMenu = () => {
    const index = rows.findIndex((row) => row.id === activeId)
    if (index === -1) return false
    const box = (rowElement(index) ?? scrollRef.current)?.getBoundingClientRect()
    return openMenu(rows[index].original, (box?.left ?? 0) + 8, box?.bottom ?? 0)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // The keys of a control in a cell, or of a table whose rows do nothing, keep their own meaning.
    if (event.target !== event.currentTarget || !keyboardRows || rows.length === 0) return
    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
      if (openActiveMenu()) event.preventDefault()
      return
    }
    const current = rows.findIndex((row) => row.id === activeId)
    if (event.key === 'Enter') {
      if (current === -1 || !onRowDoubleClick) return
      event.preventDefault()
      onRowDoubleClick(rows[current].original)
      return
    }
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = current === -1 ? 0 : Math.min(rows.length - 1, Math.max(0, current + step))
    if (onRowClick) onRowClick(rows[next].original)
    else setCursorId(rows[next].id)
    scrollToRow(next)
    announceRow(next)
  }

  const renderRow = (row: Row<DataTableFeatures, TRow>, index: number, offset?: number) => (
    <tr
      key={row.id}
      data-index={index}
      aria-current={row.id === selectedRowId ? 'true' : undefined}
      className={clsx(
        // The sticky header does not hide a row brought into view.
        'grid h-row scroll-mt-row items-center font-mono text-data',
        offset !== undefined && 'absolute inset-x-0 top-0',
        row.id === selectedRowId
          ? 'bg-selected'
          : clsx(index % 2 === 1 && 'bg-row-alt', 'hover:bg-panel-header'),
        // The cursor shows to the keyboard only, as the focus does.
        !selects &&
          row.id === cursorId &&
          'group-focus-visible:outline-1 group-focus-visible:-outline-offset-1 group-focus-visible:outline-accent-amber',
        (onRowClick || onRowDoubleClick) && 'cursor-pointer',
        rowClassName?.(row.original),
      )}
      style={{
        gridTemplateColumns,
        transform: offset === undefined ? undefined : `translateY(${offset}px)`,
      }}
      onClick={
        onRowClick
          ? () => onRowClick(row.original)
          : keyboardRows
            ? () => setCursorId(row.id)
            : undefined
      }
      onDoubleClick={onRowDoubleClick && (() => onRowDoubleClick(row.original))}
      onContextMenu={(event) => onRowContextMenu(event, row.original)}
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
    <div
      ref={scrollRef}
      tabIndex={rows.length > 0 ? 0 : undefined}
      onKeyDown={onKeyDown}
      // The menu key of some keyboards, and screen readers, ask the focused table for a menu.
      onContextMenu={(event) => {
        if (event.target === event.currentTarget && openActiveMenu()) event.preventDefault()
      }}
      // An empty table, which takes no focus, scrolls nothing sideways either: its headers wider than
      // the panel would make a scrollable region the keyboard cannot reach (axe).
      className={clsx(
        'group relative h-full outline-none focus-visible:ring-1 focus-visible:ring-accent-amber focus-visible:ring-inset',
        rows.length > 0 ? 'overflow-auto' : 'overflow-x-hidden overflow-y-auto',
      )}
    >
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
                const sortable = !header.isPlaceholder && header.column.getCanSort()
                return (
                  <th
                    key={header.id}
                    scope="col"
                    // Screen readers hear the column sorted and which way (WCAG 1.3.1; B43).
                    aria-sort={
                      !sortable
                        ? undefined
                        : sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : 'none'
                    }
                    className={clsx(
                      'px-2 font-sans text-data font-normal text-secondary',
                      // A sort button is a 24 px target (WCAG 2.5.8) past the 22 px row, which
                      // must not clip it: its label truncates itself.
                      sortable ? 'min-w-0' : 'truncate',
                      align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {header.isPlaceholder ? null : sortable ? (
                      // The whole header sorts, not only its label (B81).
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={clsx(
                          '-my-px flex h-6 w-full min-w-6 items-center gap-0.5 align-middle hover:text-primary',
                          align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        <span data-sort-label className="truncate">
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
        {footer && (
          <tfoot className="grid">
            <tr
              className="grid h-row items-center border-t font-mono text-data"
              style={{ gridTemplateColumns }}
            >
              {leafColumns.map((column) => (
                <td
                  key={column.id}
                  className={clsx(
                    'truncate px-2',
                    column.columnDef.meta?.align === 'right' && 'text-right tabular-nums',
                  )}
                >
                  {footer.cells[column.id]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
      {rows.length === 0 && <PanelEmpty message={emptyMessage} />}
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={closeMenu} />}
    </div>
  )
}
