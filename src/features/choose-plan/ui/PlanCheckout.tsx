import { useQueryClient } from '@tanstack/react-query'
import { CircleCheck, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sessionKeys } from '@/entities/session'
import { CHECKOUT_METHODS, useCheckout, useSubscriptionPayment } from '@/entities/subscription'
import { isApiError } from '@/shared/api'
import type {
  BillingCycle,
  CheckoutMethod,
  InvoiceDto,
  PaymentDto,
  PlanDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { amountsFromNet } from '@/shared/lib/billing'
import { isPhoneNumber } from '@/shared/lib/phone'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

interface PlanCheckoutProps {
  /** The plan chosen; null closes the dialog. */
  plan: PlanDto | null
  billingCycle: BillingCycle
  seats: number
  onClose: () => void
}

/**
 * Checkout of a plan (POST /subscription/checkout): card or mobile money, followed until the
 * provider confirms, the dialog closed or not; or a bank transfer against the invoice, the plan
 * applying at once. The screens of the new modules then open.
 */
export function PlanCheckout({ plan, billingCycle, seats, onClose }: PlanCheckoutProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [started, setStarted] = useState<PaymentDto | null>(null)
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null)
  const payment = useSubscriptionPayment(started).data ?? started
  const confirmed = payment?.status === 'confirmed'

  useEffect(() => {
    if (!confirmed) return
    void queryClient.invalidateQueries({ queryKey: sessionKeys.me })
    toast.success(t('subscription.checkout.confirmed'))
  }, [confirmed, queryClient, t])

  const close = () => {
    // A payment still pending goes on being followed; anything else starts again next time.
    if (payment?.status !== 'pending') setStarted(null)
    setInvoice(null)
    onClose()
  }

  return (
    <Dialog
      open={plan !== null}
      onClose={close}
      title={plan ? t('subscription.checkout.title', { plan: plan.name }) : ''}
      width={460}
    >
      {plan &&
        (invoice ? (
          <TransferInvoice invoice={invoice} onClose={close} />
        ) : payment && payment.status !== 'failed' ? (
          <PaymentStatus payment={payment} onClose={close} />
        ) : (
          <CheckoutForm
            plan={plan}
            billingCycle={billingCycle}
            seats={seats}
            failed={payment}
            onClose={close}
            onPayment={setStarted}
            onInvoice={(issued) => {
              setInvoice(issued)
              void queryClient.invalidateQueries({ queryKey: sessionKeys.me })
            }}
          />
        ))}
    </Dialog>
  )
}

interface CheckoutFormProps {
  plan: PlanDto
  billingCycle: BillingCycle
  seats: number
  /** The last payment, declined. */
  failed: PaymentDto | null
  onClose: () => void
  onPayment: (payment: PaymentDto) => void
  onInvoice: (invoice: InvoiceDto) => void
}

function CheckoutForm({
  plan,
  billingCycle,
  seats,
  failed,
  onClose,
  onPayment,
  onInvoice,
}: CheckoutFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const checkout = useCheckout()
  const [method, setMethod] = useState<CheckoutMethod>('card')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const unitPrice = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
  const amounts = amountsFromNet(unitPrice, seats, plan.taxRatePct)
  const xaf = (value: number) => t('subscription.xaf', { amount: format.number(value, 0) })
  const phoneError =
    (submitted &&
      method === 'mobileMoney' &&
      !isPhoneNumber(phone) &&
      t('purchase.phoneInvalid')) ||
    (isApiError(checkout.error, 400) && checkout.error.problem.errors?.phone?.[0]) ||
    null
  const failure = checkout.error && !isApiError(checkout.error, 400) ? checkout.error.message : null

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (method === 'mobileMoney' && !isPhoneNumber(phone)) return
        checkout.mutate(
          {
            planId: plan.id,
            billingCycle,
            method,
            phone: method === 'mobileMoney' ? phone.trim() : null,
          },
          {
            onSuccess: (result) => {
              if (result.payment) onPayment(result.payment)
              else if (result.invoice) onInvoice(result.invoice)
            },
          },
        )
      }}
    >
      <DialogBody>
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 font-sans text-data">
          <dt className="text-secondary">
            {t('subscription.checkout.perUser', {
              count: seats,
              price: xaf(unitPrice),
              cycle: t(`subscription.cycles.${billingCycle}`),
            })}
          </dt>
          <dd className="text-right font-mono">{xaf(amounts.amount)}</dd>
          <dt className="text-secondary">
            {t('subscription.checkout.vat', { rate: format.number(plan.taxRatePct, 2) })}
          </dt>
          <dd className="text-right font-mono">{xaf(amounts.taxAmount)}</dd>
          <dt className="font-semibold">{t('subscription.checkout.total')}</dt>
          <dd className="text-right font-mono font-semibold text-accent-amber">
            {xaf(amounts.total)}
          </dd>
        </dl>
        <Field label={t('purchase.payment')} group>
          <SegmentedControl
            value={method}
            options={CHECKOUT_METHODS.map((value) => ({
              value,
              label: t(`subscription.methods.${value}`),
            }))}
            onChange={(value) => {
              checkout.reset()
              setMethod(value)
            }}
          />
        </Field>
        {method === 'mobileMoney' && (
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
        )}
        <p className="font-sans text-data text-secondary">
          {t(`subscription.checkout.hints.${method}`)}
        </p>
        {failed?.status === 'failed' && (
          <p role="alert" className="flex items-start gap-1.5 font-sans text-label text-down">
            <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {failed.failureReason ?? t('purchase.failed')}
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
        <Button type="submit" variant="primary" busy={checkout.isPending}>
          {method === 'transfer'
            ? t('subscription.checkout.getInvoice')
            : t('subscription.checkout.pay', { amount: xaf(amounts.total) })}
        </Button>
      </DialogFooter>
    </form>
  )
}

function PaymentStatus({ payment, onClose }: { payment: PaymentDto; onClose: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const confirmed = payment.status === 'confirmed'
  const Icon = confirmed ? CircleCheck : LoaderCircle
  const amount = t('subscription.xaf', { amount: format.number(payment.amount, 0) })
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
            ? t('subscription.checkout.confirmed')
            : payment.method === 'mobileMoney'
              ? t('subscription.checkout.approveOnPhone', { amount })
              : t('subscription.checkout.confirmingCard', { amount })}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>
          {confirmed ? t('common.close') : t('subscription.checkout.closeAndWait')}
        </Button>
      </DialogFooter>
    </>
  )
}

function TransferInvoice({ invoice, onClose }: { invoice: InvoiceDto; onClose: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const rows: [string, string][] = [
    [t('invoices.number'), invoice.number],
    [
      t('subscription.checkout.total'),
      t('subscription.xaf', { amount: format.number(invoice.total, 0) }),
    ],
    [t('invoices.dueOn'), invoice.dueOn ? format.isoDate(invoice.dueOn) : ''],
    ...(invoice.transfer
      ? ([
          [t('invoices.bank'), invoice.transfer.bank],
          ['IBAN', invoice.transfer.iban],
          ['BIC', invoice.transfer.bic],
          [t('invoices.reference'), invoice.transfer.reference],
        ] as [string, string][])
      : []),
  ]
  return (
    <>
      <DialogBody>
        <p role="status" className="flex items-start gap-2 font-sans text-label">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-up" />
          {t('subscription.checkout.transferIssued')}
        </p>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 font-sans text-data">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-secondary">{label}</dt>
              <dd className="font-mono break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogFooter>
    </>
  )
}
