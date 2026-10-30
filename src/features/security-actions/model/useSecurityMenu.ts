import { BellPlus, ExternalLink, ListPlus } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { openAlertDialog } from '@/entities/alert'
import { useHasPermission } from '@/entities/session'
import {
  openWatchlistDialog,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useWatchlists,
} from '@/entities/watchlist'
import type { WatchlistDto } from '@/shared/api/contracts'
import { securityPath } from '@/shared/routes/paths'
import type { MenuItem } from '@/shared/ui/menu'
import { toast } from '@/shared/ui/toast'

/** The security of a table row: its id for the API, its code for the messages. */
export interface MenuSecurity {
  id: string
  code: string
}

const NO_LISTS: WatchlistDto[] = []

/**
 * Right-click entries of a security row (spec section 9): open the profile, add to a list (a tick
 * marks the lists that hold it; choosing one of those removes it), create an alert. Tables add
 * "Export" themselves.
 */
export function useSecurityMenu(): (security: MenuSecurity) => MenuItem[] {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const canSetAlerts = useHasPermission('alerts:write')
  const lists = useWatchlists().data ?? NO_LISTS
  const { mutate: add } = useAddToWatchlist()
  const { mutate: remove } = useRemoveFromWatchlist()

  return useCallback(
    (security: MenuSecurity): MenuItem[] => {
      const failed = (error: Error) =>
        toast.error(t('watchlists.saveFailed', { message: error.message }))
      const listItems = lists.map((list): MenuItem => {
        const inList = list.items.some((item) => item.securityId === security.id)
        const change = { watchlistId: list.id, securityId: security.id }
        const names = { security: security.code, list: list.code }
        return {
          id: `list-${list.id}`,
          label: `${list.code} · ${list.name}`,
          checked: inList,
          onSelect: () =>
            inList
              ? remove(change, {
                  onSuccess: () => toast.info(t('watchlists.removed', names)),
                  onError: failed,
                })
              : add(change, {
                  onSuccess: () => toast.success(t('watchlists.added', names)),
                  onError: failed,
                }),
        }
      })
      return [
        {
          id: 'open',
          label: t('menu.openProfile'),
          icon: ExternalLink,
          onSelect: () => void navigate(securityPath(security.id)),
        },
        { id: 'add-to-list', kind: 'label', label: t('menu.addToList') },
        ...listItems,
        {
          id: 'new-list',
          label: t('menu.newList'),
          icon: ListPlus,
          onSelect: () => openWatchlistDialog({ mode: 'create', securities: [security] }),
        },
        { id: 'alert-separator', kind: 'separator', label: '' },
        {
          id: 'create-alert',
          label: t('menu.createAlert'),
          icon: BellPlus,
          disabled: !canSetAlerts,
          onSelect: () => openAlertDialog({ securityId: security.id }),
        },
      ]
    },
    [add, canSetAlerts, lists, navigate, remove, t],
  )
}
