import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS, usePayment } from '@/entities/publication'
import type { LibraryPublicationDto, PaymentDto, PaymentMethod } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { toast } from '@/shared/ui/toast'
import { PaymentDialog } from './PaymentDialog'

/**
 * Under the locked contents of a paid publication (screen 8): the price, the student price for a
 * Student, mobile money or card, and the buy button. The payment is followed here, the dialog
 * closed or not: once confirmed, the full content replaces the preview. Accounts that only read
 * free research see why.
 */
export function BuyPublication({ publication }: { publication: LibraryPublicationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const [method, setMethod] = useState<PaymentMethod>('mobileMoney')
  const [paying, setPaying] = useState(false)
  const [started, setStarted] = useState<PaymentDto | null>(null)
  const payment = usePayment(started).data ?? started
  const confirmed = payment?.status === 'confirmed'
  useEffect(() => {
    if (confirmed) toast.success(t('purchase.confirmed', { title: publication.title }))
  }, [confirmed, publication.title, t])
  const amount = publication.priceToPay
  if (amount === null) return null
  const studentPrice = publication.price !== null && amount < publication.price

  return (
    <section className="flex flex-col gap-3 border-t pt-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-end gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-sans text-data text-secondary">{t('purchase.price')}</span>
          <span className="font-mono text-figure font-semibold text-accent-amber">
            {t('publication.priceXaf', { price: format.number(amount, 0) })}
          </span>
          {studentPrice && publication.price !== null && (
            <span className="font-sans text-data text-secondary">
              {t('purchase.studentPrice', { price: format.number(publication.price, 0) })}
            </span>
          )}
        </div>
        {publication.canBuy && (
          <div className="flex flex-col gap-1">
            <span className="font-sans text-data text-secondary">{t('purchase.payment')}</span>
            <SegmentedControl
              value={method}
              options={PAYMENT_METHODS.map((value) => ({
                value,
                label: t(`purchase.methods.${value}`),
              }))}
              onChange={setMethod}
              aria-label={t('purchase.payment')}
            />
          </div>
        )}
      </div>
      {publication.canBuy ? (
        <Button
          variant="primary"
          size="lg"
          onClick={() => setPaying(true)}
          className="w-full uppercase"
        >
          {t('purchase.buy', { price: format.number(amount, 0) })}
        </Button>
      ) : (
        <p className="font-sans text-label text-secondary">{t('purchase.clientsOnly')}</p>
      )}
      <PaymentDialog
        open={paying}
        onClose={() => setPaying(false)}
        publication={publication}
        method={payment?.method ?? method}
        amount={payment?.amount ?? amount}
        payment={payment}
        onStarted={setStarted}
      />
    </section>
  )
}
