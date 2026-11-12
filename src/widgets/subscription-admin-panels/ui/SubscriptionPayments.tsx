import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PAYMENT_LINE_COLORS,
  useAdminInvoicePdf,
  useSubscriptionPayments,
} from '@/entities/subscription'
import type { InvoiceRefDto, PlanPaymentMethod } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

interface SubscriptionPaymentsProps {
  accountId: string
  currency: string
  method: (method: PlanPaymentMethod | null) => string
}

/**
 * Screen 14, payments and invoices (GET /admin/subscriptions/{accountId}/payments): the history of
 * the plan, the latest first: date, invoice, amount, method, status ("Failed, then paid" in
 * yellow). Each invoice number opens its PDF (GET /admin/invoices/{id}/pdf).
 */
export function SubscriptionPayments({ accountId, currency, method }: SubscriptionPaymentsProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const payments = useSubscriptionPayments(accountId)
  const pdf = useAdminInvoicePdf()
  const [open, setOpen] = useState<{ invoice: InvoiceRefDto; file: Blob } | null>(null)
  const show = (invoice: InvoiceRefDto) =>
    pdf.mutate(invoice.id, {
      onSuccess: (file) => setOpen({ invoice, file }),
      onError: (error) => toast.error(error.message),
    })
  const cell = 'h-row whitespace-nowrap px-1.5 align-middle'

  return (
    <section aria-labelledby="subscription-payments" className="flex flex-col gap-1">
      <h3
        id="subscription-payments"
        className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('subscriptionAdmin.details.payments')}
      </h3>
      <QueryView query={payments}>
        {(lines) =>
          lines.length === 0 ? (
            <p className="font-sans text-data text-secondary">
              {t('subscriptionAdmin.details.noPayments')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-data">
                <thead className="bg-panel-header text-secondary">
                  <tr>
                    <th scope="col" className={`${cell} text-left font-normal`}>
                      {t('subscriptionAdmin.paymentColumns.date')}
                    </th>
                    <th scope="col" className={`${cell} text-left font-normal`}>
                      {t('subscriptionAdmin.paymentColumns.invoice')}
                    </th>
                    <th scope="col" className={`${cell} text-right font-normal`}>
                      {currency}
                    </th>
                    <th scope="col" className={`${cell} text-left font-normal`}>
                      {t('subscriptionAdmin.paymentColumns.method')}
                    </th>
                    <th scope="col" className={`${cell} text-left font-normal`}>
                      {t('subscriptionAdmin.paymentColumns.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={`${line.at}-${index}`} className="even:bg-row-alt">
                      <td className={`${cell} text-secondary`}>{format.date(line.at)}</td>
                      <td className={cell}>
                        {line.invoice ? (
                          <button
                            type="button"
                            onClick={() => line.invoice && show(line.invoice)}
                            disabled={pdf.isPending}
                            aria-label={t('subscriptionAdmin.details.openInvoice', {
                              number: line.invoice.number,
                            })}
                            className="min-h-6 text-info hover:underline"
                          >
                            {line.invoice.number}
                          </button>
                        ) : (
                          <span className="text-secondary">
                            {t('subscriptionAdmin.details.none')}
                          </span>
                        )}
                      </td>
                      <td className={`${cell} text-right`}>{format.number(line.amount, 0)}</td>
                      <td className={cell}>{method(line.method)}</td>
                      <td
                        className={`${cell} ${PAYMENT_LINE_COLORS[line.status]}`}
                        title={line.failureReason ?? undefined}
                      >
                        {t(`subscriptionAdmin.paymentStatuses.${line.status}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryView>
      <p className="font-sans text-data text-secondary">
        {t('subscriptionAdmin.details.opensPdf')}
      </p>
      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.invoice.number ?? ''}
        width={720}
      >
        {open && (
          <>
            <DialogBody>
              <div className="h-[60vh]">
                <PdfViewer file={open.file} title={open.invoice.number} />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => saveBlob(open.file, `${open.invoice.number}.pdf`)}>
                {t('subscriptionAdmin.details.download')}
              </Button>
              <Button variant="primary" onClick={() => setOpen(null)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </section>
  )
}
