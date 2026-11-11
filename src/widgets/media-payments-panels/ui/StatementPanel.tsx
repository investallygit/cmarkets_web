import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  usePaymentTerms,
  useRecalculateStatement,
  useReleaseStatement,
  useStatement,
} from '@/entities/news-statement'
import {
  canRecalculate,
  StatementRequest,
  StatementStatusForm,
} from '@/features/change-statement-status'
import { PaymentTermsForm } from '@/features/edit-payment-terms'
import { DisputeResolution } from '@/features/resolve-statement-dispute'
import type { NewsStatementDto } from '@/shared/api/contracts'
import { adminApi } from '@/shared/api/endpoints'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'
import { StatementFigures } from './StatementFigures'
import { StatementHistory } from './StatementHistory'

/**
 * MPAY's right panel (the screen 18 mockup): the statement picked, its figures, its status with a
 * reason (the change a second Admin must confirm, the newspaper's dispute), its payment, the
 * newspaper's payment settings by month, the statement's PDF and history.
 */
export function StatementPanel({ id }: { id: string | null }) {
  const { t } = useTranslation()
  const statement = useStatement(id)
  return (
    <Panel
      title={
        statement.data
          ? t('mediaPayments.statement.title', { source: statement.data.source.shortName })
          : t('panels.mediaStatement')
      }
      code="MPAY"
    >
      {id === null ? (
        <p className="p-3 font-sans text-data text-secondary">
          {t('mediaPayments.statement.none')}
        </p>
      ) : (
        <QueryView query={statement}>
          {(current) => <StatementBody statement={current} />}
        </QueryView>
      )}
    </Panel>
  )
}

function StatementBody({ statement }: { statement: NewsStatementDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const terms = usePaymentTerms(statement.source.id)
  const release = useReleaseStatement()
  const recalculate = useRecalculateStatement()
  const payment = statement.payments.find((entry) => entry.cancelledAt === null)

  const pdf = () =>
    adminApi
      .statementPdf(statement.id)
      .then((blob) => saveBlob(blob, `${statement.reference}.pdf`))
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : String(error)),
      )

  return (
    <div className="flex flex-col gap-3 pb-3">
      <p className="flex justify-between px-3 pt-2 font-sans text-caption uppercase tracking-title text-secondary">
        <span>{format.month(statement.month)}</span>
        <span className="font-mono">{statement.reference}</span>
      </p>
      <StatementFigures statement={statement} />
      {statement.approvedAt && (
        <p className="px-3 font-sans text-caption text-secondary">
          {t('mediaPayments.statement.approved', {
            date: format.date(statement.approvedAt),
            name: statement.approvedBy?.displayName ?? '—',
            until: statement.disputeUntil ? format.date(statement.disputeUntil) : '—',
          })}
        </p>
      )}
      {payment && (
        <p className="px-3 font-sans text-data text-up">
          {t('mediaPayments.statement.payment')}:{' '}
          {t('mediaPayments.statement.paymentLine', {
            date: format.isoDate(payment.paidOn),
            method: t(`mediaPayments.statement.methods.${payment.method}`),
            reference: payment.reference,
          })}
        </p>
      )}
      <Section title={t('mediaPayments.statement.statusTitle')}>
        {statement.pendingRequest && (
          <StatementRequest statement={statement} request={statement.pendingRequest} />
        )}
        {statement.status === 'disputed' && statement.openDispute && (
          <DisputeResolution statement={statement} dispute={statement.openDispute} />
        )}
        <StatementStatusForm statement={statement} />
        <div className="flex flex-wrap gap-2">
          {statement.status === 'onHold' && (
            <Button
              size="sm"
              variant="secondary"
              busy={release.isPending}
              onClick={() =>
                release.mutate(
                  { id: statement.id, reason: null },
                  {
                    onSuccess: (updated) =>
                      toast.success(
                        t('mediaPayments.statement.released', {
                          status: t(`mediaPayments.statuses.${updated.status}`),
                        }),
                      ),
                  },
                )
              }
            >
              {t('mediaPayments.statement.release')}
            </Button>
          )}
          {canRecalculate(statement) && (
            <Button
              size="sm"
              variant="secondary"
              busy={recalculate.isPending}
              onClick={() =>
                recalculate.mutate(statement.id, {
                  onSuccess: () => toast.success(t('mediaPayments.statement.recalculated')),
                })
              }
            >
              {t('mediaPayments.statement.recalculate')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => void pdf()}>
            {t('mediaPayments.statement.pdf')}
          </Button>
        </div>
      </Section>
      <Section title={t('mediaPayments.terms.title', { source: statement.source.shortName })}>
        <QueryView query={terms}>
          {(current) => (
            <PaymentTermsForm
              key={`${current.sourceId}:${current.version?.id ?? ''}`}
              terms={current}
            />
          )}
        </QueryView>
      </Section>
      <Section title={t('mediaPayments.statement.history')}>
        <StatementHistory id={statement.id} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 px-3">
      <h3 className="font-sans text-caption font-semibold uppercase tracking-title text-accent-amber">
        {title}
      </h3>
      {children}
    </section>
  )
}
