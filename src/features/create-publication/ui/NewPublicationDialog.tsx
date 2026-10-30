import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreatePublication } from '@/entities/publication'
import { SecurityPicker } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { PublicationDto, SubjectType } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'

interface NewPublicationDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (publication: PublicationDto) => void
}

/** "+ NEW" of the studio: a draft on a listed company or on a country (POST /publications). */
export function NewPublicationDialog({ open, onClose, onCreated }: NewPublicationDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('studio.new.title')}>
      <NewPublicationForm onClose={onClose} onCreated={onCreated} />
    </Dialog>
  )
}

function NewPublicationForm({ onClose, onCreated }: Omit<NewPublicationDialogProps, 'open'>) {
  const { t } = useTranslation()
  const format = useFormat()
  const create = useCreatePublication()
  const [subjectType, setSubjectType] = useState<SubjectType>('company')
  const [subject, setSubject] = useState<{ id: string; code: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const serverError = isApiError(create.error, 400)
    ? create.error.problem.errors?.subject?.[0]
    : null

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!subject) return
        create.mutate(
          { subjectType, subjectId: subject.id },
          {
            onSuccess: (publication) => {
              onCreated(publication)
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field label={t('studio.editor.subjectType')} group>
          <SegmentedControl
            value={subjectType}
            options={(['company', 'country'] as const).map((value) => ({
              value,
              label: t(`studio.editor.subjects.${value}`),
            }))}
            onChange={(value) => {
              setSubjectType(value)
              setSubject(null)
            }}
          />
        </Field>
        <Field
          label={t(subjectType === 'company' ? 'studio.editor.company' : 'studio.editor.country')}
          error={
            (submitted && !subject && t('studio.errors.subjectRequired')) || serverError || null
          }
        >
          {subjectType === 'company' ? (
            <SecurityPicker
              types={['equity']}
              value={subject?.code ?? null}
              onSelect={(security) => setSubject({ id: security.id, code: security.code })}
              onClear={() => setSubject(null)}
              autoFocus
            />
          ) : (
            <Select
              value={subject?.id ?? ''}
              options={[
                { value: '', label: t('studio.editor.chooseCountry') },
                ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
              ]}
              onChange={(code) => setSubject(code ? { id: code, code } : null)}
            />
          )}
        </Field>
        {create.error && !isApiError(create.error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {create.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={create.isPending}>
          {t('studio.new.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
