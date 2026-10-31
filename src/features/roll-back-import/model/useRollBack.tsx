import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRollBackImport } from '@/entities/data-import'
import type { ImportDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

/**
 * Roll back a publication (spec section 11), with a reason: the values stored before the file come
 * back on every screen. Returns the function that asks, and the dialog to render.
 */
export function useRollBack() {
  const { t } = useTranslation()
  const rollBack = useRollBackImport()
  const [upload, setUpload] = useState<ImportDto | null>(null)

  const dialog = (
    <ConfirmDialog
      open={upload !== null}
      onClose={() => {
        rollBack.reset()
        setUpload(null)
      }}
      title={t('dataImport.rollBackTitle')}
      message={
        <>
          {t('dataImport.rollBackMessage', { file: upload?.fileName ?? '' })}
          {rollBack.error && (
            <span role="alert" className="mt-2 block text-down">
              {rollBack.error.message}
            </span>
          )}
        </>
      }
      confirmLabel={t('dataImport.rollBack')}
      tone="danger"
      requireReason
      busy={rollBack.isPending}
      onConfirm={(reason) => {
        if (upload) rollBack.mutate({ id: upload.id, reason }, { onSuccess: () => setUpload(null) })
      }}
    />
  )

  return { ask: (target: ImportDto) => setUpload(target), dialog }
}
