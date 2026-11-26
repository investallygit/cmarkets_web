import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDecideRfqCase } from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

const REASON_MAX_LENGTH = 500

/** What the Admin decides: a case neutralised (its open dispute upheld), or a dispute turned down. */
export type CaseDecision =
  | { kind: 'neutralize'; caseId: string; number: string }
  | { kind: 'reject'; disputeId: string; number: string }

/**
 * The Admin's decision on a completion case (screen 22, sixth version; ROADMAP decision 54): a
 * failure neutralised, on a dispute or for an incident it confirms, or a dispute turned down; with
 * a reason, traced in AUDT, the participant notified.
 */
export function DecideCaseDialog({
  decision,
  onClose,
}: {
  decision: CaseDecision | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={decision !== null}
      onClose={onClose}
      title={
        decision ? t(`rfqCompletion.admin.${decision.kind}Title`, { number: decision.number }) : ''
      }
    >
      {decision && <DecideForm decision={decision} onClose={onClose} />}
    </Dialog>
  )
}

function DecideForm({ decision, onClose }: { decision: CaseDecision; onClose: () => void }) {
  const { t } = useTranslation()
  const decide = useDecideRfqCase()
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const serverErrors = isApiError(decide.error, 400) ? decide.error.problem.errors : undefined
  const reasonError =
    (submitted && reason.trim() === '' ? t('rfqCompletion.admin.reasonRequired') : undefined) ??
    serverErrors?.reason?.[0]
  const otherError =
    decide.error && !isApiError(decide.error, 400) ? decide.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (reason.trim() === '') return
        const input = { reason: reason.trim() }
        decide.mutate(
          decision.kind === 'neutralize'
            ? { kind: 'neutralize', caseId: decision.caseId, input }
            : { kind: 'reject', disputeId: decision.disputeId, input },
          {
            onSuccess: () => {
              toast.success(
                t(`rfqCompletion.admin.${decision.kind}Done`, { number: decision.number }),
              )
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">
          {t(`rfqCompletion.admin.${decision.kind}Intro`)}
        </p>
        <Field label={t('rfqCompletion.admin.reason')} error={reasonError}>
          <Textarea value={reason} onChange={setReason} rows={3} maxLength={REASON_MAX_LENGTH} />
        </Field>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant={decision.kind === 'neutralize' ? 'primary' : 'danger'}
          busy={decide.isPending}
        >
          {t(`rfqCompletion.admin.${decision.kind}`)}
        </Button>
      </DialogFooter>
    </form>
  )
}
