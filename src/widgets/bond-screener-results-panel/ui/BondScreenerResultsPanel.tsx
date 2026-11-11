import type { TFunction } from 'i18next'
import { clsx } from 'clsx'
import { useContext, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useBondLabels, useBondScreener, ytwDiffers } from '@/entities/bond'
import { useSecurityMenu } from '@/features/security-actions'
import type { BondScreenerQuery, BondScreenerRowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'

const helper = createDataColumnHelper<BondScreenerRowDto>()
const getBondId = (row: BondScreenerRowDto) => row.bondId

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  labels: ReturnType<typeof useBondLabels>,
): DataColumns<BondScreenerRowDto> {
  const figure = (
    key: 'dirtyPrice' | 'ytmPct' | 'currentYieldPct' | 'modifiedDuration',
    header: string,
    width: string,
  ) =>
    helper.accessor((row) => row[key] ?? undefined, {
      id: key,
      header,
      meta: { align: 'right', width },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : format.number(value, 2)
      },
    })
  return [
    helper.accessor('code', {
      header: t('bondScreener.columns.bond'),
      meta: { width: '2fr' },
      cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
    }),
    helper.accessor((row) => labels.issuer(row.issuerCategory, row.country), {
      id: 'issuer',
      header: t('bondScreener.columns.issuer'),
      meta: { width: '1.4fr' },
      cell: ({ getValue }) => <span className="font-sans text-secondary">{getValue()}</span>,
    }),
    helper.accessor((row) => labels.market(row.market), {
      id: 'market',
      header: t('bondScreener.columns.market'),
      meta: { width: '0.8fr' },
    }),
    helper.accessor('couponPct', {
      header: t('bondScreener.columns.coupon'),
      meta: { align: 'right', width: '0.95fr' },
      cell: ({ row }) => labels.coupon(row.original.couponType, row.original.couponPct),
    }),
    helper.accessor('maturityDate', {
      header: t('bondScreener.columns.maturity'),
      meta: { align: 'right', width: '1.1fr' },
      cell: ({ getValue }) => format.isoDate(getValue()),
    }),
    helper.accessor((row) => row.cleanPrice ?? undefined, {
      id: 'cleanPrice',
      header: t('bondScreener.columns.cleanPrice'),
      meta: { align: 'right', width: '1fr' },
      sortUndefined: 'last',
      cell: ({ row, getValue }) => {
        const value = getValue()
        if (value === undefined) return '—'
        // An asterisk: a model price, no recent quote.
        return row.original.priceSource === 'model' ? (
          <span title={t('bondScreener.modelPrice')}>{format.number(value, 2)}*</span>
        ) : (
          format.number(value, 2)
        )
      },
    }),
    figure('dirtyPrice', t('bondScreener.columns.dirtyPrice'), '1fr'),
    figure('ytmPct', t('bondScreener.columns.ytm'), '0.8fr'),
    helper.accessor((row) => row.ytwPct ?? undefined, {
      id: 'ytwPct',
      header: t('bondScreener.columns.ytw'),
      meta: { align: 'right', width: '0.8fr' },
      sortUndefined: 'last',
      cell: ({ row, getValue }) => {
        const value = getValue()
        if (value === undefined) return '—'
        const differs = ytwDiffers(row.original)
        return (
          <span
            className={clsx(differs && 'text-warning')}
            title={
              differs && row.original.ytwDate
                ? t('bondScreener.ytwTo', { date: format.isoDate(row.original.ytwDate) })
                : undefined
            }
          >
            {format.number(value, 2)}
          </span>
        )
      },
    }),
    figure('currentYieldPct', t('bondScreener.columns.currentYield'), '1.05fr'),
    helper.accessor((row) => row.spreadBp ?? undefined, {
      id: 'spreadBp',
      header: t('bondScreener.columns.spread'),
      meta: { align: 'right', width: '0.9fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => labels.spread(getValue() ?? null),
    }),
    helper.accessor((row) => row.rating ?? undefined, {
      id: 'rating',
      header: t('bondScreener.columns.rating'),
      meta: { width: '0.7fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => (
        <span className={clsx(getValue() === undefined && 'text-secondary')}>
          {labels.rating(getValue() ?? null)}
        </span>
      ),
    }),
    figure('modifiedDuration', t('bondScreener.columns.modifiedDuration'), '0.8fr'),
  ]
}

interface BondScreenerResultsPanelProps {
  /** The criteria of the last run. */
  query: BondScreenerQuery
  selectedId: string | null
  onSelect: (bondId: string) => void
}

/**
 * Screen 17, results: the bonds of the latest daily calculation that meet the criteria, model
 * prices starred, a yield to worst other than the yield to maturity in yellow; a click shows the
 * bond in the lower panel, a double-click opens its profile; XLSX for the accounts that export.
 */
export function BondScreenerResultsPanel({
  query,
  selectedId,
  onSelect,
}: BondScreenerResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useBondLabels()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const results = useBondScreener(query)
  const columns = useMemo(() => buildColumns(t, format, labels), [t, format, labels])
  const computedAt = results.data?.computedAt

  return (
    <Panel
      title={
        results.data
          ? t('bondScreener.results', { count: results.data.total })
          : t('bondScreener.resultsTitle')
      }
      code="BS"
      options={
        <span className="panel-no-drag flex items-center gap-1.5">
          {computedAt && (
            <span>
              {t('bondScreener.computed', {
                date: format.date(computedAt),
                time: format.time(computedAt),
              })}
            </span>
          )}
          {canExport && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                className="uppercase hover:text-primary"
              >
                {t('bondScreener.export')}
              </button>
            </>
          )}
        </span>
      }
      bodyClassName="flex flex-col"
    >
      <div className="min-h-0 flex-1">
        <QueryView query={results}>
          {(data) => (
            <DataTable
              data={data.items}
              columns={columns}
              getRowId={getBondId}
              selectedRowId={selectedId}
              onRowClick={(row) => onSelect(row.bondId)}
              onRowDoubleClick={(row) => void navigate(securityPath(row.bondId))}
              rowMenu={(row) => securityMenu({ id: row.bondId, code: row.code })}
              exportName="bs-results"
              exportRef={exportRef}
              emptyMessage={data.date ? t('bondScreener.noResult') : t('bondScreener.notComputed')}
            />
          )}
        </QueryView>
      </div>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('bondScreener.resultsHint')}
      </p>
    </Panel>
  )
}
