import { Ellipsis, ListPlus, Settings2, Trash2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteWatchlist, type WatchlistDialogRequest } from '@/entities/watchlist'
import type { WatchlistDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import type { MenuItem } from '@/shared/ui/menu'
import { toast } from '@/shared/ui/toast'
import { WatchlistDialog } from './WatchlistDialog'

const MENU_WIDTH = 216

interface WatchlistMenuProps {
  /** The list shown in the panel; undefined when the user has none. */
  list: WatchlistDto | undefined
  onCreated: (list: WatchlistDto) => void
}

/** "…" in the watchlist title bar: new list, name and columns, delete. */
export function WatchlistMenu({ list, onCreated }: WatchlistMenuProps) {
  const { t } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [dialog, setDialog] = useState<WatchlistDialogRequest | null>(null)
  const [deleting, setDeleting] = useState<WatchlistDto | null>(null)
  const remove = useDeleteWatchlist()
  const closeMenu = useCallback(() => setPosition(null), [])

  const items: MenuItem[] = [
    {
      id: 'new',
      label: t('watchlists.newList'),
      icon: ListPlus,
      onSelect: () => setDialog({ mode: 'create' }),
    },
    {
      id: 'edit',
      label: t('watchlists.settings'),
      icon: Settings2,
      disabled: !list,
      onSelect: () => list && setDialog({ mode: 'edit', watchlist: list }),
    },
    {
      id: 'delete',
      label: t('watchlists.delete'),
      icon: Trash2,
      disabled: !list,
      onSelect: () => list && setDeleting(list),
    },
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('watchlists.actions')}
        aria-haspopup="menu"
        aria-expanded={position !== null}
        onClick={(event) => {
          if (position) return closeMenu()
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ x: rect.right - MENU_WIDTH, y: rect.bottom + 4 })
        }}
        className="panel-no-drag inline-flex items-center text-secondary hover:text-primary"
      >
        <Ellipsis aria-hidden className="size-3.5" />
      </button>
      {position && (
        <ContextMenu
          x={position.x}
          y={position.y}
          items={items}
          onClose={closeMenu}
          ignoreRef={buttonRef}
        />
      )}
      <WatchlistDialog
        request={dialog}
        onClose={() => setDialog(null)}
        onSaved={(saved) => {
          if (dialog?.mode === 'create') onCreated(saved)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('watchlists.deleteTitle', { code: deleting?.code ?? '' })}
        message={t('watchlists.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('watchlists.delete')}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(
                t('watchlists.deleted', { list: `${deleting.code} · ${deleting.name}` }),
              )
              setDeleting(null)
            },
            onError: (error) => toast.error(t('watchlists.saveFailed', { message: error.message })),
          })
        }}
      />
    </>
  )
}
