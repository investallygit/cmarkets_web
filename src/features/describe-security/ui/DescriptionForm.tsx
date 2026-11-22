import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DESCRIPTION_LANGUAGES, useDescribe } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { DescriptionVersionDto, DescriptionVersionsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_SOURCE_MAX_LENGTH,
  emptyLanguageView,
  languageChanged,
  latestVersion,
} from '../lib/descriptionStatus'

type Language = 'fr' | 'en'

interface DescriptionFormProps {
  versions: DescriptionVersionsDto
  /** Code shown in the confirmation. */
  code: string
  /** After a save: DES's dialog closes. */
  onSaved?: () => void
}

/**
 * A description in French and English, 1,500 characters each, with the documents each was written
 * from (spec section 9, screens 2 and 31, fifth version): CORR's form, and DES's Edit for an
 * Analyst of CMarket (ROADMAP decision 40). Each language changed is a new version (PUT
 * /admin/descriptions/{type}/{id}), the earlier ones listed; an empty language is removed, and the
 * screens then show EODHD's English, or the other language's text, marked.
 */
export function DescriptionForm({ versions, code, onSaved }: DescriptionFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const describe = useDescribe()
  const [current, setCurrent] = useState(versions)
  const initial = (language: Language) => latestVersion(current, language)
  const [texts, setTexts] = useState({
    fr: initial('fr')?.text ?? '',
    en: initial('en')?.text ?? '',
  })
  const [sources, setSources] = useState({
    fr: initial('fr')?.source ?? '',
    en: initial('en')?.source ?? '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const changed = DESCRIPTION_LANGUAGES.filter((language) =>
    languageChanged(latestVersion(current, language), texts[language], sources[language]),
  )
  const tooLong = DESCRIPTION_LANGUAGES.filter(
    (language) => texts[language].trim().length > DESCRIPTION_MAX_LENGTH,
  )
  const sourceTooLong = DESCRIPTION_LANGUAGES.filter(
    (language) => sources[language].trim().length > DESCRIPTION_SOURCE_MAX_LENGTH,
  )
  const serverErrors = isApiError(describe.error, 400) ? (describe.error.problem.errors ?? {}) : {}
  const max = format.number(DESCRIPTION_MAX_LENGTH, 0)

  const hint = (language: Language) => {
    const count = t('corrections.description.count', {
      count: format.number(texts[language].trim().length, 0),
      max,
    })
    const latest = latestVersion(current, language)
    const status = latest?.text
      ? t('corrections.description.written', {
          version: latest.version,
          who: latest.author,
          when: format.date(latest.writtenAt),
        })
      : t(`corrections.description.empty.${emptyLanguageView(current, language, texts)}`, {
          other: t(`corrections.description.languageNames.${language === 'fr' ? 'en' : 'fr'}`),
        })
    return `${count} · ${status}`
  }

  const save = async () => {
    setSaving(true)
    try {
      let saved = current
      for (const language of changed) {
        saved = await describe.mutateAsync({
          type: current.objectType,
          id: current.objectId,
          description: {
            language,
            text: texts[language].trim() || null,
            source: texts[language].trim() ? sources[language].trim() || null : null,
          },
        })
      }
      // The texts as kept: their spaces and line breaks tidied.
      setCurrent(saved)
      setTexts({ fr: saved.fr[0]?.text ?? '', en: saved.en[0]?.text ?? '' })
      setSources({ fr: saved.fr[0]?.source ?? '', en: saved.en[0]?.source ?? '' })
      setSubmitted(false)
      toast.success(t('corrections.description.saved', { code }))
      onSaved?.()
    } catch {
      // The error shows on its field or under the form.
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (tooLong.length > 0 || sourceTooLong.length > 0 || changed.length === 0) return
        void save()
      }}
    >
      <p className="font-sans text-data text-secondary">{t('corrections.description.intro')}</p>
      {DESCRIPTION_LANGUAGES.map((language) => (
        <fieldset key={language} className="grid gap-2">
          <Field
            label={t(`corrections.description.languages.${language}`)}
            hint={hint(language)}
            error={
              (submitted &&
                tooLong.includes(language) &&
                t('corrections.description.tooLong', { max })) ||
              (describe.variables?.description.language === language
                ? serverErrors.text?.[0]
                : undefined)
            }
          >
            <Textarea
              lang={language}
              value={texts[language]}
              onChange={(value) => {
                describe.reset()
                setTexts((now) => ({ ...now, [language]: value }))
              }}
              rows={6}
              highlight
            />
          </Field>
          <Field
            label={t(`corrections.description.sources.${language}`)}
            hint={t('corrections.description.sourceHint')}
            error={
              submitted && sourceTooLong.includes(language)
                ? t('corrections.description.tooLong', {
                    max: format.number(DESCRIPTION_SOURCE_MAX_LENGTH, 0),
                  })
                : undefined
            }
          >
            <TextInput
              value={sources[language]}
              onChange={(value) => {
                describe.reset()
                setSources((now) => ({ ...now, [language]: value }))
              }}
              disabled={texts[language].trim() === ''}
            />
          </Field>
          <VersionHistory versions={current[language]} />
        </fieldset>
      ))}
      {current.eodhd && (
        <details className="font-sans text-data">
          <summary className="cursor-pointer text-secondary hover:text-primary">
            {t('corrections.description.eodhd', { when: format.date(current.eodhd.updatedAt) })}
          </summary>
          <p lang="en" className="mt-1 whitespace-pre-line text-primary">
            {current.eodhd.text}
          </p>
        </details>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" busy={saving} disabled={changed.length === 0}>
          {t('corrections.description.submit')}
        </Button>
        {changed.length === 0 && (
          <span className="font-sans text-data text-secondary">
            {t('corrections.description.unchanged')}
          </span>
        )}
        {describe.error && !isApiError(describe.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {describe.error.message}
          </span>
        )}
      </div>
    </form>
  )
}

/** A language's versions before the latest, newest first: who wrote each, when, from what. */
function VersionHistory({ versions }: { versions: DescriptionVersionDto[] }) {
  const { t } = useTranslation()
  const format = useFormat()
  const earlier = versions.slice(1)
  if (earlier.length === 0) return null
  return (
    <details className="font-sans text-data">
      <summary className="cursor-pointer text-secondary hover:text-primary">
        {t('corrections.description.history', { count: earlier.length })}
      </summary>
      <ol className="mt-1 grid gap-2">
        {earlier.map((version) => (
          <li key={version.version} className="grid gap-0.5">
            <span className="text-secondary">
              {t('corrections.description.versionLine', {
                version: version.version,
                who: version.author,
                when: format.date(version.writtenAt),
              })}
              {version.fromFile && ` · ${t('corrections.description.fromFile')}`}
              {version.source && ` · ${version.source}`}
            </span>
            <span className="whitespace-pre-line text-primary">
              {version.text ?? t('corrections.description.removed')}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}
