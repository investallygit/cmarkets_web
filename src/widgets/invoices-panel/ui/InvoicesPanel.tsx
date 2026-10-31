import { FileDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInvoicePdf, useInvoices } from '@/entities/subscription'
import type { InvoiceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<InvoiceDto>()
const getInvoiceId = (invoice: InvoiceDto) => invoice.id

/**
 * CFG, the invoices (GET /invoices): the plan's, the organisation's for its administrators, and
 * the receipts of research bought; each in PDF. A transfer still due shows its date. The PDF
 * button of the title bar downloads the invoice selected, a 24 px target that a button in a 22 px
 * row could not be (WCAG 2.5.8); a double click or Enter on a row also downloads it.
 */
export function InvoicesPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const invoices = useInvoices()
  const pdf = useInvoicePdf()
  const { mutate: fetchPdf } = pdf
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = invoices.data?.find((invoice) => invoice.id === selectedId)
  const download = (invoice: InvoiceDto) =>
    fetchPdf(invoice.id, { onSuccess: (blob) => saveBlob(blob, `${invoice.number}.pdf`) })

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('number', {
          header: t('invoices.number'),
          meta: { width: '124px' },
          cell: ({ getValue }) => <span className="font-mono">{getValue()}</span>,
        }),
        helper.accessor('issuedAt', {
          header: t('columns.date'),
          meta: { width: '88px' },
          cell: ({ getValue }) => format.date(getValue()),
        }),
        helper.accessor('label', {
          header: t('invoices.description'),
          meta: { width: '1.4fr' },
          cell: ({ row }) => {
            const invoice = row.original
            // The plan or the publication; the cycle and the period in the tooltip.
            const detail =
              invoice.kind === 'subscription' && invoice.billingCycle && invoice.periodStart
                ? t('invoices.plan', {
                    plan: invoice.label,
                    cycle: t(`subscription.cycles.${invoice.billingCycle}`),
                    from: format.isoDate(invoice.periodStart),
                    to: format.isoDate(invoice.periodEnd ?? invoice.periodStart),
                  })
                : t('invoices.publication', { title: invoice.label })
            return (
              <span title={detail} className="font-sans">
                {invoice.label}
              </span>
            )
          },
        }),
        helper.accessor('total', {
          header: t('invoices.total'),
          meta: { align: 'right', width: '92px' },
          cell: ({ getValue }) => format.number(getValue(), 0),
        }),
        helper.accessor('status', {
          header: t('columns.status'),
          meta: { width: '72px' },
          cell: ({ row }) =>
            row.original.status === 'due' ? (
              <span className="font-sans text-warning">
                {t('invoices.dueBy', {
                  date: row.original.dueOn ? format.dayMonth(row.original.dueOn) : '',
                })}
              </span>
            ) : (
              <span className="font-sans text-up">
                {t(`invoices.status.${row.original.status}`)}
              </span>
            ),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel
      title={t('panels.invoices')}
      code="CFG"
      options={
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && download(selected)}
          aria-label={selected ? t('invoices.download', { number: selected.number }) : undefined}
          title={selected ? undefined : t('invoices.downloadHint')}
          className="panel-no-drag inline-flex items-center gap-1 text-info enabled:hover:text-primary disabled:text-secondary/50"
        >
          <FileDown aria-hidden className="size-3" />
          {t('invoices.pdf')}
        </button>
      }
    >
      <QueryView query={invoices}>
        {(rows) => (
          <DataTable
            data={rows}
            columns={columns}
            getRowId={getInvoiceId}
            selectedRowId={selectedId}
            onRowClick={(invoice) => setSelectedId(invoice.id)}
            onRowDoubleClick={download}
            exportName="cmarket-invoices"
            emptyMessage={t('invoices.none')}
          />
        )}
      </QueryView>
      {pdf.error && (
        <p role="alert" className="px-2 py-1 font-sans text-data text-down">
          {pdf.error.message}
        </p>
      )}
    </Panel>
  )
}
