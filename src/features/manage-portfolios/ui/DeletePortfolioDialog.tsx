import { useTranslation } from 'react-i18next'
import { useDeletePortfolio } from '@/entities/portfolio'
import type { PortfolioSummaryDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

interface DeletePortfolioDialogProps {
  /** The portfolio to delete; null keeps the dialog closed. */
  portfolio: PortfolioSummaryDto | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeletePortfolioDialog({
  portfolio,
  onClose,
  onDeleted,
}: DeletePortfolioDialogProps) {
  const { t } = useTranslation()
  const remove = useDeletePortfolio()
  return (
    <ConfirmDialog
      open={portfolio !== null}
      onClose={onClose}
      title={t('portfolio.form.deleteTitle')}
      message={portfolio && t('portfolio.form.deleteMessage', { name: portfolio.name })}
      confirmLabel={t('portfolio.form.delete')}
      tone="danger"
      busy={remove.isPending}
      onConfirm={() => {
        if (!portfolio) return
        remove.mutate(portfolio.id, {
          onSuccess: () => {
            toast.info(t('portfolio.form.deleted', { name: portfolio.name }))
            onClose()
            onDeleted?.()
          },
          onError: (error) =>
            toast.error(t('portfolio.form.deleteFailed', { message: error.message })),
        })
      }}
    />
  )
}
