import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DESCRIPTION_LANGUAGES, useDescribeSecurity } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { StoredDescriptionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'
import { DESCRIPTION_MAX_LENGTH, emptyLanguageView } from '../lib/descriptionStatus'

interface DescriptionFormProps {
  stored: StoredDescriptionDto
  /** Code shown in the confirmation. */
  code: string
}

/**
 * CORR: a security's description in French and English, 2,000 characters each, which EQS shows
 * under its results (PUT /data/securities/{id}/description). An empty language is removed: EQS
 * then shows EODHD's English, or the other language's text, marked.
 */
export function DescriptionForm({ stored, code }: DescriptionFormProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const describe = useDescribeSecurity()
  const [texts, setTexts] = useState({ fr: stored.fr?.text ?? '', en: stored.en?.text ?? '' })
  const [submitted, setSubmitted] = useState(false)

  const changed = DESCRIPTION_LANGUAGES.some(
    (language) => texts[language].trim() !== (stored[language]?.text ?? ''),
  )
  const tooLong = DESCRIPTION_LANGUAGES.filter(
    (language) => texts[language].trim().length > DESCRIPTION_MAX_LENGTH,
  )
  const serverErrors = isApiError(describe.error, 400) ? (describe.error.problem.errors ?? {}) : {}
  const max = format.number(DESCRIPTION_MAX_LENGTH, 0)

  const hint = (language: 'fr' | 'en') => {
    const count = t('corrections.description.count', {
      count: format.number(texts[language].trim().length, 0),
      max,
    })
    const written = stored[language]
    const status = written
      ? t('corrections.description.written', {
          who: written.updatedBy,
          when: format.date(written.updatedAt),
        })
      : t(`corrections.description.empty.${emptyLanguageView(stored, language, texts)}`, {
          other: t(`corrections.description.languageNames.${language === 'fr' ? 'en' : 'fr'}`),
        })
    return `${count} · ${status}`
  }

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (tooLong.length > 0 || !changed) return
        const text = (language: 'fr' | 'en') => texts[language].trim() || null
        describe.mutate(
          { securityId: stored.securityId, description: { fr: text('fr'), en: text('en') } },
          {
            onSuccess: (saved) => {
              // The texts as kept: their spaces and line breaks tidied.
              setTexts({ fr: saved.fr?.text ?? '', en: saved.en?.text ?? '' })
              setSubmitted(false)
              toast.success(t('corrections.description.saved', { code }))
            },
          },
        )
      }}
    >
      <p className="font-sans text-data text-secondary">{t('corrections.description.intro')}</p>
      {DESCRIPTION_LANGUAGES.map((language) => (
        <Field
          key={language}
          label={t(`corrections.description.languages.${language}`)}
          hint={hint(language)}
          error={
            (submitted &&
              tooLong.includes(language) &&
              t('corrections.description.tooLong', { max })) ||
            serverErrors[language]?.[0]
          }
        >
          <Textarea
            lang={language}
            value={texts[language]}
            onChange={(value) => {
              describe.reset()
              setTexts((current) => ({ ...current, [language]: value }))
            }}
            rows={6}
            highlight
          />
        </Field>
      ))}
      {stored.eodhd && (
        <details className="font-sans text-data">
          <summary className="cursor-pointer text-secondary hover:text-primary">
            {t('corrections.description.eodhd', { when: format.date(stored.eodhd.updatedAt) })}
          </summary>
          <p lang="en" className="mt-1 whitespace-pre-line text-primary">
            {stored.eodhd.text}
          </p>
        </details>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" busy={describe.isPending} disabled={!changed}>
          {t('corrections.description.submit')}
        </Button>
        {!changed && (
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
