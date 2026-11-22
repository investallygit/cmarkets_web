import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteCurve, useUpdateCurve } from '@/entities/bond'
import type { CurveSummaryDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

interface CurveActionsProps {
  curve: CurveSummaryDto
  /** The user may save curves (analysis:save): their own may be renamed, shared or deleted. */
  canWrite: boolean
  onDeleted: () => void
}

/**
 * A custom curve of block B: who shares it, and for its owner Rename (its name and whether the
 * organisation uses it) and Delete.
 */
export function CurveActions({ curve, canWrite, onDeleted }: CurveActionsProps) {
  const { t } = useTranslation()
  const update = useUpdateCurve()
  const remove = useDeleteCurve()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(curve.name)
  const [shared, setShared] = useState(curve.shared)
  const [confirming, setConfirming] = useState(false)

  if (!curve.mine) {
    return (
      <p className="font-sans text-title text-secondary">
        {t('bondPricing.curves.sharedBy', { owner: curve.owner ?? '—' })}
      </p>
    )
  }
  const rename = () => {
    if (name.trim() === '') return
    update.mutate(
      { id: curve.id, update: { name: name.trim(), shared } },
      {
        onSuccess: () => {
          toast.success(t('bondPricing.curves.renamed'))
          setEditing(false)
        },
      },
    )
  }

  if (editing) {
    return (
      <div
        role="group"
        aria-label={t('bondPricing.curves.rename')}
        className="grid gap-2 border bg-panel-header p-2"
        // Enter renames the curve, not the inputs' Calculate around it.
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return
          event.preventDefault()
          if (event.target.type === 'text') rename()
        }}
      >
        <Field
          label={t('bondPricing.curves.name')}
          error={name.trim() === '' ? t('bondPricing.curves.nameRequired') : update.error?.message}
        >
          <TextInput value={name} onChange={setName} maxLength={80} autoFocus />
        </Field>
        <Checkbox checked={shared} onChange={setShared} label={t('bondPricing.curves.share')} />
        <div className="flex gap-2">
          <Button
            variant="primary"
            busy={update.isPending}
            disabled={name.trim() === ''}
            onClick={rename}
          >
            {t('bondPricing.curves.saveButton')}
          </Button>
          <Button
            onClick={() => {
              update.reset()
              setEditing(false)
            }}
          >
            {t('bondPricing.curves.cancel')}
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-title text-secondary">
      <span>
        {curve.shared ? t('bondPricing.curves.sharedMine') : t('bondPricing.curves.private')}
      </span>
      {canWrite && (
        <>
          <button
            type="button"
            onClick={() => {
              setName(curve.name)
              setShared(curve.shared)
              setEditing(true)
            }}
            className="inline-flex min-h-6 items-center text-info hover:underline"
          >
            {t('bondPricing.curves.rename')}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-6 items-center text-down hover:underline"
          >
            {t('bondPricing.curves.delete')}
          </button>
        </>
      )}
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t('bondPricing.curves.deleteTitle', { name: curve.name })}
        message={t('bondPricing.curves.deleteMessage')}
        confirmLabel={t('bondPricing.curves.delete')}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() =>
          remove.mutate(curve.id, {
            onSuccess: () => {
              setConfirming(false)
              toast.success(t('bondPricing.curves.deleted', { name: curve.name }))
              onDeleted()
            },
          })
        }
      />
    </div>
  )
}
