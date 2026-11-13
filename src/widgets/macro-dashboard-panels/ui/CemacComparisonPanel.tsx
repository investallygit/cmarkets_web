import { clsx } from 'clsx'
import { useContext, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMacroFigure, useCemacTable, useMacroNames } from '@/entities/macro'
import type { CemacTableCellDto, CemacTableRowDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'

const helper = createDataColumnHelper<CemacTableRowDto>()
const getIndicator = (row: CemacTableRowDto) => row.indicator

/** A figure shown: one of ten years or less; an older one or none is "n/a". */
const shown = (cell: CemacTableCellDto | undefined) => (cell?.current ? cell.latest : null)

/**
 * Screen 25's CEMAC comparison (spec section 9): the six states and Sub-Saharan Africa on the
 * mockup's indicators, each economy's latest figure, its year beside it when not the row's, its
 * source when a Data admin's file gave it; "n/a" where the World Bank publishes none. XLSX export.
 * API /macro/cemac-table.
 */
export function CemacComparisonPanel() {
  const { t } = useTranslation()
  const locale = useLocale()
  const names = useMacroNames()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const table = useCemacTable()
  const countries = table.data?.countries

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((row) => names.withUnit(row), {
          id: 'indicator',
          header: t('eco.columns.indicator'),
          meta: { width: 'minmax(176px, 2fr)' },
          cell: ({ getValue }) => <span className="font-mono text-primary">{getValue()}</span>,
        }),
        ...(countries ?? []).map((country, index) =>
          helper.accessor((row) => shown(row.values[index])?.value, {
            id: country.code,
            header: names.economy(country, true),
            meta: { align: 'right', width: 'minmax(84px, 1fr)' },
            cell: ({ row }) => {
              const cell = row.original.values[index]
              const latest = shown(cell)
              if (!latest)
                return (
                  <span
                    className="text-secondary"
                    title={
                      cell?.latest
                        ? t('eco.notSince', { year: cell.latest.year })
                        : t('eco.notPublished')
                    }
                  >
                    {t('eco.notAvailable')}
                  </span>
                )
              const publisher =
                latest.publisher === 'worldBank' ? null : t(`eco.publishers.${latest.publisher}`)
              return (
                <span
                  className={clsx('tabular-nums', latest.value < 0 ? 'text-down' : 'text-primary')}
                  title={
                    publisher
                      ? t('eco.source', {
                          source: [publisher, latest.comment].filter(Boolean).join(', '),
                        })
                      : undefined
                  }
                >
                  {formatMacroFigure(latest.value, row.original.unit, locale, 'table')}
                  {latest.year !== row.original.year && (
                    <span className="ml-1 text-label text-secondary">{latest.year}</span>
                  )}
                  {publisher && (
                    <span className="ml-1 text-label text-accent-amber">{publisher}</span>
                  )}
                </span>
              )
            },
          }),
        ),
        helper.accessor('year', {
          header: t('eco.columns.year'),
          meta: { align: 'right', width: 'minmax(56px, 0.6fr)' },
          cell: ({ getValue }) => <span className="text-secondary">{getValue() ?? '–'}</span>,
        }),
      ]),
    [countries, locale, names, t],
  )

  return (
    <Panel
      title={t('panels.cemacComparison')}
      code="ECO"
      options={
        canExport && (
          <span className="panel-no-drag flex items-center gap-1.5">
            <span>{t('eco.export')}</span>
            <button
              type="button"
              onClick={() => exportRef.current?.('xlsx')}
              aria-label={t('eco.exportTable')}
              className="uppercase hover:text-primary"
            >
              XLSX
            </button>
          </span>
        )
      }
    >
      <QueryView query={table} isEmpty={(data) => data.rows.length === 0}>
        {(data) => (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <DataTable
                data={data.rows}
                columns={columns}
                getRowId={getIndicator}
                exportName="eco-cemac-comparison"
                exportRef={exportRef}
                enableSorting={false}
              />
            </div>
            <p className="shrink-0 border-t px-3 py-2 font-sans text-label text-secondary">
              {t('eco.tableNote')}
            </p>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
