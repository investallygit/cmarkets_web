import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SecurityPicker } from '@/entities/security'
import { useAddToWatchlist } from '@/entities/watchlist'
import type { WatchlistDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface AddToWatchlistBoxProps {
  list: WatchlistDto
  onClose: () => void
}

/** "+ Add" of the watchlist panel: securities are added one after another until closed. */
export function AddToWatchlistBox({ list, onClose }: AddToWatchlistBoxProps) {
  const { t } = useTranslation()
  const add = useAddToWatchlist()
  const inList = useMemo(() => new Set(list.items.map((item) => item.securityId)), [list.items])

  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b px-2">
      <SecurityPicker
        autoFocus
        exclude={inList}
        placeholder={t('watchlists.addPlaceholder')}
        aria-label={t('watchlists.addTo', { code: list.code })}
        onEscape={onClose}
        onSelect={(security) =>
          add.mutate(
            { watchlistId: list.id, securityId: security.id },
            {
              onError: (error) =>
                toast.error(t('watchlists.saveFailed', { message: error.message })),
            },
          )
        }
        className="w-64 min-w-0"
      />
      <Button variant="link" onClick={onClose}>
        {t('common.done')}
      </Button>
    </div>
  )
}
