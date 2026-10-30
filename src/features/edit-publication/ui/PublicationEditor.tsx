import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { SecurityPicker } from '@/entities/security'
import type { PublicationDto, SubjectType } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { contentIssues, contentSubmissionIssues, SUMMARY_MAX, TITLE_MAX } from '../model/draftForm'
import { isEditable, useDraftStore } from '../model/draftStore'

// TipTap and ProseMirror load with the editor, after the rest of the studio.
const RichTextEditor = lazy(() =>
  import('./RichTextEditor').then((module) => ({ default: module.RichTextEditor })),
)

const SUBJECT_TYPES: readonly SubjectType[] = ['company', 'country']

/**
 * Screen 7, centre: the subject (a company or a country), the title, the summary readers see for
 * free and the text. Published publications keep their subject.
 */
export function PublicationEditor({ publication }: { publication: PublicationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const draft = useDraftStore((state) => state.draft)
  const edit = useDraftStore((state) => state.edit)
  if (draft?.publicationId !== publication.id) return <PanelLoading />

  const { form } = draft
  const editable = isEditable(draft)
  const issues = draft.checked ? contentSubmissionIssues(form) : contentIssues(form)
  const message = (field: string) =>
    (issues[field] &&
      t(`studio.errors.${issues[field]}`, { max: field === 'title' ? TITLE_MAX : SUMMARY_MAX })) ||
    draft.serverErrors[field]?.[0] ||
    null
  const company = form.subjectType === 'company'
  const subjectName =
    publication.subject?.id === form.subjectId ? publication.subject?.name : undefined

  return (
    <div className="flex min-h-full flex-col gap-2.5 p-3">
      <Field label={t('studio.editor.subject')} group error={message('subject')}>
        {draft.published ? (
          <p className="font-mono text-data">
            {company
              ? [form.subjectCode, subjectName].filter(Boolean).join(' — ')
              : format.country(form.subjectId ?? '')}
          </p>
        ) : (
          <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] gap-2">
            <SegmentedControl
              value={form.subjectType}
              options={SUBJECT_TYPES.map((value) => ({
                value,
                label: t(`studio.editor.subjects.${value}`),
              }))}
              onChange={(subjectType) =>
                edit({
                  subjectType,
                  subjectId: null,
                  subjectCode: null,
                  rating: null,
                  targetPrice: null,
                  dataDate: null,
                })
              }
              disabled={!editable}
              aria-label={t('studio.editor.subjectType')}
            />
            {company ? (
              <SecurityPicker
                types={['equity']}
                value={
                  form.subjectCode && [form.subjectCode, subjectName].filter(Boolean).join(' — ')
                }
                onSelect={(security) =>
                  edit({ subjectId: security.id, subjectCode: security.code })
                }
                placeholder={t('studio.editor.company')}
                aria-label={t('studio.editor.company')}
                highlight={!form.subjectId}
              />
            ) : (
              <Select
                value={form.subjectId ?? ''}
                options={[
                  { value: '', label: t('studio.editor.chooseCountry') },
                  ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
                ]}
                onChange={(country) =>
                  edit({ subjectId: country || null, subjectCode: country || null })
                }
                disabled={!editable}
                aria-label={t('studio.editor.country')}
                highlight={!form.subjectId}
              />
            )}
          </div>
        )}
      </Field>
      <Field label={t('studio.editor.title')} error={message('title')}>
        <TextInput
          value={form.title}
          onChange={(title) => edit({ title })}
          disabled={!editable}
          highlight={!form.title}
          className="font-semibold"
        />
      </Field>
      <Field label={t('studio.editor.summary')} error={message('summary')}>
        <Textarea
          value={form.summary}
          onChange={(summary) => edit({ summary })}
          rows={3}
          disabled={!editable}
          highlight={!form.summary}
        />
      </Field>
      <Suspense fallback={<PanelLoading />}>
        <RichTextEditor
          key={draft.generation}
          publicationId={publication.id}
          content={form.body}
          charts={publication.charts}
          editable={editable}
          security={
            company && form.subjectId
              ? { id: form.subjectId, code: form.subjectCode ?? form.subjectId }
              : null
          }
        />
      </Suspense>
      {message('body') && (
        <p role="alert" className="font-sans text-title text-down">
          {message('body')}
        </p>
      )}
    </div>
  )
}
