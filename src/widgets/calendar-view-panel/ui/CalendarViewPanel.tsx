import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import {
  CALENDAR_EVENT_TYPES,
  EVENT_TYPE_TONES,
  useCalendarEvents,
} from '@/entities/calendar-event'
import type { CalendarEventDto, CalendarEventType } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { daysBetween, isWeekend } from '@/shared/lib/isoDate'
import { useNow } from '@/shared/lib/useNow'
import { securityPath } from '@/shared/routes/paths'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import {
  stepDate,
  visibleRange,
  type CalendarView,
  type CalendarViewChange,
  type CalendarViewState,
} from '../model/calendarView'

const TONE_BORDER: Record<BadgeTone, string> = {
  neutral: 'border-l-secondary',
  info: 'border-l-info',
  amber: 'border-l-accent-amber',
  warning: 'border-l-warning',
  up: 'border-l-up',
  down: 'border-l-down',
}

const TONE_DOT: Record<BadgeTone, string> = {
  neutral: 'bg-secondary',
  info: 'bg-info',
  amber: 'bg-accent-amber',
  warning: 'bg-warning',
  up: 'bg-up',
  down: 'bg-down',
}

const helper = createDataColumnHelper<CalendarEventDto>()
const getEventId = (event: CalendarEventDto) => event.id

interface CalendarViewPanelProps {
  state: CalendarViewState
  onChange: (change: CalendarViewChange) => void
}

/**
 * CAL screen: the day or the week of sessions, auctions, ex-dividend dates, bond redemptions,
 * general meetings and earnings releases, filtered by type and country (spec section 2). An event
 * on a security opens its profile. API /calendar?from=&to=&type=&country=.
 */
export function CalendarViewPanel({ state, onChange }: CalendarViewPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = toMarketDay(useNow(60_000))
  const { from, to } = visibleRange(state)
  const allTypes = state.types.length === CALENDAR_EVENT_TYPES.length
  const events = useCalendarEvents(
    {
      from,
      to,
      types: allTypes ? undefined : state.types,
      country: state.country || undefined,
    },
    { enabled: state.types.length > 0 },
  )

  const views = useMemo(
    () =>
      (['week', 'day'] as const).map((value) => ({
        value,
        label: t(`calendar.views.${value}`),
      })),
    [t],
  )
  const toggleType = (type: CalendarEventType) =>
    onChange(({ types }) => ({
      types: types.includes(type)
        ? types.filter((value) => value !== type)
        : CALENDAR_EVENT_TYPES.filter((value) => value === type || types.includes(value)),
    }))
  const rangeLabel =
    state.view === 'week'
      ? t('calendar.weekOf', { date: format.isoDate(from) })
      : `${format.weekday(from, 'long')} ${format.isoDate(from)}`

  return (
    <Panel
      title={t('panels.calendar')}
      code="CAL"
      options={
        <>
          <PanelTabs
            value={state.view}
            options={views}
            onChange={(view: CalendarView) => onChange({ view })}
          />
          <span className="panel-no-drag flex items-center gap-1">
            <button
              type="button"
              aria-label={t('calendar.previous')}
              onClick={() => onChange((current) => ({ date: stepDate(current, -1) }))}
              className="hover:text-primary"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ date: today })}
              className="uppercase hover:text-primary"
            >
              {t('calendar.today')}
            </button>
            <button
              type="button"
              aria-label={t('calendar.next')}
              onClick={() => onChange((current) => ({ date: stepDate(current, 1) }))}
              className="hover:text-primary"
            >
              <ChevronRight aria-hidden className="size-3.5" />
            </button>
          </span>
        </>
      }
      bodyClassName="flex flex-col"
    >
      <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-2 py-1">
        <span className="font-mono text-data font-semibold text-primary">{rangeLabel}</span>
        <div role="group" aria-label={t('calendar.types')} className="flex flex-wrap gap-1">
          {CALENDAR_EVENT_TYPES.map((type) => {
            const active = state.types.includes(type)
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => toggleType(type)}
                className={clsx(
                  'inline-flex h-6 items-center gap-1.5 border px-2 font-sans text-data',
                  active ? 'bg-selected text-primary' : 'text-secondary hover:text-primary',
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    'size-2 rounded-full',
                    active ? TONE_DOT[EVENT_TYPE_TONES[type]] : 'bg-secondary/40',
                  )}
                />
                {t(`market.eventTypes.${type}`)}
              </button>
            )
          })}
        </div>
        <Select
          value={state.country}
          options={[
            { value: '', label: t('calendar.allCountries') },
            ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
          ]}
          onChange={(country) => onChange({ country })}
          aria-label={t('calendar.country')}
          className="ml-auto w-44"
        />
      </div>
      <div className="min-h-0 flex-1">
        {state.types.length === 0 ? (
          <PanelEmpty message={t('calendar.noEvents')} />
        ) : (
          <QueryView query={events}>
            {(data) =>
              state.view === 'week' ? (
                <WeekGrid days={daysBetween(from, to)} events={data} today={today} />
              ) : (
                <DayTable day={from} events={data} />
              )
            }
          </QueryView>
        )}
      </div>
    </Panel>
  )
}

