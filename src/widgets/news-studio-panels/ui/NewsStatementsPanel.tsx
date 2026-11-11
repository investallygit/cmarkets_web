import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatementStatusBadge, useProviderStatements } from '@/entities/news-statement'
import { DisputeStatementDialog } from '@/features/dispute-statement'
import type { ProviderStatementDto } from '@/shared/api/contracts'
import { providerApi } from '@/shared/api/endpoints'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

const helper = createDataColumnHelper<ProviderStatementDto>()
const getId = (statement: ProviderStatementDto) => statement.id
const DAY = 24 * 60 * 60 * 1000

/**
 * The newspaper's monthly statements in its studio (spec, screen 18: it "follows its statements on
 * screen 13"): the month, the payable clicks, the amount due and the status; the PDF once
 * approved, a dispute within the window after the approval, the payment and the Admin's answer.
 */
export function NewsStatementsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const statements = useProviderStatements()
  const [disputing, setDisputing] = useState<ProviderStatementDto | null>(null)

  const columns = useMemo(() => {
    const pdf = (statement: ProviderStatementDto) =>
      providerApi
        .statementPdf(statement.id)
        .then((blob) => saveBlob(blob, `${statement.reference}.pdf`))
        .catch((error: unknown) =>
          toast.error(error instanceof Error ? error.message : String(error)),
        )
    return helper.columns([
      helper.accessor('month', {
        header: t('mediaPayments.studio.columns.month'),
        meta: { width: '1fr' },
        cell: ({ getValue }) => format.month(getValue()),
      }),
      helper.accessor('reference', {
        header: t('mediaPayments.studio.columns.reference'),
        meta: { width: '1.4fr' },
      }),
      helper.accessor('payableClicks', {
        header: t('mediaPayments.studio.columns.payable'),
        meta: { align: 'right', width: '88px' },
        cell: ({ getValue }) => format.number(getValue(), 0),
      }),
      helper.accessor('amountDue', {
        header: t('mediaPayments.studio.columns.due'),
        meta: { align: 'right', width: '96px' },
        cell: ({ row, getValue }) =>
          row.original.carriedOver > 0 && getValue() === 0
            ? t('mediaPayments.carriedOver')
            : format.number(getValue(), 0),
      }),
      helper.accessor((statement) => t(`mediaPayments.statuses.${statement.status}`), {
        id: 'status',
        header: t('mediaPayments.studio.columns.status'),
        meta: { width: '1.6fr' },
        cell: ({ row }) => {
          const statement = row.original
          return (
            <span className="flex min-w-0 items-center gap-2">
              <StatementStatusBadge status={statement.status} />
              <span className="truncate text-secondary">
                {statement.paidOn
                  ? t('mediaPayments.studio.paidOn', { date: format.isoDate(statement.paidOn) })
                  : statement.dispute?.answer
                    ? t('mediaPayments.studio.answer', { answer: statement.dispute.answer })
                    : ''}
              </span>
            </span>
          )
        },
      }),
      helper.display({
        id: 'actions',
        header: '',
        meta: { width: '160px', exportable: false },
        cell: ({ row }) => (
          <span className="flex gap-1">
            {row.original.hasPdf && (
              <Button size="sm" variant="secondary" onClick={() => void pdf(row.original)}>
                {t('mediaPayments.studio.pdf')}
              </Button>
            )}
            {row.original.canDispute && (
              <Button size="sm" variant="danger" onClick={() => setDisputing(row.original)}>
                {t('mediaPayments.studio.dispute')}
              </Button>
            )}
          </span>
        ),
      }),
    ])
  }, [t, format])

  const days =
    disputing?.approvedAt && disputing.disputeUntil
      ? Math.round((Date.parse(disputing.disputeUntil) - Date.parse(disputing.approvedAt)) / DAY)
      : 15

  return (
    <Panel title={t('panels.newsStatements')} code="NEWS">
      <QueryView query={statements}>
        {(list) => (
          <DataTable
            data={list}
            columns={columns}
            getRowId={getId}
            exportName="statements"
            emptyMessage={t('mediaPayments.studio.none')}
          />
        )}
      </QueryView>
      <DisputeStatementDialog
        statement={disputing}
        days={days}
        onClose={() => setDisputing(null)}
      />
    </Panel>
  )
}
