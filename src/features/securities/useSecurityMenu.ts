import { BellPlus, ExternalLink, ListPlus } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { securityPath } from '@/shared/navigation/paths'
import type { MenuItem } from '@/shared/ui/menu'

/** Right-click entries of a security row (spec section 9); tables add "Export" themselves. */
export function useSecurityMenu(): (securityId: string) => MenuItem[] {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return useCallback(
    (securityId: string) => [
      {
        id: 'open',
        label: t('menu.openProfile'),
        icon: ExternalLink,
        onSelect: () => void navigate(securityPath(securityId)),
      },
      // Enabled with the watchlist editor and the ALRT screen.
      { id: 'add-to-list', label: t('menu.addToList'), icon: ListPlus, disabled: true },
      { id: 'create-alert', label: t('menu.createAlert'), icon: BellPlus, disabled: true },
    ],
    [navigate, t],
  )
}