/** Seven columns, Monday to Sunday; today in amber, weekends without a session. */
function WeekGrid({
  days,
  events,
  today,
}: {
  days: string[]
  events: CalendarEventDto[]
  today: string
}) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <div className="h-full overflow-x-auto">
      <div className="grid h-full min-w-[640px] grid-cols-7 divide-x">
        {days.map((day) => {
          const dayEvents = events.filter((event) => event.date === day)
          const weekend = isWeekend(day)
          return (
            <section
              key={day}
              aria-label={`${format.weekday(day, 'long')} ${format.isoDate(day)}`}
              className={clsx('flex min-h-0 min-w-0 flex-col', weekend && 'bg-app/50')}
            >
              <header
                className={clsx(
                  'flex h-row shrink-0 items-center justify-between border-b px-2 font-mono text-data uppercase',
                  day === today ? 'bg-selected font-semibold text-accent-amber' : 'text-secondary',
                )}
              >
                <span>{format.weekday(day)}</span>
                <span>{format.dayMonth(day)}</span>
              </header>
              <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1">
                {dayEvents.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
                {weekend && dayEvents.length === 0 && (
                  <li className="px-1 font-sans text-title text-secondary">
                    {t('calendar.noSession')}
                  </li>
                )}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function EventCard({ event }: { event: CalendarEventDto }) {
  const { t } = useTranslation()
  const tone = EVENT_TYPE_TONES[event.type]
  const content = (
    <>
      <span className="block font-sans text-caption text-secondary uppercase">
        {t(`market.eventTypes.${event.type}`)}
      </span>
      <span className="line-clamp-2 font-sans text-data">{event.title}</span>
    </>
  )
  const className = clsx(
    'block border border-l-2 bg-panel-header/60 px-1.5 py-1 text-left',
    TONE_BORDER[tone],
  )
  return event.securityId ? (
    <Link
      to={securityPath(event.securityId)}
      title={event.title}
      className={clsx(className, 'hover:bg-selected')}
    >
      {content}
    </Link>
  ) : (
    <div title={event.title} className={className}>
      {content}
    </div>
  )
}

/** The events of one day as a table, which sorts and exports like the others. */
function DayTable({ day, events }: { day: string; events: CalendarEventDto[] }) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((event) => t(`market.eventTypes.${event.type}`), {
          id: 'type',
          header: t('columns.type'),
          meta: { width: '140px' },
          cell: ({ row, getValue }) => (
            <Badge tone={EVENT_TYPE_TONES[row.original.type]}>{getValue()}</Badge>
          ),
        }),
        helper.accessor('title', { header: t('columns.event'), meta: { width: '3fr' } }),
        helper.accessor((event) => (event.country ? format.country(event.country) : ''), {
          id: 'country',
          header: t('columns.country'),
        }),
        helper.accessor((event) => event.securityId ?? '', {
          id: 'security',
          header: t('columns.security'),
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
      ]),
    [t, format],
  )
  return (
    <DataTable
      data={events}
      columns={columns}
      getRowId={getEventId}
      onRowDoubleClick={(event) => {
        if (event.securityId) void navigate(securityPath(event.securityId))
      }}
      exportName={`calendar-${day}`}
      emptyMessage={isWeekend(day) ? t('calendar.noSession') : t('calendar.noEvents')}
    />
  )
}
