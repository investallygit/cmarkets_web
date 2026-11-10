import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, summaryLimit, useNewsArticle, useSaveNews } from '@/entities/news'
import { SecurityListField } from '@/entities/security'
import { isApiError } from '@/shared/api'
import {
  NEWS_CATEGORIES,
  NEWS_TYPES,
  type NewsArticleDto,
  type NewsCategory,
  type NewsLanguage,
  type NewsType,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { docParagraphs, textDoc } from '@/shared/lib/richText'
import { useFormat, useLocale } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'
import { toParagraphs } from '../lib/paragraphs'

const LANGUAGES: readonly NewsLanguage[] = ['fr', 'en']

interface NewsFormProps {
  /** The news item edited; null for a new one. */
  articleId: string | null
  onSaved: (article: NewsArticleDto) => void
}

/**
 * NEWS: an official release or notice of the CMARKET channel, entered by the Data admin as an
 * ARTICLE (headline, standfirst, body) or a FLASH (headline and 500 characters), in a category,
 * for one or more countries, in French or English (spec section 16). A new item reaches the
 * terminals at once (NewsPublished); a FLASH also the alerts of its securities and countries.
 */
export function NewsForm({ articleId, onSaved }: NewsFormProps) {
  const article = useNewsArticle(articleId)
  if (!articleId) return <NewsFields article={null} onSaved={onSaved} />
  return (
    <QueryView query={article}>
      {(data) => <NewsFields key={data.id} article={data} onSaved={onSaved} />}
    </QueryView>
  )
}

function NewsFields({
  article,
  onSaved,
}: {
  article: NewsArticleDto | null
  onSaved: (article: NewsArticleDto) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const save = useSaveNews()
  const [type, setType] = useState<NewsType>(article?.type ?? 'article')
  const [headline, setHeadline] = useState(article?.headline ?? '')
  const [subject, setSubject] = useState(article?.subject ?? '')
  const [category, setCategory] = useState<NewsCategory>(article?.category ?? 'issuers')
  const [language, setLanguage] = useState<NewsLanguage>(article?.language ?? locale)
  const [countries, setCountries] = useState<string[]>(article?.countries ?? [])
  const [securityIds, setSecurityIds] = useState<string[]>(article?.securityIds ?? [])
  const [summary, setSummary] = useState(article?.summary ?? '')
  // The NEWS screen writes plain paragraphs; the studio's richer bodies come back as their text.
  const [text, setText] = useState(article?.body ? docParagraphs(article.body).join('\n\n') : '')
  const errors = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const flash = type === 'flash'
  const allCemac = CEMAC_COUNTRIES.every((code) => countries.includes(code))

  const toggleCountry = (code: string, checked: boolean) =>
    setCountries((current) =>
      checked
        ? [...current.filter((value) => value !== code), code]
        : current.filter((value) => value !== code),
    )

  return (
    <form
      noValidate
      className="grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(
          {
            id: article?.id ?? null,
            news: {
              type,
              headline: headline.trim(),
              subject: subject.trim() ? subject.trim().toUpperCase() : null,
              category,
              countries: CEMAC_COUNTRIES.filter((code) => countries.includes(code)),
              securityIds,
              language,
              summary: summary.trim(),
              body: flash ? null : textDoc(toParagraphs(text)),
            },
          },
          {
            onSuccess: (saved) => {
              toast.success(article ? t('content.updated') : t('content.published'))
              onSaved(saved)
            },
          },
        )
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Field
          label={t('content.type')}
          group
          hint={flash ? t('content.flashHint') : undefined}
          error={errors.type?.[0]}
        >
          <SegmentedControl
            value={type}
            options={NEWS_TYPES.map((value) => ({ value, label: t(`content.types.${value}`) }))}
            onChange={setType}
          />
        </Field>
        <Field label={t('content.language')} group error={errors.language?.[0]}>
          <SegmentedControl
            value={language}
            options={LANGUAGES.map((value) => ({ value, label: t(`content.languages.${value}`) }))}
            onChange={setLanguage}
          />
        </Field>
      </div>
      <Field
        label={t('content.headline')}
        hint={t('content.characters', { count: headline.trim().length, max: NEWS_LIMITS.headline })}
        error={errors.headline?.[0]}
      >
        <TextInput value={headline} onChange={setHeadline} highlight />
      </Field>
      <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
        <Field
          label={t('content.subject')}
          hint={t('content.subjectHint')}
          error={errors.subject?.[0]}
        >
          <TextInput value={subject} onChange={setSubject} placeholder="SEMC" mono highlight />
        </Field>
        <Field label={t('content.category')} error={errors.category?.[0]}>
          <Select
            value={category}
            options={NEWS_CATEGORIES.map((value) => ({
              value,
              label: t(`news.categories.${value}`),
            }))}
            onChange={setCategory}
          />
        </Field>
      </div>
      <Field label={t('content.countries')} group error={errors.countries?.[0]}>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <Checkbox
            checked={allCemac}
            onChange={(checked) => setCountries(checked ? [...CEMAC_COUNTRIES] : [])}
            label={t('content.cemac')}
          />
          {CEMAC_COUNTRIES.map((code) => (
            <Checkbox
              key={code}
              checked={countries.includes(code)}
              onChange={(checked) => toggleCountry(code, checked)}
              label={format.country(code)}
            />
          ))}
        </div>
      </Field>
      <Field
        label={t('content.securities')}
        hint={t('content.securitiesHint', { max: NEWS_LIMITS.securities })}
        error={errors.securityIds?.[0]}
      >
        <SecurityListField
          value={securityIds}
          onChange={setSecurityIds}
          addLabel={t('content.addSecurity')}
          removeLabel={(code) => t('content.removeSecurity', { code })}
        />
      </Field>
      <Field
        label={flash ? t('content.flashText') : t('content.standfirst')}
        hint={t('content.characters', { count: summary.trim().length, max: summaryLimit(type) })}
        error={errors.summary?.[0]}
      >
        <Textarea value={summary} onChange={setSummary} rows={flash ? 5 : 3} highlight />
      </Field>
      {!flash && (
        <Field label={t('content.body')} hint={t('content.bodyHint')} error={errors.body?.[0]}>
          <Textarea value={text} onChange={setText} rows={8} highlight />
        </Field>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" busy={save.isPending}>
          {article ? t('content.saveChanges') : t('content.publish')}
        </Button>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
      </div>
    </form>
  )
}
