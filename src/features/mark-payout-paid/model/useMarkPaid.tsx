import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMarkPayoutPaid } from '@/entities/payout'
import type { AdminPayoutDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

/**
 * "Mark paid", with a confirmation: the analyst's net for the month was transferred. Returns the
 * function that asks, and the dialog to render.
 */
export function useMarkPaid() {
  const { t } = useTranslation()
  const format = useFormat()
  const markPaid = useMarkPayoutPaid()
  const [payout, setPayout] = useState<AdminPayoutDto | null>(null)
  const amount = payout ? t('subscription.xaf', { amount: format.number(payout.net, 0) }) : ''
  const month = payout ? format.month(payout.month) : ''

  const dialog = (
    <ConfirmDialog
      open={payout !== null}
      onClose={() => {
        markPaid.reset()
        setPayout(null)
      }}
      title={t('payouts.markPaidTitle')}
      message={
        <>
          {t('payouts.markPaidMessage', {
            amount,
            name: payout?.analyst.displayName ?? '',
            month,
          })}
          {markPaid.error && (
            <span role="alert" className="mt-2 block text-down">
              {markPaid.error.message}
            </span>
          )}
        </>
      }
      confirmLabel={t('payouts.markPaid')}
      busy={markPaid.isPending}
      onConfirm={() => {
        if (!payout) return
        markPaid.mutate(payout.id, {
          onSuccess: () => {
            toast.success(t('payouts.paidDone', { name: payout.analyst.displayName, month }))
            setPayout(null)
          },
        })
      }}
    />
  )

  const ask = useCallback((target: AdminPayoutDto) => setPayout(target), [])
  return { ask, dialog }
}
