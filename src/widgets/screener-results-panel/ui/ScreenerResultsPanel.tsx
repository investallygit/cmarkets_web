import type { TFunction } from 'i18next'
import { Columns3 } from 'lucide-react'
import { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useFormatRatio } from '@/entities/fundamentals'
import { LiveChangePct, LivePrice, priceDecimals } from '@/entities/quote'
import { useScreener } from '@/entities/screener'
import { useSecurityMenu } from '@/features/security-actions'
import type { RatioKey, ScreenerCriterionDto, ScreenerRowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useSymbolSubscription } from '@/shared/realtime'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'
import { RESULT_COLUMNS, useResultColumns, type ResultColumn } from '../model/columns'

const helper = createDataColumnHelper<ScreenerRowDto>()
const getSecurityId = (row: ScreenerRowDto) => row.securityId
type Column = DataColumns<ScreenerRowDto>[number]

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  formatRatio: ReturnType<typeof useFormatRatio>,
  visible: readonly ResultColumn[],
): DataColumns<ScreenerRowDto> {
  const ratio = (key: Extract<RatioKey, ResultColumn>): Column =>
    helper.accessor((row) => row[key] ?? undefined, {
      id: key,
      header: t(`screener.columns.${key}`),
      meta: { align: 'right' },
      sortUndefined: 'last',
      cell: ({ getValue }) => formatRatio(key, getValue() ?? null),
    })
  const change = (key: 'change1y' | 'revenueGrowth'): Column =>
    helper.accessor((row) => row[key] ?? undefined, {
      id: key,
      header: t(`screener.columns.${key}`),
      meta: { align: 'right' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : <ChangeText value={value} percent decimals={1} />
      },
    })
  const columns: Record<ResultColumn, Column> = {
    name: helper.accessor('name', {
      header: t('columns.name'),
      meta: { width: '2fr' },
      cell: ({ getValue }) => <span className="font-sans text-secondary">{getValue()}</span>,
    }),
    sector: helper.accessor('sector', {
      header: t('screener.columns.sector'),
      meta: { width: '1.3fr' },
      cell: ({ getValue }) => <span className="font-sans">{getValue()}</span>,
    }),
    country: helper.accessor('country', { header: t('columns.country'), meta: { width: '72px' } }),
    marketCap: helper.accessor('marketCap', {
      header: t('screener.columns.marketCap'),
      meta: { align: 'right' },
      cell: ({ getValue }) => format.number(getValue() / 1e9, 1),
    }),
    last: helper.accessor('last', {
      header: t('columns.last'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LivePrice
          symbol={row.original.securityId}
          value={row.original.last}
          decimals={priceDecimals('equity', row.original.currency)}
          isDelayed={row.original.isDelayed}
        />
      ),
    }),
    pe: ratio('pe'),
    dividendYield: ratio('dividendYield'),
    priceToBook: ratio('priceToBook'),
    roe: ratio('roe'),
    netMargin: ratio('netMargin'),
    netDebtToEquity: ratio('netDebtToEquity'),
    revenueGrowth: change('revenueGrowth'),
    beta: helper.accessor((row) => row.beta ?? undefined, {
      id: 'beta',
      header: t('screener.columns.beta'),
      meta: { align: 'right' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : format.number(value, 2)
      },
    }),
    change1y: change('change1y'),
    changePct: helper.accessor('changePct', {
      header: t('screener.columns.changePct'),
      meta: { align: 'right' },
      cell: ({ row }) => (
        <LiveChangePct symbol={row.original.securityId} value={row.original.changePct} />
      ),
    }),
  }
  return [
    helper.accessor('code', {
      header: t('columns.security'),
      meta: { width: '1.3fr' },
      cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
    }),
    ...RESULT_COLUMNS.filter((column) => visible.includes(column)).map((key) => columns[key]),
  ]
}

interface ScreenerResultsPanelProps {
  /** The criteria of the last run. */
  criteria: ScreenerCriterionDto[]
  selectedId: string | null
  onSelect: (securityId: string) => void
}

/**
 * Screen 3, results: sortable table, XLSX / CSV export, configurable columns; a click shows the
 * security in the lower panels, a double-click opens DES. API POST /analysis/screener.
 */
export function ScreenerResultsPanel({
  criteria,
  selectedId,
  onSelect,
}: ScreenerResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const formatRatio = useFormatRatio()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const visible = useResultColumns((state) => state.columns)
  const results = useScreener({ criteria })
  const items = results.data?.items
  useSymbolSubscription(items?.map((item) => item.securityId) ?? [])

  const columns = useMemo(
    () => buildColumns(t, format, formatRatio, visible),
    [t, format, formatRatio, visible],
  )

  return (
    <Panel
      title={
        results.data
          ? t('screener.results', {
              count: results.data.items.length,
              universe: results.data.universe,
            })
          : t('screener.resultsTitle')
      }
      code="EQS"
      options={
        <>
          {canExport && (
            <span className="panel-no-drag flex items-center gap-1.5">
              <span>{t('screener.export')}</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                className="hover:text-primary"
              >
                XLSX
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('csv')}
                className="hover:text-primary"
              >
                CSV
              </button>
            </span>
          )}
          <ColumnsMenu />
        </>
      }
      bodyClassName="flex flex-col"
    >
      <div className="min-h-0 flex-1">
        <QueryView query={results}>
          {(data) => (
            <DataTable
              data={data.items}
              columns={columns}
              getRowId={getSecurityId}
              selectedRowId={selectedId}
              onRowClick={(row) => onSelect(row.securityId)}
              onRowDoubleClick={(row) => void navigate(securityPath(row.securityId))}
              rowMenu={(row) => securityMenu({ id: row.securityId, code: row.code })}
              exportName="eqs-results"
              exportRef={exportRef}
              emptyMessage={t('screener.noResult')}
            />
          )}
        </QueryView>
      </div>
      <p className="shrink-0 truncate border-t px-2 py-1 font-sans text-title text-secondary">
        {t('screener.resultsHint')}
      </p>
    </Panel>
  )
}

/** COLUMNS in the title bar: tick the columns to show. */
function ColumnsMenu() {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setPosition(null), [])
  const columns = useResultColumns((state) => state.columns)
  const toggle = useResultColumns((state) => state.toggle)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={position !== null}
        onClick={(event) => {
          if (position) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ x: rect.right, y: rect.bottom + 4 })
        }}
        className="panel-no-drag inline-flex items-center gap-1 uppercase hover:text-primary"
      >
        <Columns3 aria-hidden className="size-3" />
        {t('screener.columnsMenu')}
      </button>
      {position && (
        <ContextMenu
          align="end"
          x={position.x}
          y={position.y}
          items={RESULT_COLUMNS.map((column) => ({
            id: column,
            label:
              column === 'name' || column === 'last'
                ? t(`columns.${column}`)
                : column === 'changePct'
                  ? t('screener.dayChange')
                  : t(`screener.fields.${column}`),
            checked: columns.includes(column),
            onSelect: () => toggle(column),
          }))}
          onClose={close}
          ignoreRef={buttonRef}
        />
      )}
    </>
  )
}
