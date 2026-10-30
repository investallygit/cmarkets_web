import { useTranslation } from 'react-i18next'
import { useDeleteAlert } from '@/entities/alert'
import type { AlertDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

interface DeleteAlertDialogProps {
  alert: AlertDto | null
  /** The alert in words, e.g. "SEMC · Price above 52,700". */
  label: string
  onClose: () => void
}

export function DeleteAlertDialog({ alert, label, onClose }: DeleteAlertDialogProps) {
  const { t } = useTranslation()
  const remove = useDeleteAlert()
  return (
    <ConfirmDialog
      open={alert !== null}
      onClose={onClose}
      title={t('alerts.deleteTitle')}
      message={t('alerts.deleteMessage', { alert: label })}
      confirmLabel={t('alerts.delete')}
      tone="danger"
      busy={remove.isPending}
      onConfirm={() => {
        if (!alert) return
        remove.mutate(alert.id, {
          onSuccess: () => {
            toast.success(t('alerts.deleted'))
            onClose()
          },
          onError: (error) => toast.error(t('alerts.saveFailed', { message: error.message })),
        })
      }}
    />
  )
}
