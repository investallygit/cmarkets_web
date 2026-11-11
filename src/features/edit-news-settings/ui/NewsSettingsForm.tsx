import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveNewsSettings } from '@/entities/news-source'
import { isApiError } from '@/shared/api'
import type { NewsModeration, NewsSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { toast } from '@/shared/ui/toast'

const MAX_VIEWS_PER_HOUR = 10_000

/**
 * The Admin's settings of the news (SRC, ROADMAP decisions 6 and 11): CMarket AI's items go live
 * at once or wait for approval, those less sure than the threshold wait anyway; the views an
 * account makes in an hour before the next count as automated access.
 */
export function NewsSettingsForm({ settings }: { settings: NewsSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveNewsSettings()
  const [moderation, setModeration] = useState<NewsModeration>(settings.aiModeration)
  const [threshold, setThreshold] = useState<number | null>(settings.aiConfidenceThreshold)
  const [views, setViews] = useState<number | null>(settings.viewsPerHour)
  const [submitted, setSubmitted] = useState(false)

  const local = {
    aiConfidenceThreshold:
      threshold !== null &&
      threshold >= 0 &&
      threshold <= 1 &&
      Math.round(threshold * 100) === threshold * 100
        ? null
        : t('newsSettings.errors.threshold'),
    viewsPerHour:
      views !== null && Number.isInteger(views) && views >= 1 && views <= MAX_VIEWS_PER_HOUR
        ? null
        : t('newsSettings.errors.viewsPerHour'),
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: keyof typeof local) => (submitted && local[field]) || server[field]?.[0]
  const changed =
    moderation !== settings.aiModeration ||
    threshold !== settings.aiConfidenceThreshold ||
    views !== settings.viewsPerHour

  const reset = () => {
    save.reset()
    setSubmitted(false)
    setModeration(settings.aiModeration)
    setThreshold(settings.aiConfidenceThreshold)
    setViews(settings.viewsPerHour)
  }

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(
          {
            aiModeration: moderation,
            aiConfidenceThreshold: threshold ?? 0,
            viewsPerHour: views ?? 1,
          },
          {
            onSuccess: () => {
              setSubmitted(false)
              toast.success(t('newsSettings.saved'))
            },
          },
        )
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
        <h3 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
          {t('newsSettings.ai')}
        </h3>
        <Field label={t('newsSettings.aiModeration')} group>
          <SegmentedControl
            value={moderation}
            options={[
              { value: 'after', label: t('newsSettings.aiAfter') },
              { value: 'before', label: t('newsSettings.aiBefore') },
            ]}
            onChange={setModeration}
            aria-label={t('newsSettings.aiModeration')}
          />
        </Field>
        <Field
          label={t('newsSettings.threshold')}
          hint={t('newsSettings.thresholdHint')}
          error={error('aiConfidenceThreshold')}
        >
          <NumberInput
            value={threshold}
            onChange={setThreshold}
            decimals={2}
            highlight
            className="w-28"
          />
        </Field>
        <h3 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
          {t('newsSettings.clicks')}
        </h3>
        <Field
          label={t('newsSettings.viewsPerHour')}
          hint={t('newsSettings.viewsPerHourHint')}
          error={error('viewsPerHour')}
        >
          <NumberInput value={views} onChange={setViews} decimals={0} highlight className="w-28" />
        </Field>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {settings.updatedAt &&
            t('newsSettings.updated', {
              date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
              name: settings.updatedBy ?? '',
            })}
        </span>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
        <Button disabled={!changed} onClick={reset}>
          {t('newsSettings.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('newsSettings.save')}
        </Button>
      </footer>
    </form>
  )
}
