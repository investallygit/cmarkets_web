import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { EventTypeBadge, useCalendarWords, useUpcomingEvents } from '@/entities/calendar-event'
import type { CalendarEventDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { auctionsPath, routes, securityPath } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<CalendarEventDto>()
const getEventId = (event: CalendarEventDto) => event.id

/** The screen an event opens: its auctions, its security, BEAC. */
function pathOf(event: CalendarEventDto): string | null {
  if (event.type === 'auction' || event.type === 'result')
    return auctionsPath(event.country ?? undefined)
  if (event.type === 'beac' || event.type === 'statistic') return routes.beac
  return event.securityId ? securityPath(event.securityId) : null
}

/**
 * Screen 1, Market calendar: the next 7 days of CAL's events (screen 32, sixth version), the
 * international ones aside; a double-click opens the auctions, the security or BEAC. API /calendar.
 */
export function CalendarPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const words = useCalendarWords()
  const events = useUpcomingEvents()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('columns.date'),
          meta: { width: '96px' },
          cell: ({ row }) =>
            `${format.dayMonth(row.original.date)}${row.original.time ? ` ${row.original.time}` : ''}`,
        }),
        helper.accessor('type', {
          header: t('columns.type'),
          meta: { width: '120px' },
          cell: ({ row }) => <EventTypeBadge type={row.original.type} />,
        }),
        helper.accessor((event) => (event.country ? cemacCode3(event.country) : 'CEMAC'), {
          id: 'country',
          header: t('columns.country'),
          meta: { width: '64px' },
        }),
        helper.accessor((event) => words.title(event), { id: 'title', header: t('columns.event') }),
      ]),
    [t, format, words],
  )

  return (
    <Panel title={t('panels.calendar')} code="CAL" options={<span>{t('market.next7Days')}</span>}>
      <QueryView query={events}>
        {(data) => (
          <DataTable
            data={data.events.filter((event) => event.type !== 'international')}
            columns={columns}
            getRowId={getEventId}
            onRowDoubleClick={(event) => {
              const path = pathOf(event)
              if (path) void navigate(path)
            }}
            exportName="calendar"
          />
        )}
      </QueryView>
    </Panel>
  )
}
