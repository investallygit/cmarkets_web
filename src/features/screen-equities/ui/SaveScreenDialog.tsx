import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveScreen } from '@/entities/screener'
import type { SavedScreenDto, ScreenerCriterionDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const MAX_NAME_LENGTH = 40

interface SaveScreenDialogProps {
  open: boolean
  onClose: () => void
  criteria: ScreenerCriterionDto[]
  onSaved: (screen: SavedScreenDto) => void
}

/** SAVE in the criteria title bar: the criteria of the panel under a name. */
export function SaveScreenDialog({ open, onClose, criteria, onSaved }: SaveScreenDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('screener.saveTitle')} width={380}>
      {open && <SaveScreenForm criteria={criteria} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  )
}

function SaveScreenForm({ criteria, onClose, onSaved }: Omit<SaveScreenDialogProps, 'open'>) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const save = useSaveScreen()
  const nameError = submitted && name.trim() === '' ? t('screener.nameRequired') : undefined

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (name.trim() === '') return
        save.mutate(
          { name: name.trim(), criteria },
          {
            onSuccess: (screen) => {
              toast.success(t('screener.saved', { name: screen.name }))
              onSaved(screen)
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field label={t('screener.screenName')} error={nameError}>
          <TextInput value={name} onChange={setName} maxLength={MAX_NAME_LENGTH} />
        </Field>
        <p className="font-sans text-data text-secondary">
          {t('screener.saveSummary', { count: criteria.length })}
        </p>
        {save.error && (
          <p role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
