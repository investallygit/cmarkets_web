import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { openScenario, useOptimizer, useSaveScenario } from '@/entities/optimizer'
import { optimizerPath } from '@/shared/routes/paths'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { isApiError } from '@/shared/api'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const NAME_MAX = 80

/**
 * The setup saved under a name, computed on today's data (POST or PUT /optimizer/scenarios): the
 * open scenario again, with its version, or a new one; a copy is always new.
 */
export function SaveScenarioDialog({ copy, onClose }: { copy: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const scenario = useOptimizer((state) => state.scenario)
  const save = useSaveScenario()
  const [name, setName] = useState(
    scenario ? (copy ? t('opt.scenario.copyName', { name: scenario.name }) : scenario.name) : '',
  )
  const valid = name.trim().length > 0 && name.trim().length <= NAME_MAX

  const submit = () => {
    if (!valid) return
    const { setup } = useOptimizer.getState()
    const target = copy ? undefined : scenario
    save.mutate(
      { id: target?.id, version: target?.version, name: name.trim(), setup },
      {
        onSuccess: (saved) => {
          openScenario(saved)
          toast.success(t('opt.scenario.saved', { name: saved.name }))
          void navigate(optimizerPath({ scenario: saved.id }), { replace: true })
          onClose()
        },
        // A name taken is said on the name (409, B59); anything else in a toast.
        onError: (error) => {
          if (!isApiError(error, 409))
            toast.error(t('opt.scenario.failed', { message: error.message }))
        },
      },
    )
  }
  const nameError = isApiError(save.error, 409) ? save.error.message : undefined

  return (
    <Dialog
      open
      onClose={onClose}
      title={copy ? t('opt.scenario.copyTitle') : t('opt.scenario.saveTitle')}
      width={440}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <DialogBody>
          <Field label={t('opt.scenario.name')} hint={t('opt.scenario.saveHint')} error={nameError}>
            <TextInput value={name} onChange={setName} maxLength={NAME_MAX} autoFocus />
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('opt.objective.cancel')}
          </Button>
          <Button variant="primary" type="submit" busy={save.isPending} disabled={!valid}>
            {t('opt.scenario.save')}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
