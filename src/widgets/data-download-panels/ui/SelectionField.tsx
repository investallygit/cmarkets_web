import { useTranslation } from 'react-i18next'
import { SELECTION_KEY, selectionOf, withSelection } from '@/entities/data-export'
import { SecurityListField } from '@/entities/security'
import { useWatchlists } from '@/entities/watchlist'
import type { ExportDatasetDto, ExportSettingsDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { Field } from '@/shared/ui/form/Field'
import { MultiSelect } from '@/shared/ui/form/MultiSelect'
import { Select } from '@/shared/ui/form/Select'

/** The most items a file takes (the API's limit). */
const MAX_ITEMS = 100

interface SelectionFieldProps {
  dataset: ExportDatasetDto
  settings: ExportSettingsDto
  onChange: (settings: ExportSettingsDto) => void
}

/**
 * The selection of DL's settings (spec section 9, screen 30): securities searched one by one or a
 * watchlist's at once, as the mockup's "SEMC · BANGE · IWDA + Add · watchlist"; the countries and
 * tenors of the curves; the currencies, series or indices of the catalogue.
 */
export function SelectionField({ dataset, settings, onChange }: SelectionFieldProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const key = SELECTION_KEY[dataset.dataset]
  const items = selectionOf(settings)
  if (dataset.dataset === 'rfq')
    return <RfqFilters dataset={dataset} settings={settings} onChange={onChange} />
  if (!key) return null

  const label = t(`downloads.selection.${key}`, { count: items.length })
  if (key === 'securities')
    return (
      <Field label={label} group>
        <div className="grid gap-2 sm:grid-cols-[1fr_14rem] sm:items-end">
          <SecurityListField
            value={items}
            onChange={(securities) => onChange(withSelection(settings, securities))}
            addLabel={t('downloads.selection.add')}
            removeLabel={(code) => t('downloads.selection.remove', { code })}
            max={MAX_ITEMS}
          />
          <WatchlistAdd
            onAdd={(securities) =>
              onChange(
                withSelection(
                  settings,
                  [...new Set([...items, ...securities])].slice(0, MAX_ITEMS),
                ),
              )
            }
          />
        </div>
      </Field>
    )

  const options = (dataset.choices ?? []).map((choice) => ({
    value: choice.code,
    label:
      choice.code === choice.nameEn
        ? choice.code
        : `${choice.code} · ${locale === 'fr' ? choice.nameFr : choice.nameEn}`,
  }))
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={label}>
        <MultiSelect
          values={items}
          options={options}
          onChange={(values) => onChange(withSelection(settings, values))}
          placeholder="—"
        />
      </Field>
      {dataset.tenors && (
        <Field label={t('downloads.selection.tenors')}>
          <MultiSelect
            values={settings.tenors ?? []}
            options={dataset.tenors.map((tenor) => ({ value: tenor, label: tenor }))}
            onChange={(tenors) => onChange({ ...settings, tenors })}
            placeholder={t('downloads.selection.allTenors')}
          />
        </Field>
      )}
    </div>
  )
}

/** "Add a watchlist": its securities join the selection. */
function WatchlistAdd({ onAdd }: { onAdd: (securityIds: string[]) => void }) {
  const { t } = useTranslation()
  const watchlists = useWatchlists().data ?? []
  if (watchlists.length === 0) return null
  return (
    <Select
      aria-label={t('downloads.selection.watchlist')}
      value=""
      options={[
        { value: '', label: t('downloads.selection.watchlist') },
        ...watchlists.map((list) => ({ value: list.id, label: `${list.code} · ${list.name}` })),
      ]}
      onChange={(id: string) => {
        const list = watchlists.find((candidate) => candidate.id === id)
        if (list) onAdd(list.items.map((item) => item.securityId))
      }}
      className="w-full"
    />
  )
}

/** The RFQ's agreements: their statuses and the user's role in them (spec, screen 30: "Period, status, role"). */
function RfqFilters({ dataset, settings, onChange }: SelectionFieldProps) {
  const { t } = useTranslation()
  const known = new Set(['awaitingSvt', 'concluded', 'rejected', 'expired', 'cancelled'])
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t('downloads.statuses')}>
        <MultiSelect
          values={settings.statuses ?? []}
          options={(dataset.statuses ?? []).map((status) => ({
            value: status,
            label: known.has(status) ? t(`downloads.rfqStatuses.${status as 'concluded'}`) : status,
          }))}
          onChange={(statuses) => onChange({ ...settings, statuses })}
          placeholder={t('downloads.allStatuses')}
        />
      </Field>
      <Field label={t('downloads.role')}>
        <Select<'all' | 'requester' | 'responder'>
          value={settings.role ?? 'all'}
          options={(['all', 'requester', 'responder'] as const).map((value) => ({
            value,
            label: t(`downloads.roles.${value}`),
          }))}
          onChange={(role) => onChange({ ...settings, role: role === 'all' ? undefined : role })}
        />
      </Field>
    </div>
  )
}
