import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, useProviderSource } from '@/entities/news'
import { SecurityListField } from '@/entities/security'
import { NEWS_CATEGORIES, NEWS_TYPES, type NewsCategory } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { publishNeeds, type PublishNeed } from '../model/newsForm'
import { isNewsEditable, useNewsDraftStore } from '../model/newsDraftStore'
import { usePublishNews } from '../model/usePublishNews'
import { NewsPreviewDialog } from './NewsPreviewDialog'

const LANGUAGES = ['fr', 'en'] as const

/**
 * Screen 13, right: the category, the countries (CEMAC ticks the six), the related securities, the
 * language, the type (fixed once published), the time to go live (now, or a day and time of
 * Douala), Preview and Publish. Publish stays off until the required fields are filled and the
 * rights box is ticked; it reads Schedule for a time to come, Update once published (spec section 9).
 */
export function NewsPublishing() {
  const { t } = useTranslation()
  const format = useFormat()
  const draft = useNewsDraftStore((state) => state.draft)
  const edit = useNewsDraftStore((state) => state.edit)
  const setGoLive = useNewsDraftStore((state) => state.setGoLive)
  const { publish, pending } = usePublishNews()
  const source = useProviderSource().data
  const [previewing, setPreviewing] = useState(false)
  if (!draft) return <PanelLoading />

  const { form, item, goLive } = draft
  const editable = isNewsEditable(draft)
  const published = item.status === 'published'
  const scheduled = !published && goLive.mode === 'scheduled'
  const needs = publishNeeds(form, {
    rightsConfirmed: draft.rightsConfirmed || published,
    schedule: scheduled ? goLive : null,
    now: new Date(),
  })
  const shown = (need: PublishNeed) => draft.checked && needs.includes(need)
  const serverError = (field: string) => draft.serverErrors[field]?.[0] ?? null
  const allCemac = CEMAC_COUNTRIES.every((code) => form.countries.includes(code))
  const toggleCountry = (code: string, checked: boolean) =>
    edit({
      countries: checked
        ? [...form.countries, code]
        : form.countries.filter((country) => country !== code),
    })
  // A newspaper reviewed before publication sends its item to CMarket's moderators (ROADMAP step 27).
  const reviewed = source?.moderation === 'before'
  const action = published ? 'update' : reviewed ? 'review' : scheduled ? 'schedule' : 'publish'

  return (
    <div className="flex min-h-full flex-col gap-2.5 p-3">
      <Field
        label={t('newsStudio.publishing.category')}
        error={shown('category') ? t('newsStudio.editor.errors.required') : serverError('category')}
      >
        <Select
          value={form.category ?? ''}
          options={[
            { value: '', label: t('newsStudio.publishing.chooseCategory') },
            ...NEWS_CATEGORIES.map((value) => ({ value, label: t(`news.categories.${value}`) })),
          ]}
          onChange={(category) => edit({ category: (category || null) as NewsCategory | null })}
          disabled={!editable}
          highlight={!form.category}
        />
      </Field>
      <Field
        label={t('newsStudio.publishing.countries')}
        group
        error={
          shown('countries') ? t('newsStudio.editor.errors.required') : serverError('countries')
        }
      >
        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
          <Checkbox
            checked={allCemac}
            onChange={(checked) => edit({ countries: checked ? [...CEMAC_COUNTRIES] : [] })}
            label={t('newsStudio.publishing.cemac')}
            className="col-span-3"
          />
          {CEMAC_COUNTRIES.map((code) => (
            <Checkbox
              key={code}
              checked={form.countries.includes(code)}
              onChange={(checked) => toggleCountry(code, checked)}
              label={format.country(code)}
            />
          ))}
        </div>
      </Field>
      <Field
        label={t('newsStudio.publishing.securities')}
        hint={t('newsStudio.publishing.securitiesHint', { max: NEWS_LIMITS.securities })}
        error={serverError('securityIds')}
      >
        <SecurityListField
          value={form.securityIds}
          onChange={(securityIds) => edit({ securityIds })}
          addLabel={t('content.addSecurity')}
          removeLabel={(code) => t('content.removeSecurity', { code })}
          max={NEWS_LIMITS.securities}
          disabled={!editable}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('newsStudio.publishing.language')}>
          <Select
            value={form.language}
            options={LANGUAGES.map((value) => ({ value, label: t(`content.languages.${value}`) }))}
            onChange={(language) => edit({ language })}
            disabled={!editable}
          />
        </Field>
        <Field
          label={t('newsStudio.publishing.type')}
          group
          hint={published ? t('newsStudio.publishing.typeFixed') : undefined}
          error={serverError('type')}
        >
          <SegmentedControl
            value={form.type}
            options={NEWS_TYPES.map((value) => ({ value, label: t(`news.types.${value}`) }))}
            onChange={(type) => edit(type === 'flash' ? { type, body: null } : { type })}
            disabled={!editable || published}
            aria-label={t('newsStudio.publishing.type')}
          />
        </Field>
      </div>
      {!published && editable && (
        <Field
          label={t('newsStudio.publishing.goLive')}
          group
          error={shown('publishAt') ? t('newsStudio.publishing.past') : serverError('publishAt')}
        >
          <SegmentedControl
            value={goLive.mode}
            options={[
              { value: 'now', label: t('newsStudio.publishing.immediate') },
              { value: 'scheduled', label: t('newsStudio.publishing.scheduled') },
            ]}
            onChange={(mode) => setGoLive({ mode })}
            aria-label={t('newsStudio.publishing.goLive')}
          />
          {goLive.mode === 'scheduled' && (
            <div className="mt-1.5 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">
              <DateInput
                value={goLive.date || null}
                onChange={(date) => setGoLive({ date: date ?? '' })}
                aria-label={t('newsStudio.publishing.date')}
              />
              <TextInput
                type="time"
                value={goLive.time}
                onChange={(time) => setGoLive({ time })}
                aria-label={t('newsStudio.publishing.time')}
                mono
              />
            </div>
          )}
        </Field>
      )}
      {form.type === 'flash' && source && (
        <p className="font-sans text-data text-secondary">
          {t('newsStudio.publishing.flashesToday', {
            count: source.flashesToday,
            quota: source.flashQuota,
          })}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setPreviewing(true)}>{t('newsStudio.publishing.preview')}</Button>
        {editable && (
          <Button
            variant="primary"
            disabled={pending || draft.saving || needs.length > 0}
            onClick={() => void publish()}
          >
            {t(`newsStudio.publishing.${action}`)}
          </Button>
        )}
      </div>
      {editable && reviewed && !published && (
        <p className="font-sans text-data text-secondary">
          {t('newsStudio.publishing.reviewNote', { name: source.name })}
        </p>
      )}
      {editable && needs.length > 0 && (
        <p className="font-sans text-data text-secondary">
          {t('newsStudio.publishing.missing', {
            fields: needs
              .map((need) =>
                t(
                  `newsStudio.publishing.fields.${need === 'summary' && form.type === 'flash' ? 'flashText' : need}`,
                ),
              )
              .join(', '),
          })}
        </p>
      )}
      {!editable && (
        <p className="font-sans text-data text-secondary">
          {item.status === 'pending'
            ? t('newsStudio.publishing.pendingNote', {
                date: item.submittedAt
                  ? `${format.date(item.submittedAt)} ${format.time(item.submittedAt)}`
                  : '',
              })
            : t('newsStudio.publishing.readOnly')}
        </p>
      )}
      <NewsPreviewDialog open={previewing} onClose={() => setPreviewing(false)} />
    </div>
  )
}
