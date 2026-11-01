import { Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NamedLayoutDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { sameLayoutName } from '../lib/arrangement'
import { SAVED_LAYOUTS_MAX } from '../model/useWorkspaceLayout'

const NAME_MAX = 40

interface SavedLayoutsDialogProps {
  open: boolean
  onClose: () => void
  saved: readonly NamedLayoutDto[]
  /** A locked layout takes none: the user unlocks it first. */
  locked: boolean
  /** The server could not give the screen's layout: its saved ones are unknown, none is saved. */
  unread: boolean
  onSave: (name: string) => void
  onApply: (name: string) => void
  onDelete: (name: string) => void
}

/**
 * The layouts of a screen kept under a name: the current one saved, one applied or deleted. The
 * confirmation of a deletion opens over it, beside it in React: inside, its Escape and its close
 * would reach this dialog's handlers through React and close it too.
 */
export function SavedLayoutsDialog({ open, onClose, onDelete, ...form }: SavedLayoutsDialogProps) {
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState<string | null>(null)
  return (
    <>
      <Dialog open={open} onClose={onClose} title={t('workspace.savedTitle')} width={440}>
        <SavedLayoutsForm onClose={onClose} onDelete={setDeleting} {...form} />
      </Dialog>
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('workspace.deleteTitle')}
        message={t('workspace.deleteMessage', { name: deleting ?? '' })}
        confirmLabel={t('workspace.delete')}
        tone="danger"
        onConfirm={() => {
          if (deleting === null) return
          onDelete(deleting)
          toast.info(t('workspace.deleted', { name: deleting }))
          setDeleting(null)
        }}
      />
    </>
  )
}

/** Mounted with each opening, so the name starts empty. */
function SavedLayoutsForm({
  onClose,
  saved,
  locked,
  unread,
  onSave,
  onApply,
  onDelete,
}: Omit<SavedLayoutsDialogProps, 'open'>) {
  const { t } = useTranslation()
  const listId = useId()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const trimmed = name.trim()
  const replacing = saved.some((layout) => sameLayoutName(layout.name, trimmed))
  const full = !replacing && saved.length >= SAVED_LAYOUTS_MAX
  const error = !submitted
    ? undefined
    : trimmed === ''
      ? t('workspace.nameRequired')
      : full
        ? t('workspace.tooMany', { max: SAVED_LAYOUTS_MAX })
        : undefined

  const submit = () => {
    setSubmitted(true)
    if (unread || trimmed === '' || full) return
    onSave(trimmed)
    toast.success(t('workspace.savedAs', { name: trimmed }))
    onClose()
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <Field
          label={t('workspace.saveAs')}
          hint={replacing ? t('workspace.replaceHint') : undefined}
          error={error}
        >
          <div className="flex gap-2">
            <TextInput
              value={name}
              onChange={setName}
              maxLength={NAME_MAX}
              className="min-w-0 flex-1"
            />
            <Button type="submit" variant="primary" disabled={unread}>
              {replacing ? t('workspace.replace') : t('common.save')}
            </Button>
          </div>
        </Field>
        <h3 id={listId} className="mt-2 font-sans text-data text-secondary">
          {t('workspace.savedList')}
        </h3>
        {unread || saved.length === 0 ? (
          <p className="font-sans text-data text-secondary">
            {t(unread ? 'workspace.savedUnread' : 'workspace.noSaved')}
          </p>
        ) : (
          <ul aria-labelledby={listId} className="flex flex-col border-t">
            {saved.map((layout) => (
              <li
                key={layout.name}
                className="flex min-h-8 items-center gap-2 border-b py-1 font-sans text-data"
              >
                <span className="min-w-0 flex-1 truncate">{layout.name}</span>
                <Button
                  size="sm"
                  disabled={locked}
                  aria-label={t('workspace.applyNamed', { name: layout.name })}
                  onClick={() => {
                    onApply(layout.name)
                    toast.success(t('workspace.applied', { name: layout.name }))
                    onClose()
                  }}
                >
                  {t('workspace.apply')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  aria-label={t('workspace.deleteNamed', { name: layout.name })}
                  onClick={() => onDelete(layout.name)}
                />
              </li>
            ))}
          </ul>
        )}
        {locked && saved.length > 0 && (
          <p className="font-sans text-data text-secondary">{t('workspace.unlockToApply')}</p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogFooter>
    </form>
  )
}
