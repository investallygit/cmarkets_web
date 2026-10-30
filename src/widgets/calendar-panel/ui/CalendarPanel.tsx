import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpcomingEvents } from '@/entities/calendar-event'
import type { CalendarEventDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const helper = createDataColumnHelper<CalendarEventDto>()
const getEventId = (event: CalendarEventDto) => event.id

/** Screen 1, Market calendar: the next 7 days. API /calendar. */
export function CalendarPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const events = useUpcomingEvents()

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('date', {
          header: t('columns.date'),
          meta: { width: '96px' },
          cell: ({ row }) => format.dayMonth(row.original.date),
        }),
        helper.accessor('type', {
          header: t('columns.type'),
          meta: { width: '160px' },
          cell: ({ row }) => (
            <span className="text-info">{t(`market.eventTypes.${row.original.type}`)}</span>
          ),
        }),
        helper.accessor('title', { header: t('columns.event') }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.calendar')} code="CAL" options={<span>{t('market.next7Days')}</span>}>
      <QueryView query={events}>
        {(data) => (
          <DataTable data={data} columns={columns} getRowId={getEventId} exportName="calendar" />
        )}
      </QueryView>
    </Panel>
  )
}
