import { useTranslation } from 'react-i18next'
import type { AlertDto } from '@/shared/api/contracts'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { useUpdateAlertEnabled } from '../model/useUpdateAlertEnabled'

/** The on / off box of an alert row. */
export function AlertToggle({ alert, label }: { alert: AlertDto; label: string }) {
  const { t } = useTranslation()
  const { setEnabled, isPending } = useUpdateAlertEnabled()
  return (
    <Checkbox
      checked={alert.enabled}
      disabled={isPending}
      onChange={(enabled) => setEnabled(alert, enabled)}
      aria-label={t('alerts.toggleLabel', { alert: label })}
    />
  )
}
