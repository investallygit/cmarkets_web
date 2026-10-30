import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteScreen, useSavedScreens } from '@/entities/screener'
import type { SavedScreenDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

interface SavedScreensProps {
  /** The saved screen whose criteria are in the panel. */
  loadedId: string | null
  onLoad: (screen: SavedScreenDto) => void
}

/** "Saved screens: High yield · Banks" (screen 3 mockup): a click loads and runs one. */
export function SavedScreens({ loadedId, onLoad }: SavedScreensProps) {
  const { t } = useTranslation()
  const screens = useSavedScreens()
  const remove = useDeleteScreen()
  const [deleting, setDeleting] = useState<SavedScreenDto | null>(null)

  return (
    <div className="font-sans text-data text-secondary">
      <span>{t('screener.savedScreens')}</span>{' '}
      {screens.data?.length === 0 && <span>{t('screener.noSavedScreen')}</span>}
      {screens.data?.map((screen, index) => (
        <Fragment key={screen.id}>
          {index > 0 && <span aria-hidden> · </span>}
          <span className="group inline-flex items-center gap-0.5">
            <button
              type="button"
              aria-pressed={screen.id === loadedId}
              onClick={() => onLoad(screen)}
              className={clsx(
                'hover:underline',
                screen.id === loadedId ? 'text-accent-amber' : 'text-info',
              )}
            >
              {screen.name}
            </button>
            <button
              type="button"
              aria-label={t('screener.deleteScreen', { name: screen.name })}
              onClick={() => setDeleting(screen)}
              className="text-secondary opacity-0 group-hover:opacity-100 hover:text-down focus-visible:opacity-100"
            >
              <X aria-hidden className="size-3" />
            </button>
          </span>
        </Fragment>
      ))}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('screener.deleteTitle')}
        message={t('screener.deleteMessage', { name: deleting?.name ?? '' })}
        confirmLabel={t('screener.delete')}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('screener.deleted', { name: deleting.name }))
              setDeleting(null)
            },
            onError: (error) => toast.error(t('screener.deleteFailed', { message: error.message })),
          })
        }}
      />
    </div>
  )
}
