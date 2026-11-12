import type { TFunction } from 'i18next'
import { useContext, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useEtfLabels, useEtfScreener } from '@/entities/etf'
import { useSecurityMenu } from '@/features/security-actions'
import type { EtfScreenerQuery, EtfScreenerRowDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { ChangeText } from '@/shared/ui/ChangeText'
import { CountryFlag } from '@/shared/ui/CountryFlag'
import { createDataColumnHelper, type DataColumns } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'

const helper = createDataColumnHelper<EtfScreenerRowDto>()
const getEtfId = (row: EtfScreenerRowDto) => row.etfId

function buildColumns(
  t: TFunction,
  format: ReturnType<typeof useFormat>,
  labels: ReturnType<typeof useEtfLabels>,
): DataColumns<EtfScreenerRowDto> {
  const change = (key: 'ytdPct' | 'oneYearPct', header: string) =>
    helper.accessor((row) => row[key] ?? undefined, {
      id: key,
      header,
      meta: { align: 'right', width: '0.85fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : <ChangeText value={value} percent />
      },
    })
  return [
    helper.accessor('code', {
      header: t('etfScreener.columns.ticker'),
      meta: { width: '0.95fr' },
      cell: ({ row, getValue }) => (
        <span className="inline-flex items-center gap-1.5">
          <CountryFlag
            code={row.original.domicile}
            label={t('etfScreener.domicile', { country: format.country(row.original.domicile) })}
          />
          <span className="text-accent-amber">{getValue()}</span>
        </span>
      ),
    }),
    helper.accessor('shortName', {
      header: t('etfScreener.columns.name'),
      meta: { width: '2.1fr' },
    }),
    helper.accessor((row) => labels.classLine(row.assetClass, row.geography), {
      id: 'class',
      header: t('etfScreener.columns.class'),
      meta: { width: '1.4fr' },
      cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
    }),
    helper.accessor('issuer', {
      header: t('etfScreener.columns.issuer'),
      meta: { width: '1fr' },
    }),
    helper.accessor((row) => `${labels.exchange(row.exchange)} · ${row.currency}`, {
      id: 'listing',
      header: t('etfScreener.columns.listing'),
      meta: { width: '1.4fr' },
      cell: ({ getValue }) => <span className="text-secondary">{getValue()}</span>,
    }),
    helper.accessor('terPct', {
      header: t('etfScreener.columns.ter'),
      meta: { align: 'right', width: '0.7fr' },
      cell: ({ getValue }) => format.percent(getValue(), 2, false),
    }),
    helper.accessor((row) => row.aum ?? undefined, {
      id: 'aum',
      header: t('etfScreener.columns.aum'),
      meta: { align: 'right', width: '0.95fr' },
      sortUndefined: 'last',
      cell: ({ row, getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : labels.size(value, row.original.currency)
      },
    }),
    change('ytdPct', t('etfScreener.columns.ytd')),
    change('oneYearPct', t('etfScreener.columns.oneYear')),
    helper.accessor((row) => row.sharpe ?? undefined, {
      id: 'sharpe',
      header: t('etfScreener.columns.sharpe'),
      meta: { align: 'right', width: '0.7fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : format.number(value, 2)
      },
    }),
    helper.accessor((row) => row.volatility1yPct ?? undefined, {
      id: 'volatility',
      header: t('etfScreener.columns.volatility'),
      meta: { align: 'right', width: '0.75fr' },
      sortUndefined: 'last',
      cell: ({ getValue }) => {
        const value = getValue()
        return value === undefined ? '—' : format.percent(value, 1, false)
      },
    }),
  ]
}

interface EtfScreenerResultsPanelProps {
  /** The criteria of the last run. */
  query: EtfScreenerQuery
  selectedId: string | null
  onSelect: (etfId: string) => void
}

/**
 * Screen 15, results: the ETFs of the latest calculation that meet the criteria, the flag of each
 * fund's domicile left of its ticker; a click shows the ETF in the lower panel, a double-click opens
 * its profile; XLSX and CSV for the accounts that export. No comparison block (spec, screen 15).
 */
export function EtfScreenerResultsPanel({
  query,
  selectedId,
  onSelect,
}: EtfScreenerResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const navigate = useNavigate()
  const securityMenu = useSecurityMenu()
  const canExport = useContext(TableExportContext)
  const exportRef = useRef<TableExporter | null>(null)
  const results = useEtfScreener(query)
  const columns = useMemo(() => buildColumns(t, format, labels), [t, format, labels])
  const computedAt = results.data?.computedAt

  return (
    <Panel
      title={
        results.data
          ? t('etfScreener.results', { count: results.data.total })
          : t('etfScreener.resultsTitle')
      }
      code="ETFS"
      options={
        <span className="panel-no-drag flex items-center gap-1.5">
          {computedAt && (
            <span>
              {t('etfScreener.computed', {
                date: format.date(computedAt),
                time: format.time(computedAt),
              })}
            </span>
          )}
          {canExport && (
            <>
              {computedAt && <span aria-hidden>·</span>}
              <span>{t('etfScreener.export')}</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('xlsx')}
                aria-label={t('etfScreener.exportAs', { format: 'XLSX' })}
                className="uppercase hover:text-primary"
              >
                XLSX
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => exportRef.current?.('csv')}
                aria-label={t('etfScreener.exportAs', { format: 'CSV' })}
                className="uppercase hover:text-primary"
              >
                CSV
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
              getRowId={getEtfId}
              selectedRowId={selectedId}
              onRowClick={(row) => onSelect(row.etfId)}
              onRowDoubleClick={(row) => void navigate(securityPath(row.etfId))}
              rowMenu={(row) => securityMenu({ id: row.etfId, code: row.code })}
              exportName="etfs-results"
              exportRef={exportRef}
              emptyMessage={data.date ? t('etfScreener.noResult') : t('etfScreener.notComputed')}
            />
          )}
        </QueryView>
      </div>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('etfScreener.resultsHint')}
      </p>
    </Panel>
  )
}
