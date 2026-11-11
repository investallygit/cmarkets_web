import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsSourceTag } from '@/entities/news'
import {
  STATEMENT_CYCLE,
  STATEMENT_TEXT,
  StatementStatusBadge,
  usePaymentSettings,
  useStatements,
} from '@/entities/news-statement'
import { PaymentSettingsDialog } from '@/features/edit-payment-settings'
import type { NewsStatementRowDto } from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable, type TableExporter } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

const helper = createDataColumnHelper<NewsStatementRowDto>()
const getId = (row: NewsStatementRowDto) => row.id

interface StatementsPanelProps {
  month: string
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * MPAY, the monthly statements by newspaper (the screen 18 mockup): rate per click, items,
 * unique, excluded and payable clicks, gross amount, cap, amount due and status, with a total;
 * the global settings, the table as XLSX and the transfer file of the approved, unpaid
 * statements in the title bar; the cycle below.
 */
export function StatementsPanel({ month, selectedId, onSelect }: StatementsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const statements = useStatements(month)
  const settings = usePaymentSettings()
  const exportRef = useRef<TableExporter | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const money = (value: number) => format.number(value, 0)

  const columns = useMemo(() => {
    const whole = (value: number) => format.number(value, 0)
    return helper.columns([
      helper.accessor((row) => row.source.shortName, {
        id: 'newspaper',
        header: t('mediaPayments.columns.newspaper'),
        meta: { width: '1.4fr' },
        cell: ({ row }) => <NewsSourceTag source={row.original.source} mode="none" />,
      }),
      helper.accessor('ratePerClick', {
        header: t('mediaPayments.columns.rate'),
        meta: { align: 'right', width: '72px' },
        cell: ({ getValue }) => whole(getValue()),
      }),
      helper.accessor('items', {
        header: t('mediaPayments.columns.items'),
        meta: { align: 'right', width: '56px' },
      }),
      helper.accessor('uniqueClicks', {
        header: t('mediaPayments.columns.unique'),
        meta: { align: 'right', width: '1fr' },
        cell: ({ getValue }) => whole(getValue()),
      }),
      helper.accessor('excludedClicks', {
        header: t('mediaPayments.columns.excluded'),
        meta: { align: 'right', width: '80px' },
        cell: ({ getValue }) => <span className="text-accent-amber">{whole(getValue())}</span>,
      }),
      helper.accessor('payableClicks', {
        header: t('mediaPayments.columns.payable'),
        meta: { align: 'right', width: '1fr' },
        cell: ({ getValue }) => whole(getValue()),
      }),
      helper.accessor('grossAmount', {
        header: t('mediaPayments.columns.gross'),
        meta: { align: 'right', width: '1fr' },
        cell: ({ getValue }) => <span className="text-secondary">{whole(getValue())}</span>,
      }),
      helper.accessor((row) => row.monthlyCap ?? -1, {
        id: 'cap',
        header: t('mediaPayments.columns.cap'),
        meta: { align: 'right', width: '1fr' },
        cell: ({ row }) => (
          <span className="text-secondary">
            {row.original.monthlyCap === null ? '—' : whole(row.original.monthlyCap)}
          </span>
        ),
      }),
      helper.accessor('amountDue', {
        header: t('mediaPayments.columns.due'),
        meta: { align: 'right', width: '1fr' },
        cell: ({ row, getValue }) =>
          row.original.carriedOver > 0 && getValue() === 0 ? (
            <span className="text-secondary">{t('mediaPayments.carriedOver')}</span>
          ) : (
            whole(getValue())
          ),
      }),
      helper.accessor((row) => t(`mediaPayments.statuses.${row.status}`), {
        id: 'status',
        header: t('mediaPayments.columns.status'),
        meta: { width: '1.2fr' },
        cell: ({ row, getValue }) => (
          <span className={STATEMENT_TEXT[row.original.status]}>{getValue()}</span>
        ),
      }),
    ])
  }, [t, format])

  const transfer = (fileFormat: 'xlsx' | 'csv') =>
    adminApi
      .transferFile(month, fileFormat)
      .then((blob) => saveBlob(blob, `cmarket-transfers-${month}.${fileFormat}`))
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : String(error)),
      )

  const links = (
    <span className="panel-no-drag flex items-center gap-1.5">
      <button
        type="button"
        className="uppercase hover:text-primary"
        onClick={() => setSettingsOpen(true)}
      >
        {t('mediaPayments.links.settings')}
      </button>
      <span aria-hidden>·</span>
      <button
        type="button"
        className="uppercase hover:text-primary"
        onClick={() => exportRef.current?.('xlsx')}
      >
        {t('mediaPayments.links.exportXlsx')}
      </button>
      <span aria-hidden>·</span>
      <span className="uppercase">{t('mediaPayments.links.transfers')}</span>
      <button type="button" className="hover:text-primary" onClick={() => void transfer('xlsx')}>
        XLSX
      </button>
      <button type="button" className="hover:text-primary" onClick={() => void transfer('csv')}>
        CSV
      </button>
    </span>
  )

  return (
    <Panel title={t('panels.mediaStatements')} code="MPAY" options={links}>
      <QueryView query={statements}>
        {(rows) => {
          const total = (pick: (row: NewsStatementRowDto) => number) =>
            rows.reduce((sum, row) => sum + pick(row), 0)
          return (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1">
                <DataTable
                  data={rows}
                  columns={columns}
                  getRowId={getId}
                  selectedRowId={selectedId}
                  onRowClick={(row) => onSelect(row.id)}
                  exportName={`media-statements-${month}`}
                  exportRef={exportRef}
                  emptyMessage={t('mediaPayments.none')}
                  footer={{
                    cells: {
                      newspaper: (
                        <span className="font-semibold uppercase text-accent-amber">
                          {t('mediaPayments.columns.total')}
                        </span>
                      ),
                      uniqueClicks: (
                        <span className="text-accent-amber">
                          {money(total((row) => row.uniqueClicks))}
                        </span>
                      ),
                      excludedClicks: (
                        <span className="text-accent-amber">
                          {money(total((row) => row.excludedClicks))}
                        </span>
                      ),
                      payableClicks: (
                        <span className="text-accent-amber">
                          {money(total((row) => row.payableClicks))}
                        </span>
                      ),
                      grossAmount: (
                        <span className="text-accent-amber">
                          {money(total((row) => row.grossAmount))}
                        </span>
                      ),
                      amountDue: (
                        <span className="text-accent-amber">
                          {money(total((row) => row.amountDue))}
                        </span>
                      ),
                    },
                    values: {
                      newspaper: t('mediaPayments.columns.total'),
                      uniqueClicks: total((row) => row.uniqueClicks),
                      excludedClicks: total((row) => row.excludedClicks),
                      payableClicks: total((row) => row.payableClicks),
                      grossAmount: total((row) => row.grossAmount),
                      amountDue: total((row) => row.amountDue),
                    },
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 border-t border-border px-3 py-2 font-sans text-caption text-secondary">
                <p className="flex flex-wrap items-center gap-1">
                  <span>{t('mediaPayments.cycle')}</span>
                  {STATEMENT_CYCLE.map((status) => (
                    <StatementStatusBadge key={status} status={status} />
                  ))}
                </p>
                <p>
                  {t('mediaPayments.cycleNote', {
                    day: settings.data?.calculationDay ?? 1,
                    time: settings.data?.calculationTime ?? '02:00',
                  })}
                </p>
                <p>{t('mediaPayments.manualNote')}</p>
              </div>
            </div>
          )
        }}
      </QueryView>
      <PaymentSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Panel>
  )
}
