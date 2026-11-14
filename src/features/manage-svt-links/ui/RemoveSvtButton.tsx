import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRemoveSvt } from '@/entities/svt-link'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { toast } from '@/shared/ui/toast'

/**
 * Removes an SVT of "My SVTs" (DELETE /me/svt/{svtId}; screen 22: "the trader can also remove an
 * SVT"): its link in force, confirmed or still waiting, is withdrawn once confirmed here.
 */
export function RemoveSvtButton({ svtId, name }: { svtId: string; name: string }) {
  const { t } = useTranslation()
  const remove = useRemoveSvt()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('rfq.mySvts.remove', { name })}
        title={t('rfq.mySvts.remove', { name })}
        className="inline-flex size-6 shrink-0 items-center justify-center text-secondary hover:text-down"
      >
        <Trash2 size={14} aria-hidden />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('rfq.mySvts.removeTitle')}
        message={t('rfq.mySvts.removeConfirm', { name })}
        confirmLabel={t('rfq.mySvts.remove', { name })}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(svtId, {
            onSuccess: () => {
              toast.success(t('rfq.mySvts.removed', { name }))
              setOpen(false)
            },
          })
        }
      />
    </>
  )
}
