import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useResolveStatementDispute } from '@/entities/news-statement'
import type {
  DisputeResolution as Resolution,
  NewsStatementDto,
  StatementDisputeDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

/**
 * The newspaper's dispute and the Admin's answer (spec, screen 18, "Disputed"): the amount
 * maintained (approved again), or the statement corrected (computed again, to approve); the
 * newspaper is told.
 */
export function DisputeResolution({
  statement,
  dispute,
}: {
  statement: NewsStatementDto
  dispute: StatementDisputeDto
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const resolve = useResolveStatementDispute()
  const [answer, setAnswer] = useState('')
  const send = (resolution: Resolution) =>
    resolve.mutate(
      {
        id: statement.id,
        disputeId: dispute.id,
        resolution: { resolution, reason: answer.trim() },
      },
      {
        onSuccess: () => {
          setAnswer('')
          toast.success(t('mediaPayments.statement.resolved'))
        },
      },
    )
  return (
    <div className="flex flex-col gap-2 border border-down/50 bg-down/10 p-2 font-sans text-data">
      <p className="font-semibold text-down">
        {t('mediaPayments.statement.dispute', {
          name: dispute.openedBy?.displayName ?? '—',
          date: format.date(dispute.openedAt),
        })}
      </p>
      <p className="text-primary">{dispute.reason}</p>
      <Field label={t('mediaPayments.statement.answer')}>
        <TextInput value={answer} onChange={setAnswer} maxLength={500} />
      </Field>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={answer.trim() === ''}
          busy={resolve.isPending}
          onClick={() => send('maintain')}
        >
          {t('mediaPayments.statement.maintain')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={answer.trim() === ''}
          busy={resolve.isPending}
          onClick={() => send('correct')}
        >
          {t('mediaPayments.statement.correct')}
        </Button>
      </div>
      {resolve.error && (
        <p role="alert" className="text-down">
          {resolve.error.message}
        </p>
      )}
    </div>
  )
}
