import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useColumnLabel, useImportCell, useIssueText } from '@/entities/data-import'
import type { ImportColumnDto, ImportRowDto } from '@/shared/api/contracts'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'

const helper = createDataColumnHelper<ImportRowDto>()
const getRowId = (row: ImportRowDto) => row.id

const NUMERIC = new Set<ImportColumnDto['kind']>(['number', 'integer', 'rate'])

/** ✓ for a row to publish, ! for an alert to check (✓ once checked), ✕ for an error. */
function RowMark({ row }: { row: ImportRowDto }) {
  if (row.status === 'error') return <span className="text-down">✕</span>
  if (row.status === 'alert') {
    return <span className="text-warning">{row.checked ? '✓' : '!'}</span>
  }
  return <span className="text-up">✓</span>
}

interface ImportRowsTableProps {
  rows: ImportRowDto[]
  /** The template's columns found in the file. */
  columns: readonly ImportColumnDto[]
  selectedId: string | null
  onSelect: (row: ImportRowDto) => void
  exportName: string
  emptyMessage: string
}

/**
 * The rows of an upload as read, each with its check: the reason of an alert in yellow, of an
 * error in red; a changed cell in amber, with the stored value in its tooltip.
 */
export function ImportRowsTable({
  rows,
  columns,
  selectedId,
  onSelect,
  exportName,
  emptyMessage,
}: ImportRowsTableProps) {
  const { t } = useTranslation()
  const cell = useImportCell()
  const issueText = useIssueText()
  const columnLabel = useColumnLabel()

  const tableColumns = useMemo(
    () =>
      helper.columns([
        helper.display({
          id: 'mark',
          header: '',
          meta: { width: '24px', exportable: false },
          cell: ({ row }) => <RowMark row={row.original} />,
        }),
        ...columns.map((column) =>
          helper.accessor((row) => row.values[column.name] ?? '', {
            id: column.name,
            header: columnLabel(column.name),
            meta: {
              align: NUMERIC.has(column.kind) ? 'right' : 'left',
              width:
                column.kind === 'date'
                  ? '92px'
                  : NUMERIC.has(column.kind)
                    ? 'minmax(56px, 0.8fr)'
                    : column.name === 'name'
                      ? '2fr'
                      : '1fr',
            },
            cell: ({ row }) => {
              const { values, stored, issues } = row.original
              const value = values[column.name]
              const changed =
                stored !== null && column.name in stored && stored[column.name] !== value
              const wrong = issues.some(
                (issue) => issue.column === column.name && issue.severity === 'error',
              )
              return (
                <span
                  title={
                    changed
                      ? t('dataImport.stored', { value: cell(column, stored[column.name]) })
                      : undefined
                  }
                  className={clsx(
                    wrong && 'text-down underline decoration-dotted',
                    !wrong && changed && 'text-accent-amber',
                    !wrong && !changed && column.name === 'country' && 'text-accent-amber',
                    !wrong && !changed && column.kind === 'date' && 'text-secondary',
                  )}
                >
                  {cell(column, value)}
                </span>
              )
            },
          }),
        ),
        helper.accessor((row) => row.issues.map(issueText).join(' · '), {
          id: 'check',
          header: t('dataImport.check'),
          meta: { width: '3fr' },
          cell: ({ row, getValue }) => (
            <span
              title={getValue()}
              className={clsx(
                'font-mono',
                row.original.status === 'error' ? 'text-down' : 'text-warning',
              )}
            >
              {getValue()}
            </span>
          ),
        }),
      ]),
    [columns, t, cell, issueText, columnLabel],
  )

  return (
    <DataTable
      data={rows}
      columns={tableColumns}
      getRowId={getRowId}
      selectedRowId={selectedId}
      onRowClick={onSelect}
      enableSorting={false}
      exportName={exportName}
      emptyMessage={emptyMessage}
      rowClassName={(row) =>
        row.status === 'alert' && !row.checked
          ? 'shadow-[inset_3px_0_0_var(--color-warning)]'
          : row.status === 'error'
            ? 'shadow-[inset_3px_0_0_var(--color-down)]'
            : undefined
      }
    />
  )
}
