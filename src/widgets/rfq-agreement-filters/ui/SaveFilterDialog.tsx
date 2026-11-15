import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveAgreementFilter } from '@/entities/rfq-agreement'
import { isApiError } from '@/shared/api'
import type { RfqAgreementCriteria } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const NAME_MAX_LENGTH = 60

interface SaveFilterDialogProps {
  /** The filters to keep; null closes the dialog. */
  criteria: RfqAgreementCriteria | null
  onClose: () => void
}

/** "Save filter" (spec, screen 23): the filters under a name, POST /rfq/agreement-filters. */
export function SaveFilterDialog({ criteria, onClose }: SaveFilterDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={criteria !== null}
      onClose={onClose}
      title={t('rfqAgreements.filters.saveTitle')}
      width={380}
    >
      {criteria && <SaveForm criteria={criteria} onClose={onClose} />}
    </Dialog>
  )
}

function SaveForm({ criteria, onClose }: { criteria: RfqAgreementCriteria; onClose: () => void }) {
  const { t } = useTranslation()
  const save = useSaveAgreementFilter()
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  // A name taken (409) or refused (400): the API's words.
  const serverError =
    isApiError(save.error, 409) || isApiError(save.error, 400)
      ? (save.error.problem.errors?.name?.[0] ?? save.error.problem.detail)
      : save.error?.message
  const error =
    (submitted && name.trim() === '' ? t('rfqAgreements.filters.nameRequired') : undefined) ??
    serverError

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (name.trim() === '') return
        save.mutate(
          { name: name.trim(), criteria },
          {
            onSuccess: (filter) => {
              toast.success(t('rfqAgreements.filters.savedDone', { name: filter.name }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field label={t('rfqAgreements.filters.saveName')} error={error}>
          <TextInput value={name} onChange={setName} maxLength={NAME_MAX_LENGTH} autoFocus />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('rfqAgreements.filters.saveSubmit')}
        </Button>
      </DialogFooter>
    </form>
  )
}
