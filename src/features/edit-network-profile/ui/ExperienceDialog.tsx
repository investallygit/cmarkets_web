import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveExperience } from '@/entities/profile'
import { isApiError } from '@/shared/api'
import type { ExperienceDto, ExperienceKind } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const FIRST_YEAR = 1950

/** A year typed in, "2014"; null when empty. */
const yearOf = (text: string): number | null => (text.trim() ? Number(text.trim()) : null)

interface ExperienceDialogProps {
  /** null: closed; "new": an entry to add. */
  editing: ExperienceDto | 'new' | null
  onClose: () => void
}

/** A position (title, employer, from a year to another or to this day) or a certification. */
export function ExperienceDialog({ editing, onClose }: ExperienceDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={editing !== null}
      onClose={onClose}
      width={460}
      title={
        editing === 'new' || editing === null
          ? t('network.experienceForm.newTitle')
          : t('network.experienceForm.editTitle', { title: editing.title })
      }
    >
      {editing && (
        <ExperienceForm experience={editing === 'new' ? null : editing} onClose={onClose} />
      )}
    </Dialog>
  )
}

type YearError = 'required' | 'year' | 'order'

function ExperienceForm({
  experience,
  onClose,
}: {
  experience: ExperienceDto | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const thisYear = new Date().getFullYear()
  const save = useSaveExperience()
  const [kind, setKind] = useState<ExperienceKind>(experience?.kind ?? 'position')
  const [title, setTitle] = useState(experience?.title ?? '')
  const [organization, setOrganization] = useState(experience?.organization ?? '')
  const [from, setFrom] = useState(experience?.from?.toString() ?? '')
  const [to, setTo] = useState(experience?.to?.toString() ?? '')
  const [current, setCurrent] = useState(experience ? experience.to === null : true)
  const [submitted, setSubmitted] = useState(false)
  const position = kind === 'position'

  const start = yearOf(from)
  const end = position && !current ? yearOf(to) : null
  const yearError = (year: number | null, required: boolean): YearError | undefined => {
    if (year === null) return required ? 'required' : undefined
    return Number.isInteger(year) && year >= FIRST_YEAR && year <= thisYear ? undefined : 'year'
  }
  const endError = (): YearError | undefined => {
    if (!position || current) return undefined
    return (
      yearError(end, true) ?? (start !== null && end !== null && end < start ? 'order' : undefined)
    )
  }
  const errors = {
    title: title.trim() ? undefined : ('required' as const),
    from: yearError(start, position),
    to: endError(),
  }
  const shown = (error: string | undefined) =>
    submitted && error ? t(`network.experienceForm.errors.${error as YearError}`) : undefined
  const serverErrors = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (errors.title || errors.from || errors.to) return
        save.mutate(
          {
            id: experience?.id,
            kind,
            title: title.trim(),
            organization: organization.trim(),
            from: start,
            to: end,
          },
          {
            onSuccess: () => {
              toast.success(t('network.experienceForm.saved'))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field label={t('network.experienceForm.kind')} group>
          <SegmentedControl
            value={kind}
            options={(['position', 'certification'] as const).map((value) => ({
              value,
              label: t(`network.experienceForm.kinds.${value}`),
            }))}
            onChange={setKind}
          />
        </Field>
        <Field
          label={t('network.experienceForm.title')}
          error={shown(errors.title) ?? serverErrors.title?.[0]}
        >
          <TextInput value={title} onChange={setTitle} maxLength={80} />
        </Field>
        <Field
          label={t(
            position ? 'network.experienceForm.organization' : 'network.experienceForm.awardedBy',
          )}
          error={serverErrors.organization?.[0]}
        >
          <TextInput value={organization} onChange={setOrganization} maxLength={80} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t(position ? 'network.experienceForm.from' : 'network.experienceForm.year')}
            error={shown(errors.from) ?? serverErrors.from?.[0]}
          >
            <TextInput value={from} onChange={setFrom} inputMode="numeric" maxLength={4} mono />
          </Field>
          {position && (
            <Field
              label={t('network.experienceForm.to')}
              error={shown(errors.to) ?? serverErrors.to?.[0]}
            >
              <TextInput
                value={current ? '' : to}
                onChange={setTo}
                inputMode="numeric"
                maxLength={4}
                mono
                disabled={current}
              />
            </Field>
          )}
        </div>
        {position && (
          <Checkbox
            checked={current}
            onChange={setCurrent}
            label={t('network.experienceForm.current')}
          />
        )}
        {save.error && !isApiError(save.error, 400) && (
          <p role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {experience ? t('common.save') : t('network.experienceForm.add')}
        </Button>
      </DialogFooter>
    </form>
  )
}
