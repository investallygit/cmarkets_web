import { useTranslation } from 'react-i18next'
import { useDeleteTransaction } from '@/entities/portfolio'
import type { TransactionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

interface DeleteTransactionDialogProps {
  portfolioId: string
  /** The transaction to delete; null keeps the dialog closed. */
  transaction: TransactionDto | null
  onClose: () => void
}

/** The server refuses when a later sale would then sell more than held (a 409). */
export function DeleteTransactionDialog({
  portfolioId,
  transaction,
  onClose,
}: DeleteTransactionDialogProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const remove = useDeleteTransaction(portfolioId)
  const type = transaction ? t(`portfolio.transactionTypes.${transaction.type}`) : ''

  return (
    <ConfirmDialog
      open={transaction !== null}
      onClose={onClose}
      title={t('portfolio.transactionForm.deleteTitle')}
      message={
        transaction &&
        t('portfolio.transactionForm.deleteMessage', {
          type,
          date: format.isoDate(transaction.date),
          security: transaction.securityCode ?? '',
          amount: format.signed(transaction.amount, 0),
        })
      }
      confirmLabel={t('portfolio.transactionForm.delete')}
      tone="danger"
      busy={remove.isPending}
      onConfirm={() => {
        if (!transaction) return
        remove.mutate(transaction.id, {
          onSuccess: () => {
            toast.info(t('portfolio.transactionForm.deleted', { type }))
            onClose()
          },
          onError: (error) =>
            toast.error(t('portfolio.transactionForm.deleteFailed', { message: error.message })),
        })
      }}
    />
  )
}
