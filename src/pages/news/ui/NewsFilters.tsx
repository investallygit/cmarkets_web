import { useTranslation } from 'react-i18next'
import { SecurityPicker, useSecurityProfile } from '@/entities/security'
import type { NewsTopic } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Select } from '@/shared/ui/form/Select'

/** Named as their URL parameters: ?security=SEMC&country=CM&topic=issuer. */
export interface NewsFilterValues {
  security: string
  country: string
  topic: '' | NewsTopic
}

const TOPICS = ['', 'issuer', 'regulator', 'market'] as const

interface NewsFiltersProps {
  values: NewsFilterValues
  onChange: (patch: Partial<NewsFilterValues>) => void
}

/** Issuer, country and topic filters of the news feed (spec section 5). */
export function NewsFilters({ values, onChange }: NewsFiltersProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const security = useSecurityProfile(values.security || undefined).data

  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2 border-b p-2">
      <SecurityPicker
        value={values.security ? (security?.code ?? values.security) : null}
        onSelect={(picked) => onChange({ security: picked.id })}
        onClear={() => onChange({ security: '' })}
        placeholder={t('news.security')}
        aria-label={t('news.security')}
        highlight={Boolean(values.security)}
      />
      <Select
        value={values.country}
        options={[
          { value: '', label: t('news.allCountries') },
          ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
        ]}
        onChange={(country) => onChange({ country })}
        aria-label={t('news.country')}
        highlight={Boolean(values.country)}
      />
      <Select
        value={values.topic}
        options={TOPICS.map((topic) => ({
          value: topic,
          label: t(`news.topics.${topic || 'all'}`),
        }))}
        onChange={(topic) => onChange({ topic })}
        aria-label={t('news.topic')}
        highlight={Boolean(values.topic)}
      />
    </div>
  )
}
