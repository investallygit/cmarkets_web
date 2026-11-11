import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveNewsSource } from '@/entities/news-source'
import { isApiError } from '@/shared/api'
import {
  NEWS_MODERATIONS,
  type AdminNewsSourceDto,
  type AdminNewsSourceWriteDto,
  type NewsLanguage,
} from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

const SHORT_NAME = /^[\p{Lu}\p{N}][\p{Lu}\p{N} .&'-]{0,15}$/u
const MAX_FLASH_QUOTA = 500

const toWrite = (source: AdminNewsSourceDto): AdminNewsSourceWriteDto => ({
  name: source.name,
  shortName: source.shortName,
  websiteUrl: source.websiteUrl,
  language: source.language,
  verified: source.verified,
  moderation: source.moderation,
  ratePerClick: source.ratePerClick,
  monthlyCap: source.monthlyCap,
  flashQuota: source.flashQuota,
})

const isWebAddress = (text: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol)
  } catch {
    return false
  }
}

/**
 * A newspaper as the Admin keeps it (SRC, ROADMAP decision 6): its name, tag, site and language,
 * whether CMarket verified it, when its items are reviewed; a partner newspaper's contract too,
 * its rate per unique click, monthly cap and FLASH items a day (spec section 16). Each change is
 * written to the audit log.
 */
export function NewsSourceForm({ source }: { source: AdminNewsSourceDto }) {
  const { t } = useTranslation()
  const save = useSaveNewsSource()
  const [form, setForm] = useState(() => toWrite(source))
  const [submitted, setSubmitted] = useState(false)
  const partner = source.channel === 'partner'
  const cmarket = source.channel === 'cmarket'
  const edit = (patch: Partial<AdminNewsSourceWriteDto>) =>
    setForm((current) => ({ ...current, ...patch }))

  const local = {
    name:
      form.name.trim().length > 0 && form.name.trim().length <= 100
        ? null
        : t('newsSources.errors.name'),
    shortName: SHORT_NAME.test(form.shortName.trim()) ? null : t('newsSources.errors.shortName'),
    websiteUrl:
      !form.websiteUrl?.trim() || isWebAddress(form.websiteUrl.trim())
        ? null
        : t('newsSources.errors.website'),
    ratePerClick: form.ratePerClick >= 0 ? null : t('newsSources.errors.rate'),
    monthlyCap:
      form.monthlyCap === null || (form.monthlyCap >= 0 && Number.isInteger(form.monthlyCap))
        ? null
        : t('newsSources.errors.cap'),
    flashQuota:
      Number.isInteger(form.flashQuota) &&
      form.flashQuota >= 0 &&
      form.flashQuota <= MAX_FLASH_QUOTA
        ? null
        : t('newsSources.errors.quota'),
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: keyof typeof local) => (submitted && local[field]) || server[field]?.[0]
  const changed = JSON.stringify(form) !== JSON.stringify(toWrite(source))

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(
          {
            id: source.id,
            source: {
              ...form,
              name: form.name.trim(),
              shortName: form.shortName.trim(),
              websiteUrl: form.websiteUrl?.trim() || null,
            },
          },
          {
            onSuccess: (saved) => {
              setSubmitted(false)
              setForm(toWrite(saved.source))
              toast.success(t('newsSources.saved', { name: saved.source.name }))
            },
          },
        )
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label={t('newsSources.name')} error={error('name')}>
          <TextInput value={form.name} onChange={(name) => edit({ name })} highlight />
        </Field>
        <Field
          label={t('newsSources.shortName')}
          hint={t('newsSources.shortNameHint')}
          error={error('shortName')}
        >
          <TextInput
            value={form.shortName}
            onChange={(shortName) => edit({ shortName: shortName.toUpperCase() })}
            disabled={cmarket}
            mono
            highlight={!cmarket}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label={t('newsSources.website')} error={error('websiteUrl')}>
          <TextInput
            value={form.websiteUrl ?? ''}
            onChange={(websiteUrl) => edit({ websiteUrl })}
            type="url"
            placeholder="https://"
            mono
            highlight
          />
        </Field>
        <Field label={t('newsSources.language')}>
          <Select
            value={form.language ?? ''}
            options={[
              { value: '', label: t('newsSources.noLanguage') },
              { value: 'fr', label: t('content.languages.fr') },
              { value: 'en', label: t('content.languages.en') },
            ]}
            onChange={(language) => edit({ language: (language || null) as NewsLanguage | null })}
            highlight
          />
        </Field>
      </div>
      <Checkbox
        checked={form.verified}
        onChange={(verified) => edit({ verified })}
        label={t('newsSources.verified')}
        disabled={cmarket}
      />
      {partner && (
        <>
          <Field label={t('newsSources.moderation')} group hint={t('newsSources.moderationHint')}>
            <SegmentedControl
              value={form.moderation}
              options={NEWS_MODERATIONS.map((value) => ({
                value,
                label: t(`newsSources.moderations.${value}`),
              }))}
              onChange={(moderation) => edit({ moderation })}
              aria-label={t('newsSources.moderation')}
            />
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
              {t('newsSources.contract')}
            </legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('newsSources.rate')} error={error('ratePerClick')}>
                <NumberInput
                  value={form.ratePerClick}
                  onChange={(value) => edit({ ratePerClick: value ?? 0 })}
                  decimals={2}
                  highlight
                />
              </Field>
              <Field
                label={t('newsSources.cap')}
                hint={t('newsSources.capHint')}
                error={error('monthlyCap')}
              >
                <NumberInput
                  value={form.monthlyCap}
                  onChange={(monthlyCap) => edit({ monthlyCap })}
                  decimals={0}
                  highlight
                />
              </Field>
              <Field label={t('newsSources.quota')} error={error('flashQuota')}>
                <NumberInput
                  value={form.flashQuota}
                  onChange={(value) => edit({ flashQuota: value ?? 0 })}
                  decimals={0}
                  highlight
                />
              </Field>
            </div>
          </fieldset>
        </>
      )}
      {save.error && !isApiError(save.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {save.error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('newsSources.save')}
        </Button>
        <Button
          disabled={!changed}
          onClick={() => {
            save.reset()
            setSubmitted(false)
            setForm(toWrite(source))
          }}
        >
          {t('newsSources.cancel')}
        </Button>
      </div>
    </form>
  )
}
