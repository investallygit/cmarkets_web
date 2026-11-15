import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { COMMENT_MAX_LENGTH, REJECTION_REASONS, useRejectAgreement } from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type { RfqRejectionReason } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

interface RejectDialogProps {
  /** The agreement rejected; null: closed. */
  agreementId: string | null
  number: string
  onClose: () => void
}

/**
 * A rejection with its reason (spec, screen 27: "client limit exceeded, securities not available,
 * funds not available, unknown client or blocked account, off-market price, other (text
 * required)"), passed to both traders; the agreement is cancelled.
 */
export function RejectDialog({ agreementId, number, onClose }: RejectDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={agreementId !== null}
      onClose={onClose}
      title={t('svt.decide.rejectTitle', { number })}
      width={460}
    >
      {agreementId && <RejectForm agreementId={agreementId} number={number} onClose={onClose} />}
    </Dialog>
  )
}

/** Mounted with each opening: the first reason offered, no comment. */
function RejectForm({
  agreementId,
  number,
  onClose,
}: {
  agreementId: string
  number: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const reject = useRejectAgreement()
  const [reason, setReason] = useState<RfqRejectionReason>(REJECTION_REASONS[0])
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const missing = reason === 'other' && comment.trim().length === 0
  const server = isApiError(reject.error, 400) ? (reject.error.problem.errors ?? {}) : {}
  const commentError =
    (submitted && missing ? t('svt.decide.commentRequired') : undefined) ?? server.comment?.[0]
  const otherError =
    reject.error && !isApiError(reject.error, 400) ? reject.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (missing) return
        reject.mutate(
          { agreementId, input: { reasonCode: reason, comment: comment.trim() || null } },
          {
            onSuccess: () => {
              toast.success(t('svt.decide.rejected', { number }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">{t('svt.decide.rejectIntro')}</p>
        <Field label={t('svt.decide.reason')} error={server.reasonCode?.[0]}>
          <Select
            value={reason}
            onChange={setReason}
            options={REJECTION_REASONS.map((value) => ({
              value,
              label: t(`svt.reasons.${value}`),
            }))}
          />
        </Field>
        <Field
          label={t('svt.decide.comment')}
          hint={t('svt.decide.commentHint')}
          error={commentError}
        >
          <Textarea value={comment} onChange={setComment} rows={3} maxLength={COMMENT_MAX_LENGTH} />
        </Field>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('svt.decide.cancel')}
        </Button>
        <Button type="submit" variant="danger" busy={reject.isPending}>
          {t('svt.decide.confirmReject')}
        </Button>
      </DialogFooter>
    </form>
  )
}
