import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useExtendSubscription } from '@/entities/subscription'
import type { AdminSubscriptionDetailsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'

interface ExtendSubscriptionDialogProps {
  subscription: AdminSubscriptionDetailsDto
  open: boolean
  onClose: () => void
}

/** POST /admin/subscriptions/{accountId}/extend: to a later day, free of charge, with a reason. */
export function ExtendSubscriptionDialog({
  subscription,
  open,
  onClose,
}: ExtendSubscriptionDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('subscriptionAdmin.actions.extendTitle', { name: subscription.payer.name })}
      width={420}
    >
      <ExtendForm subscription={subscription} onClose={onClose} />
    </Dialog>
  )
}

/** Mounted with each opening, so the day and the reason start empty. */
function ExtendForm({ subscription, onClose }: Omit<ExtendSubscriptionDialogProps, 'open'>) {
  const { t } = useTranslation()
  const format = useFormat()
  const extend = useExtendSubscription()
  const [until, setUntil] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const ready = until !== null && reason.trim() !== ''
  const name = subscription.payer.name

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready || !until) return
        extend.mutate(
          { accountId: subscription.payer.id, extension: { until, reason: reason.trim() } },
          {
            onSuccess: (extended) => {
              toast.success(
                t('subscriptionAdmin.actions.extended', {
                  name,
                  date: format.isoDate(extended.expiresOn),
                }),
              )
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label">
          {t('subscriptionAdmin.actions.extendMessage', {
            date: format.isoDate(subscription.expiresOn),
          })}
        </p>
        <Field label={t('subscriptionAdmin.actions.until')}>
          <DateInput value={until} onChange={setUntil} highlight required />
        </Field>
        <Field label={t('subscriptionAdmin.actions.reason')} hint={t('form.reasonRequired')}>
          <Textarea value={reason} onChange={setReason} rows={3} required />
        </Field>
        {extend.error && (
          <p role="alert" className="font-sans text-data text-down">
            {extend.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!ready} busy={extend.isPending}>
          {t('subscriptionAdmin.actions.extend')}
        </Button>
      </DialogFooter>
    </form>
  )
}
