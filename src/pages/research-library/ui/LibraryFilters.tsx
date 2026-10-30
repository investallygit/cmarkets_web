import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LIBRARY_SORTS, OUTLOOKS, RECOMMENDATIONS } from '@/entities/publication'
import { useSecurities } from '@/entities/security'
import type {
  LibrarySort,
  PublicationAccess,
  PublicationRating,
  SubjectType,
} from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'

/** The search runs once the user stops typing for this long. */
const SEARCH_DELAY_MS = 300

/** Named as their URL parameters: ?subject=company&country=CM&sort=rating. */
export interface LibraryFilterValues {
  subject: '' | SubjectType
  country: string
  sector: string
  access: '' | PublicationAccess
  rating: '' | PublicationRating
  sort: LibrarySort
  q: string
}

interface LibraryFiltersProps {
  values: LibraryFilterValues
  onChange: (patch: Partial<LibraryFilterValues>) => void
}

/** Filter bar of screen 8: subject, country, sector, access, rating, sort and free text. */
export function LibraryFilters({ values, onChange }: LibraryFiltersProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const [text, setText] = useState(values.q)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const equities = useSecurities({ type: 'equity' })
  const sectors = [...new Set((equities.data ?? []).map((security) => security.sector))].sort()
  const all = t('library.filters.all')

  return (
    <div className="grid grid-cols-2 gap-2 border bg-panel p-2 md:grid-cols-4 xl:grid-cols-[repeat(6,minmax(0,1fr))_minmax(0,1.6fr)] xl:items-end">
      <Field label={t('library.filters.subject')}>
        <Select
          value={values.subject}
          options={[
            { value: '' as const, label: all },
            { value: 'company' as const, label: t('library.filters.subjects.company') },
            { value: 'country' as const, label: t('library.filters.subjects.country') },
          ]}
          onChange={(subject) => onChange({ subject })}
          highlight={Boolean(values.subject)}
        />
      </Field>
      <Field label={t('library.filters.country')}>
        <Select
          value={values.country}
          options={[
            { value: '', label: all },
            ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
          ]}
          onChange={(country) => onChange({ country })}
          highlight={Boolean(values.country)}
        />
      </Field>
      <Field label={t('library.filters.sector')}>
        <Select
          value={values.sector}
          options={[
            { value: '', label: all },
            ...sectors.map((sector) => ({ value: sector, label: sector })),
          ]}
          onChange={(sector) => onChange({ sector })}
          highlight={Boolean(values.sector)}
        />
      </Field>
      <Field label={t('library.filters.access')}>
        <Select
          value={values.access}
          options={[
            { value: '' as const, label: all },
            { value: 'free' as const, label: t('library.filters.accesses.free') },
            { value: 'paid' as const, label: t('library.filters.accesses.paid') },
          ]}
          onChange={(access) => onChange({ access })}
          highlight={Boolean(values.access)}
        />
      </Field>
      <Field label={t('library.filters.rating')}>
        <Select
          value={values.rating}
          options={[
            { value: '' as const, label: all },
            ...[...RECOMMENDATIONS, ...OUTLOOKS].map((rating) => ({
              value: rating,
              label: t(`publication.ratings.${rating}`),
            })),
          ]}
          onChange={(rating) => onChange({ rating })}
          highlight={Boolean(values.rating)}
        />
      </Field>
      <Field label={t('library.filters.sort')}>
        <Select
          value={values.sort}
          options={LIBRARY_SORTS.map((sort) => ({
            value: sort,
            label: t(`library.filters.sorts.${sort}`),
          }))}
          onChange={(sort) => onChange({ sort })}
        />
      </Field>
      <TextInput
        type="search"
        icon={Search}
        value={text}
        onChange={(next) => {
          setText(next)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => onChange({ q: next.trim() }), SEARCH_DELAY_MS)
        }}
        placeholder={t('library.filters.search')}
        aria-label={t('library.filters.search')}
        highlight={Boolean(values.q)}
        className="col-span-2 md:col-span-4 xl:col-span-1"
      />
    </div>
  )
}
