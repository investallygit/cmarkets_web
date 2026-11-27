import { clsx } from 'clsx'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CALENDAR_EVENT_TYPES, CALENDAR_VIEWS, EVENT_TYPE_COLORS } from '@/entities/calendar-event'
import type { CalendarEventType } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES, cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import type { CalendarState, CalendarStateChange } from '../model/calendarState'

interface CalendarFiltersPanelProps {
  state: CalendarState
  onChange: (change: CalendarStateChange) => void
  onReset: () => void
  onExport: (format: 'ics' | 'xlsx') => void
  /** Per type, in the range shown; none while loading. */
  counts: Partial<Record<CalendarEventType, number>> | undefined
  /** False while the Admin keeps EODHD's international events off. */
  internationalShown: boolean
}

/**
 * CAL's filters (screen 32, sixth version): the nine types with their counts and colours, the
 * six states (all when none picked), the view, "only my securities", the export of the events
 * shown as ICS or XLSX (decision 57).
 */
export function CalendarFiltersPanel({
  state,
  onChange,
  onReset,
  onExport,
  counts,
  internationalShown,
}: CalendarFiltersPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const toggleType = (type: CalendarEventType, on: boolean) =>
    onChange({
      types: CALENDAR_EVENT_TYPES.filter((candidate) =>
        candidate === type ? on : state.types.includes(candidate),
      ),
    })
  const toggleCountry = (code: string) => {
    const current = state.countries.length === 0 ? [...CEMAC_COUNTRIES] : [...state.countries]
    const next = current.includes(code)
      ? current.filter((country) => country !== code)
      : [...current, code]
    // None, or all six, is every state.
    onChange({ countries: next.length === CEMAC_COUNTRIES.length || next.length === 0 ? [] : next })
  }
  const heading =
    'mb-1.5 font-mono text-title font-semibold tracking-title text-accent-amber uppercase'

  return (
    <Panel
      title={t('panels.calendarFilters')}
      code="CAL"
      options={
        <button type="button" onClick={onReset} className="panel-no-drag hover:text-primary">
          {t('calendar.filters.options')}
        </button>
      }
      bodyClassName="flex flex-col"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-3 py-2 font-sans text-data">
          <fieldset>
            <legend className={heading}>{t('calendar.filters.eventTypes')}</legend>
            <ul className="space-y-1">
              {CALENDAR_EVENT_TYPES.map((type) => {
                const off = type === 'international' && !internationalShown
                return (
                  <li key={type} className="flex items-center justify-between gap-2">
                    <Checkbox
                      checked={!off && state.types.includes(type)}
                      onChange={(on) => toggleType(type, on)}
                      label={t(`calendar.types.${type}`)}
                      color={EVENT_TYPE_COLORS[type]}
                      disabled={off}
                      title={off ? t('calendar.filters.internationalOff') : undefined}
                    />
                    <span
                      className="font-mono text-secondary tabular-nums"
                      aria-label={t('calendar.filters.countOf', { count: counts?.[type] ?? 0 })}
                    >
                      {counts ? format.number(counts[type] ?? 0, 0) : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
            {!internationalShown && (
              <p className="mt-1 text-title text-secondary">
                {t('calendar.filters.internationalOff')}
              </p>
            )}
          </fieldset>

          <div role="group" aria-label={t('calendar.filters.countries')}>
            <p className={heading}>{t('calendar.filters.countries')}</p>
            <div className="grid grid-cols-3 gap-1">
              {CEMAC_COUNTRIES.map((code) => {
                const pressed = state.countries.length === 0 || state.countries.includes(code)
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={pressed}
                    title={format.country(code)}
                    onClick={() => toggleCountry(code)}
                    className={clsx(
                      'min-h-6 border font-mono text-title font-semibold',
                      pressed
                        ? 'border-accent-amber bg-accent-amber/10 text-accent-amber'
                        : 'border-border text-secondary hover:text-primary',
                    )}
                  >
                    {cemacCode3(code)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className={heading} id="calendar-view-label">
              {t('calendar.filters.view')}
            </p>
            <SegmentedControl
              aria-label={t('calendar.filters.view')}
              value={state.view}
              options={CALENDAR_VIEWS.map((view) => ({
                value: view,
                label: t(`calendar.filters.views.${view}`),
              }))}
              onChange={(view) => onChange({ view })}
            />
          </div>

          <Checkbox
            checked={state.mine}
            onChange={(mine) => onChange({ mine })}
            label={t('calendar.filters.mine')}
          />
        </div>
      </ScrollArea>
      <div className="flex shrink-0 items-center gap-3 border-t px-3 py-1.5 font-sans text-data text-info">
        <Download aria-hidden className="size-3.5" />
        <span>{t('calendar.filters.export')}</span>
        {(['ics', 'xlsx'] as const).map((exportFormat) => (
          <button
            key={exportFormat}
            type="button"
            onClick={() => onExport(exportFormat)}
            aria-label={t('calendar.filters.exportLabel', { format: exportFormat.toUpperCase() })}
            className="min-h-6 hover:text-primary hover:underline"
          >
            {t(
              exportFormat === 'ics' ? 'calendar.filters.exportIcs' : 'calendar.filters.exportXlsx',
            )}
          </button>
        ))}
      </div>
    </Panel>
  )
}
