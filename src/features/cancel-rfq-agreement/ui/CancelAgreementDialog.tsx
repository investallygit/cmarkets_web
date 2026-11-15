import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCancelRfqAgreement } from '@/entities/rfq-agreement'
import { isApiError } from '@/shared/api'
import type { RfqAgreementDetailsDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { FileDrop } from '@/shared/ui/form/FileDrop'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

/** A sign-up document's types and size (CMarket.Api's RfqLetter). */
const LETTER_TYPES = '.pdf,.jpg,.jpeg,.png'
const LETTER_MAX_SIZE = 10 * 1024 * 1024
const REASON_MAX_LENGTH = 500

interface CancelAgreementDialogProps {
  /** The agreement to cancel, a concluded one; null closes the dialog. */
  details: RfqAgreementDetailsDto | null
  onClose: () => void
}

/**
 * "Cancel agreement (reason)" (spec, screen 23: "only on written request from both parties,
 * entered with a reason; a cancellation e-mail goes to the four recipients"): the reason and both
 * parties' letters, sent by a party's Trader or Manager or by the Admin (ROADMAP decision 26).
 */
export function CancelAgreementDialog({ details, onClose }: CancelAgreementDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={details !== null}
      onClose={onClose}
      title={t('rfqAgreements.cancel.title', { number: details?.agreement.number ?? '' })}
      width={480}
    >
      {details && <CancelForm details={details} onClose={onClose} />}
    </Dialog>
  )
}

/** Mounted with each opening: an empty form. */
function CancelForm({
  details,
  onClose,
}: {
  details: RfqAgreementDetailsDto
  onClose: () => void
}) {
  const { t } = useTranslation()
  const cancel = useCancelRfqAgreement()
  const [reason, setReason] = useState('')
  const [requesterLetter, setRequesterLetter] = useState<File | null>(null)
  const [responderLetter, setResponderLetter] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const { agreement, request } = details
  // The requester is the buyer of a purchase, the seller of a sale.
  const [requester, responder] =
    request.side === 'buy'
      ? [agreement.buyer, agreement.seller]
      : [agreement.seller, agreement.buyer]
  const serverErrors = isApiError(cancel.error, 400) ? cancel.error.problem.errors : undefined
  const reasonError =
    (submitted && reason.trim() === '' ? t('rfqAgreements.cancel.reasonRequired') : undefined) ??
    serverErrors?.reason?.[0]
  const letterError = (file: File | null, key: 'requesterLetter' | 'responderLetter') =>
    (submitted && file === null ? t('rfqAgreements.cancel.letterRequired') : undefined) ??
    serverErrors?.[key]?.[0]
  const otherError =
    cancel.error && !isApiError(cancel.error, 400) ? cancel.error.message : undefined

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (reason.trim() === '' || !requesterLetter || !responderLetter) return
        cancel.mutate(
          { id: agreement.id, input: { reason: reason.trim(), requesterLetter, responderLetter } },
          {
            onSuccess: () => {
              toast.success(t('rfqAgreements.cancel.done', { number: agreement.number }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">{t('rfqAgreements.cancel.intro')}</p>
        <Field label={t('rfqAgreements.cancel.reason')} error={reasonError}>
          <Textarea value={reason} onChange={setReason} rows={3} maxLength={REASON_MAX_LENGTH} />
        </Field>
        <Field
          label={t('rfqAgreements.cancel.requesterLetter', {
            organization: requester.organization,
          })}
          hint={t('rfqAgreements.cancel.letterHint')}
          error={letterError(requesterLetter, 'requesterLetter')}
        >
          <FileDrop
            file={requesterLetter}
            onChange={setRequesterLetter}
            accept={LETTER_TYPES}
            maxSize={LETTER_MAX_SIZE}
          />
        </Field>
        <Field
          label={t('rfqAgreements.cancel.responderLetter', {
            organization: responder.organization,
          })}
          hint={t('rfqAgreements.cancel.letterHint')}
          error={letterError(responderLetter, 'responderLetter')}
        >
          <FileDrop
            file={responderLetter}
            onChange={setResponderLetter}
            accept={LETTER_TYPES}
            maxSize={LETTER_MAX_SIZE}
          />
        </Field>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('rfqAgreements.cancel.keep')}
        </Button>
        <Button type="submit" variant="danger" busy={cancel.isPending}>
          {t('rfqAgreements.cancel.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
