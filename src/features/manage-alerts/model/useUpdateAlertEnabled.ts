import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdateAlert } from '@/entities/alert'
import type { AlertDto } from '@/shared/api/contracts'
import { toast } from '@/shared/ui/toast'

/** Turns an alert on or off (PUT /alerts/{id} with the rest unchanged). */
export function useUpdateAlertEnabled() {
  const { t } = useTranslation()
  const { mutate, isPending } = useUpdateAlert()
  const setEnabled = useCallback(
    (alert: AlertDto, enabled: boolean) =>
      mutate(
        { id: alert.id, condition: alert.condition, channels: alert.channels, enabled },
        { onError: (error) => toast.error(t('alerts.saveFailed', { message: error.message })) },
      ),
    [mutate, t],
  )
  return { setEnabled, isPending }
}
