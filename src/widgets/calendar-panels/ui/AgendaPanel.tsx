import type { UseQueryResult } from '@tanstack/react-query'
import { clsx } from 'clsx'
import { BellPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { EventTypeBadge, groupByDay, useCalendarWords } from '@/entities/calendar-event'
import type { CalendarDto, CalendarEventDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { linkOf } from '../lib/links'

interface AgendaPanelProps {
  query: UseQueryResult<CalendarDto>
  today: string
  range: { from: string; to: string }
  selectedId: string | null
  onSelect: (event: CalendarEventDto) => void
  /** None where the user may not set alerts (an SVT's account): no bell. */
  onAlert?: (event: CalendarEventDto) => void
  onStep: (step: 1 | -1) => void
  onToday: () => void
}

/**
 * CAL's agenda (screen 32, sixth version): the events grouped by day in Douala time, each with its
 * time, its type's colour, its state, the event and the detail that matters (the amount offered,
 * the rate, the dividend, the previous figure); the BVMAC's closed days noted on their day. A click
 * shows the detail, a double click (or Enter twice) opens the linked screen, the bell an alert.
 */
export function AgendaPanel({
  query,
  today,
  range,
  selectedId,
  onSelect,
  onAlert,
  onStep,
  onToday,
}: AgendaPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const words = useCalendarWords()
  const count = query.data?.events.length ?? 0
  const open = (event: CalendarEventDto) => {
    const link = linkOf(event)
    if (link) void navigate(link.path)
  }

  return (
    <Panel
      title={t('panels.calendarAgenda')}
      code="CAL"
      options={t('calendar.agenda.options', { count })}
      bodyClassName="flex flex-col"
    >
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1 font-sans text-data">
        <button
          type="button"
          onClick={() => onStep(-1)}
          aria-label={t('calendar.agenda.previous')}
          className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="min-h-6 border px-2 text-secondary hover:text-primary"
        >
          {t('calendar.agenda.today')}
        </button>
        <button
          type="button"
          onClick={() => onStep(1)}
          aria-label={t('calendar.agenda.next')}
          className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
        >
          <ChevronRight aria-hidden className="size-4" />
        </button>
        <span className="text-secondary">
          {range.from === range.to
            ? format.isoDate(range.from)
            : t('calendar.agenda.range', {
                from: format.isoDate(range.from),
                to: format.isoDate(range.to),
              })}
        </span>
      </div>
      <QueryView
        query={query}
        isEmpty={(data) => data.events.length === 0 && data.notes.length === 0}
        emptyMessage={t('calendar.agenda.empty')}
      >
        {(data) => (
          <ScrollArea className="min-h-0 flex-1">
            {groupByDay(data.events, data.notes).map((day) => (
              <section key={day.date} aria-labelledby={`agenda-${day.date}`}>
                <h3
                  id={`agenda-${day.date}`}
                  className="sticky top-0 z-10 bg-panel-header px-3 py-1 font-mono text-title font-semibold tracking-title uppercase"
                >
                  {`${format.weekday(day.date, 'long')} ${format.isoDate(day.date)}`}
                  {day.date === today && (
                    <span className="text-accent-amber"> — {t('calendar.agenda.todayMark')}</span>
                  )}
                </h3>
                {day.notes.map((note) => (
                  <p
                    key={note.text}
                    className={clsx(
                      'px-3 py-1 font-sans text-data',
                      note.closed ? 'text-down' : 'text-warning',
                    )}
                  >
                    {note.text}
                  </p>
                ))}
                <ul>
                  {day.events.map((event) => {
                    const title = words.title(event)
                    const selected = event.id === selectedId
                    return (
                      <li
                        key={event.id}
                        className={clsx(
                          'flex items-center border-b border-border/50',
                          selected ? 'bg-selected' : 'hover:bg-row-alt',
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => (selected ? open(event) : onSelect(event))}
                          onDoubleClick={() => open(event)}
                          className="grid min-h-8 min-w-0 flex-1 grid-cols-[3.5rem_7rem_3.5rem_minmax(0,1fr)_minmax(0,auto)] items-center gap-2 px-3 text-left font-sans text-data"
                        >
                          <span className="font-mono text-secondary">
                            {event.time ?? t('calendar.agenda.wholeDay')}
                          </span>
                          <EventTypeBadge type={event.type} />
                          <span className="font-mono text-secondary">
                            {event.country ? cemacCode3(event.country) : 'CEMAC'}
                          </span>
                          <span className="truncate text-primary">{title}</span>
                          <span className="truncate text-right text-secondary">
                            {words.detail(event)}
                          </span>
                        </button>
                        {onAlert && (
                          <button
                            type="button"
                            onClick={() => onAlert(event)}
                            aria-label={t('calendar.agenda.alert', { event: title })}
                            className="mr-2 inline-flex size-6 shrink-0 items-center justify-center text-secondary hover:text-accent-amber"
                          >
                            <BellPlus aria-hidden className="size-3.5" />
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </ScrollArea>
        )}
      </QueryView>
      <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
        {t('calendar.agenda.note')}
      </p>
    </Panel>
  )
}
