import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { recipientLabelKey, recipientName, useResendRfqTicket } from '@/entities/rfq-agreement'
import type { AgreementRecipient, RfqAgreementDetailsDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'

interface ResendTicketDialogProps {
  /** The concluded agreement whose ticket goes again; null closes the dialog. */
  details: RfqAgreementDetailsDto | null
  onClose: () => void
}

/**
 * "Resend ticket" (spec, screen 23: "Failed delivery: alert to the trader and the Admin; the ticket
 * can be resent, always as the same document"): to every recipient or to one, by a party's Trader
 * or Manager or by the Admin (ROADMAP decision 26). Each send is logged; a failed one is said.
 */
export function ResendTicketDialog({ details, onClose }: ResendTicketDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={details !== null}
      onClose={onClose}
      title={t('rfqAgreements.resend.title', { number: details?.agreement.number ?? '' })}
      width={440}
    >
      {details && <ResendForm details={details} onClose={onClose} />}
    </Dialog>
  )
}

/** Mounted with each opening: every recipient chosen. */
function ResendForm({
  details,
  onClose,
}: {
  details: RfqAgreementDetailsDto
  onClose: () => void
}) {
  const { t } = useTranslation()
  const resend = useResendRfqTicket()
  const [to, setTo] = useState<AgreementRecipient | 'all'>('all')
  const { agreement, recipients } = details
  const label = (kind: AgreementRecipient) => {
    const recipient = recipients.find((candidate) => candidate.kind === kind)
    return t(recipientLabelKey(kind, agreement), {
      name: recipient ? recipientName(recipient, agreement) : '',
    })
  }
  const options = [
    { value: 'all' as const, label: t('rfqAgreements.resend.all', { count: recipients.length }) },
    ...recipients.map((recipient) => ({ value: recipient.kind, label: label(recipient.kind) })),
  ]

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        resend.mutate(
          { id: agreement.id, recipient: to === 'all' ? null : to },
          {
            onSuccess: ({ sends }) => {
              const failed = sends.filter((send) => send.status === 'failed')
              if (failed.length > 0)
                toast.error(
                  t('rfqAgreements.resend.failed', {
                    number: agreement.number,
                    names: failed.map((send) => label(send.recipient)).join(', '),
                  }),
                )
              else
                toast.success(
                  t('rfqAgreements.resend.done', {
                    number: agreement.number,
                    count: sends.length,
                    name: sends.length === 1 ? label(sends[0].recipient) : '',
                  }),
                )
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">{t('rfqAgreements.resend.intro')}</p>
        <Field label={t('rfqAgreements.resend.to')}>
          <Select value={to} options={options} onChange={setTo} />
        </Field>
        {resend.error && (
          <p role="alert" className="font-sans text-data text-down">
            {resend.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('rfqAgreements.resend.close')}
        </Button>
        <Button type="submit" variant="primary" busy={resend.isPending}>
          {t('rfqAgreements.resend.submit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
