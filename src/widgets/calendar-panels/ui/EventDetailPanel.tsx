import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { EVENT_TYPE_COLORS, useCalendarEvent, useCalendarWords } from '@/entities/calendar-event'
import type { CalendarEventDetailDto, CalendarEventDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { linkOf } from '../lib/links'

interface EventDetailPanelProps {
  eventId: string | null
  today: string
  /** None where the user may not set alerts (an SVT's account): the button is left out. */
  onAlert?: (event: CalendarEventDto) => void
  onIcs: (event: CalendarEventDto) => void
}

const BILLION = 1_000_000_000

type DetailRow =
  | 'issuer'
  | 'security'
  | 'valueDate'
  | 'maturity'
  | 'offered'
  | 'averageRate'
  | 'marginalRate'
  | 'cover'
  | 'bidders'
  | 'previous'
  | 'previousCover'
  | 'exDate'
  | 'paymentDate'
  | 'amount'
  | 'policyRate'
  | 'detail'
  | 'source'

/**
 * The event picked (screen 32, sixth version): its day and time, what the agenda shows and what
 * its detail adds (the issuer, the security, the value date, the previous comparable auction, a
 * result's marginal rate, a dividend's two dates, the source); create an alert on it, add it to
 * one's calendar (ICS), open its screen (AUC, the profile, BEAC). API /calendar/{id}.
 */
export function EventDetailPanel({ eventId, today, onAlert, onIcs }: EventDetailPanelProps) {
  const { t } = useTranslation()
  const detail = useCalendarEvent(eventId)
  return (
    <Panel title={t('panels.calendarEvent')} code="CAL" bodyClassName="flex flex-col">
      {eventId === null ? (
        <p className="px-3 py-2 font-sans text-data text-secondary">{t('calendar.detail.pick')}</p>
      ) : (
        <QueryView query={detail}>
          {(data) => <Detail data={data} today={today} onAlert={onAlert} onIcs={onIcs} />}
        </QueryView>
      )}
    </Panel>
  )
}

function Detail({
  data,
  today,
  onAlert,
  onIcs,
}: {
  data: CalendarEventDetailDto
  today: string
  onAlert?: (event: CalendarEventDto) => void
  onIcs: (event: CalendarEventDto) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const words = useCalendarWords()
  const { event } = data
  const facts = event.facts
  const link = linkOf(event)
  const percent = (value: number) => format.percent(value, 2, false)
  const rows: [string, ReactNode][] = []
  const add = (key: DetailRow, value: ReactNode | null | undefined) => {
    if (value !== null && value !== undefined && value !== '')
      rows.push([t(`calendar.detail.rows.${key}`), value])
  }
  add('issuer', data.issuer)
  add('security', data.securityName ?? words.title(event))
  add('valueDate', facts.valueDate && format.isoDate(facts.valueDate))
  add('maturity', facts.maturity && format.isoDate(facts.maturity))
  add(
    'offered',
    facts.offered !== null ? `XAF ${format.number(facts.offered / 1_000_000, 0)} M` : null,
  )
  add('averageRate', facts.averageRate !== null ? percent(facts.averageRate) : null)
  add('marginalRate', data.marginalRate !== null ? percent(data.marginalRate) : null)
  add('cover', facts.coverPct !== null ? format.percent(facts.coverPct, 0, false) : null)
  add('bidders', data.bidders)
  add(
    'previous',
    data.previous &&
      `${format.isoDate(data.previous.date)} · ${percent(data.previous.averageRate)}`,
  )
  add('previousCover', data.previous && format.percent(data.previous.coverPct, 0, false))
  add('exDate', data.exDate && format.isoDate(data.exDate))
  add('paymentDate', data.paymentDate && format.isoDate(data.paymentDate))
  add(
    'amount',
    facts.amount !== null && event.type === 'dividend'
      ? `${facts.currency ?? 'XAF'} ${format.number(facts.amount, 0)}`
      : facts.amount !== null
        ? `${format.number(facts.amount / BILLION, 1)} bn`
        : null,
  )
  add('policyRate', facts.policyRate !== null ? percent(facts.policyRate) : null)
  add('detail', facts.note)
  add('source', t(`calendar.detail.sources.${data.source}`))
  const when = event.time ?? t('calendar.agenda.wholeDay')
  const color = EVENT_TYPE_COLORS[event.type]

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-2 px-3 py-2 font-sans text-data">
        <h3
          className="font-mono text-title font-semibold tracking-title uppercase"
          style={{ color }}
        >
          {`${t(`calendar.badges.${event.type}`)} · ${event.country ? cemacCode3(event.country) : 'CEMAC'} ${words.title(event)}`}
        </h3>
        <div className="flex flex-wrap gap-2 font-mono text-title font-semibold uppercase">
          <span className="border border-accent-amber px-2 py-0.5 text-accent-amber">
            {event.date === today
              ? t('calendar.detail.today', { time: when })
              : t('calendar.detail.on', { date: format.isoDate(event.date), time: when })}
          </span>
          {event.type === 'auction' && (
            <span className="border px-2 py-0.5 text-secondary">
              {t('calendar.detail.resultsAround')}
            </span>
          )}
          {event.announced && (
            <span className="border border-warning px-2 py-0.5 text-warning">
              {t('calendar.detail.announced')}
            </span>
          )}
        </div>
        <dl>
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-border/50 py-1">
              <dt className="text-secondary">{label}</dt>
              <dd className="text-right text-primary">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1.5 pt-1">
          {onAlert && (
            <button
              type="button"
              onClick={() => onAlert(event)}
              className="min-h-7 border border-accent-amber text-accent-amber hover:bg-accent-amber/10"
            >
              {t('calendar.detail.createAlert')}
            </button>
          )}
          <button
            type="button"
            onClick={() => onIcs(event)}
            className="min-h-7 border border-info text-info hover:bg-info/10"
          >
            {t('calendar.detail.addIcs')}
          </button>
          {link && (
            <button
              type="button"
              onClick={() => void navigate(link.path)}
              className="min-h-7 border border-info text-info hover:bg-info/10"
            >
              {t(`calendar.detail.open.${link.kind}`)}
            </button>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
