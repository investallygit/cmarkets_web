import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDirectoryFacets, useSpecialties } from '@/entities/profile'
import {
  CLIENT_ACCOUNT_TYPES,
  type ClientAccountType,
  type DirectoryQuery,
  type FacetCountDto,
} from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'
import { useFormat, useLocale } from '@/shared/i18n'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'

/** The search runs once the user stops typing for this long. */
const SEARCH_DELAY_MS = 300

interface DirectoryFiltersPanelProps {
  query: DirectoryQuery
  onChange: (patch: Partial<DirectoryQuery>) => void
}

/** A filter is set, which RESET clears; the order stays. */
const isFiltered = (query: DirectoryQuery) =>
  Boolean(
    query.q ||
    query.types?.length ||
    query.country ||
    query.specialty ||
    query.org ||
    query.language ||
    query.contactable ||
    query.recent,
  )

/**
 * NET, left (spec section 9, screen 10): the text, the six types with their counts, country,
 * specialty, organisation and language, "Only profiles I can contact". The counts are those of
 * the whole directory (GET /directory/facets); the filters live in the URL.
 */
export function DirectoryFiltersPanel({ query, onChange }: DirectoryFiltersPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const facets = useDirectoryFacets().data
  const specialties = useSpecialties().data ?? []
  const [text, setText] = useState(query.q ?? '')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const types = new Set(query.types ?? [])

  /** The values of a facet with their counts, by name; the one chosen stays, counted or not. */
  const options = (
    counts: readonly FacetCountDto[] | undefined,
    chosen: string | undefined,
    all: string,
    name: (value: string) => string,
  ) => {
    const values = [...(counts ?? [])]
    if (chosen && !values.some((count) => count.value === chosen)) {
      values.push({ value: chosen, count: 0 })
    }
    return [
      { value: '', label: all },
      ...values
        .map(({ value, count }) => ({
          value,
          label: t('network.directory.optionCount', {
            label: name(value),
            count: format.number(count, 0),
          }),
          name: name(value),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, locale))
        .map(({ value, label }) => ({ value, label })),
    ]
  }
  const specialtyName = (id: string) =>
    specialties.find((specialty) => specialty.id === id)?.name[locale] ?? id
  const toggle = (type: ClientAccountType, checked: boolean) =>
    onChange({
      types: CLIENT_ACCOUNT_TYPES.filter((candidate) =>
        candidate === type ? checked : types.has(candidate),
      ),
    })

  return (
    <Panel
      title={t('panels.filters')}
      code="NET"
      options={
        <button
          type="button"
          disabled={!isFiltered(query)}
          onClick={() => {
            window.clearTimeout(timer.current)
            setText('')
            onChange({
              q: undefined,
              types: [],
              country: undefined,
              specialty: undefined,
              org: undefined,
              language: undefined,
              contactable: false,
              recent: false,
            })
          }}
          className="panel-no-drag uppercase hover:text-primary disabled:opacity-40"
        >
          {t('network.directory.reset')}
        </button>
      }
    >
      <div className="flex min-h-full flex-col gap-4 p-3">
        <TextInput
          type="search"
          icon={Search}
          value={text}
          onChange={(next) => {
            setText(next)
            window.clearTimeout(timer.current)
            timer.current = window.setTimeout(
              () => onChange({ q: next.trim() || undefined }),
              SEARCH_DELAY_MS,
            )
          }}
          placeholder={t('network.directory.search')}
          aria-label={t('network.directory.search')}
          highlight={Boolean(query.q)}
        />

        <fieldset className="flex flex-col gap-0.5">
          <legend className="mb-1.5 font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
            {t('network.directory.types')}
          </legend>
          {CLIENT_ACCOUNT_TYPES.map((type) => (
            <Checkbox
              key={type}
              checked={types.has(type)}
              onChange={(checked) => toggle(type, checked)}
              color={ACCOUNT_TYPE_COLORS[type]}
              className="h-6.5 w-full"
              label={
                <span className="flex flex-1 items-center justify-between gap-2 text-label">
                  <span>{t(`accountBadge.${type}`)}</span>
                  <span className="font-mono text-data text-secondary">
                    {facets ? format.number(facets.types[type], 0) : ''}
                  </span>
                </span>
              }
            />
          ))}
        </fieldset>

        <div className="flex flex-col gap-3">
          <Field label={t('network.directory.country')}>
            <Select
              value={query.country ?? ''}
              options={options(
                facets?.countries,
                query.country,
                t('network.directory.allCountries'),
                (code) => format.country(code),
              )}
              onChange={(country) => onChange({ country: country || undefined })}
              highlight={Boolean(query.country)}
            />
          </Field>
          <Field label={t('network.directory.specialty')}>
            <Select
              value={query.specialty ?? ''}
              options={options(
                facets?.specialties,
                query.specialty,
                t('network.directory.allSpecialties'),
                specialtyName,
              )}
              onChange={(specialty) => onChange({ specialty: specialty || undefined })}
              highlight={Boolean(query.specialty)}
            />
          </Field>
          <Field label={t('network.directory.organization')}>
            <Select
              value={query.org ?? ''}
              options={options(
                facets?.organizations,
                query.org,
                t('network.directory.allOrganizations'),
                (name) => name,
              )}
              onChange={(org) => onChange({ org: org || undefined })}
              highlight={Boolean(query.org)}
            />
          </Field>
          <Field label={t('network.directory.language')}>
            <Select
              value={query.language ?? ''}
              options={options(
                facets?.languages,
                query.language,
                t('network.directory.allLanguages'),
                (code) => format.language(code),
              )}
              onChange={(language) => onChange({ language: language || undefined })}
              highlight={Boolean(query.language)}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <Checkbox
            checked={Boolean(query.contactable)}
            onChange={(contactable) => onChange({ contactable })}
            label={t('network.directory.contactable')}
          />
          <Checkbox
            checked={Boolean(query.recent)}
            onChange={(recent) => onChange({ recent })}
            label={t('network.directory.recent')}
          />
        </div>

        <p className="mt-auto font-sans text-title text-secondary">
          {t('network.directory.listNote')}
        </p>
      </div>
    </Panel>
  )
}
