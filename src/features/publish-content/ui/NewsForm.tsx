import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNewsArticle, useSaveNews } from '@/entities/news'
import { isApiError } from '@/shared/api'
import type { NewsArticleDto, NewsTopic } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'
import { SecurityListField } from './SecurityListField'

const TOPICS: readonly NewsTopic[] = ['issuer', 'regulator', 'market']

interface NewsFormProps {
  /** The news item edited; null for a new one. */
  articleId: string | null
  onSaved: (article: NewsArticleDto) => void
}

/**
 * NEWS: the news of an issuer, a regulator or the market, entered by the Data admin (spec
 * section 5): headline, source, topic, country, securities and text. A new item reaches the
 * terminals at once (NewsPublished).
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
  const save = useSaveNews()
  const [headline, setHeadline] = useState(article?.headline ?? '')
  const [source, setSource] = useState(article?.source ?? '')
  const [topic, setTopic] = useState<NewsTopic>(article?.topic ?? 'issuer')
  const [country, setCountry] = useState(article?.country ?? '')
  const [securityIds, setSecurityIds] = useState<string[]>(article?.securityIds ?? [])
  const [text, setText] = useState(article?.body.join('\n\n') ?? '')
  const errors = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}

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
              headline: headline.trim(),
              source: source.trim().toUpperCase(),
              topic,
              country: country || null,
              securityIds,
              body: text
                .split(/\n\s*\n/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean),
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
      <Field label={t('content.headline')} error={errors.headline?.[0]}>
        <TextInput value={headline} onChange={setHeadline} highlight />
      </Field>
      <div className="grid grid-cols-[8rem_minmax(0,1fr)_10rem] gap-3">
        <Field label={t('content.source')} error={errors.source?.[0]}>
          <TextInput value={source} onChange={setSource} placeholder="SEMC" mono highlight />
        </Field>
        <Field label={t('content.topic')} group error={errors.topic?.[0]}>
          <SegmentedControl
            value={topic}
            options={TOPICS.map((value) => ({ value, label: t(`content.topics.${value}`) }))}
            onChange={setTopic}
          />
        </Field>
        <Field label={t('content.country')} error={errors.country?.[0]}>
          <Select
            value={country}
            options={[
              { value: '', label: t('content.allCountries') },
              ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
            ]}
            onChange={setCountry}
          />
        </Field>
      </div>
      <Field label={t('content.securities')} error={errors.securityIds?.[0]}>
        <SecurityListField value={securityIds} onChange={setSecurityIds} />
      </Field>
      <Field label={t('content.text')} hint={t('content.textHint')} error={errors.body?.[0]}>
        <Textarea value={text} onChange={setText} rows={8} highlight />
      </Field>
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
