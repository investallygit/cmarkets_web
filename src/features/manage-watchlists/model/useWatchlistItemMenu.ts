import { ListX } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRemoveFromWatchlist } from '@/entities/watchlist'
import type { WatchlistDto, WatchlistItemDto } from '@/shared/api/contracts'
import type { MenuItem } from '@/shared/ui/menu'
import { toast } from '@/shared/ui/toast'

/** Right-click entries of a row of the watchlist panel, after those of any security. */
export function useWatchlistItemMenu(
  list: WatchlistDto | undefined,
): (item: WatchlistItemDto) => MenuItem[] {
  const { t } = useTranslation()
  const { mutate } = useRemoveFromWatchlist()
  return useCallback(
    (item: WatchlistItemDto): MenuItem[] =>
      list
        ? [
            { id: 'list-separator', kind: 'separator', label: '' },
            {
              id: 'remove-from-list',
              label: t('watchlists.removeFrom', { code: list.code }),
              icon: ListX,
              onSelect: () =>
                mutate(
                  { watchlistId: list.id, securityId: item.securityId },
                  {
                    onSuccess: () =>
                      toast.info(t('watchlists.removed', { security: item.code, list: list.code })),
                    onError: (error) =>
                      toast.error(t('watchlists.saveFailed', { message: error.message })),
                  },
                ),
            },
          ]
        : [],
    [list, mutate, t],
  )
}
