import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePurchase } from '@/entities/publication'
import { isApiError } from '@/shared/api'
import type { LibraryPublicationDto, PaymentDto, PaymentMethod } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { isPhoneNumber } from '../lib/phone'

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  publication: LibraryPublicationDto
  method: PaymentMethod
  amount: number
  /** The payment started, as last asked; followed even once the dialog is closed. */
  payment: PaymentDto | null
  onStarted: (payment: PaymentDto) => void
}

/**
 * Payment of a publication (spec section 10): POST /library/{id}/purchase creates the payment,
 * then the operator or the card network confirms it.
 */
export function PaymentDialog({ open, onClose, ...payment }: PaymentDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t(`purchase.titles.${payment.method}`)}>
      <PaymentSteps {...payment} onClose={onClose} />
    </Dialog>
  )
}

function PaymentSteps({
  publication,
  method,
  amount,
  payment,
  onStarted,
  onClose,
}: Omit<PaymentDialogProps, 'open'>) {
  const { t } = useTranslation()
  const format = useFormat()
  const purchase = usePurchase(publication.id)
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const price = t('purchase.amount', { price: format.number(amount, 0) })

  const phoneError =
    (submitted &&
      method === 'mobileMoney' &&
      !isPhoneNumber(phone) &&
      t('purchase.phoneInvalid')) ||
    (isApiError(purchase.error, 400) && purchase.error.problem.errors?.phone?.[0]) ||
    null
  const failure = purchase.error && !isApiError(purchase.error, 400) ? purchase.error.message : null

  if (payment?.status === 'pending' || payment?.status === 'confirmed') {
    const confirmed = payment.status === 'confirmed'
    const Icon = confirmed ? CircleCheck : LoaderCircle
    return (
      <>
        <DialogBody className="flex-row items-start gap-2">
          <Icon
            aria-hidden
            className={
              confirmed
                ? 'mt-0.5 size-4 shrink-0 text-up'
                : 'mt-0.5 size-4 shrink-0 animate-spin text-info'
            }
          />
          <p role="status" className="font-sans text-label">
            {confirmed
              ? t('purchase.confirmed', { title: publication.title })
              : payment.method === 'mobileMoney'
                ? t('purchase.approveOnPhone', { price })
                : t('purchase.confirmingCard', { price })}
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>{t('purchase.continueReading')}</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (method === 'mobileMoney' && !isPhoneNumber(phone)) return
        purchase.mutate(
          { method, phone: method === 'mobileMoney' ? phone.trim() : null },
          { onSuccess: onStarted },
        )
      }}
    >
      <DialogBody>
        <p className="font-sans text-label">
          {t('purchase.summary', { title: publication.title, price })}
        </p>
        {method === 'mobileMoney' ? (
          <Field label={t('purchase.phone')} hint={t('purchase.phoneHint')} error={phoneError}>
            <TextInput
              value={phone}
              onChange={setPhone}
              type="tel"
              autoComplete="tel"
              placeholder="+237 6 70 12 34 56"
              mono
            />
          </Field>
        ) : (
          <p className="font-sans text-data text-secondary">{t('purchase.cardHint')}</p>
        )}
        {payment?.status === 'failed' && (
          <p role="alert" className="flex items-start gap-1.5 font-sans text-label text-down">
            <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {payment.failureReason ?? t('purchase.failed')}
          </p>
        )}
        {failure && (
          <p role="alert" className="font-sans text-label text-down">
            {failure}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={purchase.isPending}>
          {payment?.status === 'failed' ? t('purchase.retry') : t('purchase.pay', { price })}
        </Button>
      </DialogFooter>
    </form>
  )
}
