import { Bell, BellOff, Pencil, Trash2 } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { openAlertDialog } from '@/entities/alert'
import type { AlertDto } from '@/shared/api/contracts'
import type { MenuItem } from '@/shared/ui/menu'
import { useUpdateAlertEnabled } from './useUpdateAlertEnabled'

/** Right-click entries of an alert row: edit, turn on or off, delete (after a confirmation). */
export function useAlertMenu(onDelete: (alert: AlertDto) => void): (alert: AlertDto) => MenuItem[] {
  const { t } = useTranslation()
  const { setEnabled } = useUpdateAlertEnabled()
  return useCallback(
    (alert: AlertDto): MenuItem[] => [
      {
        id: 'edit',
        label: t('alerts.edit'),
        icon: Pencil,
        onSelect: () => openAlertDialog({ alert }),
      },
      {
        id: 'toggle',
        label: alert.enabled ? t('alerts.turnOff') : t('alerts.turnOn'),
        icon: alert.enabled ? BellOff : Bell,
        onSelect: () => setEnabled(alert, !alert.enabled),
      },
      { id: 'delete', label: t('alerts.delete'), icon: Trash2, onSelect: () => onDelete(alert) },
    ],
    [onDelete, setEnabled, t],
  )
}
