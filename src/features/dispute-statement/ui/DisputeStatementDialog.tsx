import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDisputeStatement } from '@/entities/news-statement'
import type { ProviderStatementDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

/**
 * The newspaper disputes its approved statement (spec, screen 18: "within 15 days, with a reason"):
 * MPAY shows it Disputed for the Admin to answer.
 */
export function DisputeStatementDialog({
  statement,
  days,
  onClose,
}: {
  statement: ProviderStatementDto | null
  days: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const dispute = useDisputeStatement()
  const [reason, setReason] = useState('')
  return (
    <Dialog
      open={statement !== null}
      onClose={onClose}
      title={t('mediaPayments.studio.disputeTitle', { reference: statement?.reference ?? '' })}
    >
      {statement && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            dispute.mutate(
              { id: statement.id, reason: reason.trim() },
              {
                onSuccess: () => {
                  setReason('')
                  toast.success(t('mediaPayments.studio.disputed'))
                  onClose()
                },
              },
            )
          }}
        >
          <p className="font-sans text-data text-secondary">
            {t('mediaPayments.studio.disputeHint', {
              days,
              until: statement.disputeUntil ? format.date(statement.disputeUntil) : '—',
            })}
          </p>
          <Field label={t('mediaPayments.studio.reason')}>
            <Textarea value={reason} onChange={setReason} maxLength={500} rows={4} highlight />
          </Field>
          {dispute.error && (
            <p role="alert" className="font-sans text-data text-down">
              {dispute.error.message}
            </p>
          )}
          <Button
            type="submit"
            variant="danger"
            disabled={reason.trim() === ''}
            busy={dispute.isPending}
          >
            {t('mediaPayments.studio.dispute')}
          </Button>
        </form>
      )}
    </Dialog>
  )
}
