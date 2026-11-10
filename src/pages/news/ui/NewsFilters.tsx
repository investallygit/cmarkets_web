import { useTranslation } from 'react-i18next'
import { useNewsSources } from '@/entities/news'
import { SecurityPicker, useSecurityProfile } from '@/entities/security'
import {
  NEWS_CATEGORIES,
  NEWS_TYPES,
  type NewsCategory,
  type NewsType,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Select } from '@/shared/ui/form/Select'

/** Named as their URL parameters: ?security=SEMC&country=CM&category=issuers&type=flash&source={id}. */
export interface NewsFilterValues {
  security: string
  country: string
  category: '' | NewsCategory
  type: '' | NewsType
  source: string
}

interface NewsFiltersProps {
  values: NewsFilterValues
  onChange: (patch: Partial<NewsFilterValues>) => void
}

/**
 * The filters of the news feed (spec sections 5 and 16): security, country, category, type and
 * newspaper; a click on an item's tag sets the last two.
 */
export function NewsFilters({ values, onChange }: NewsFiltersProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const security = useSecurityProfile(values.security || undefined).data
  const sources = useNewsSources().data ?? []
  // A newspaper named by the address before the list arrives, or one that no longer publishes.
  const sourceKnown = !values.source || sources.some((source) => source.id === values.source)

  return (
    <div className="grid shrink-0 grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2 border-b p-2">
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
        value={values.category}
        options={[
          { value: '' as const, label: t('news.categories.all') },
          ...NEWS_CATEGORIES.map((category) => ({
            value: category,
            label: t(`news.categories.${category}`),
          })),
        ]}
        onChange={(category) => onChange({ category })}
        aria-label={t('news.category')}
        highlight={Boolean(values.category)}
      />
      <Select
        value={values.type}
        options={[
          { value: '' as const, label: t('news.typeFilter.all') },
          ...NEWS_TYPES.map((type) => ({ value: type, label: t(`news.typeFilter.${type}`) })),
        ]}
        onChange={(type) => onChange({ type })}
        aria-label={t('news.type')}
        highlight={Boolean(values.type)}
      />
      <Select
        value={values.source}
        options={[
          { value: '', label: t('news.allSources') },
          ...(sourceKnown ? [] : [{ value: values.source, label: t('news.thisSource') }]),
          ...sources.map((source) => ({
            value: source.id,
            label: `${source.shortName} · ${t(`news.channels.${source.channel}`)}`,
          })),
        ]}
        onChange={(source) => onChange({ source })}
        aria-label={t('news.source')}
        highlight={Boolean(values.source)}
      />
    </div>
  )
}
