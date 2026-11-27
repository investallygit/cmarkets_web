import { openAlertDialog } from '@/entities/alert'
import { rangeOf, stepOf, useCalendar } from '@/entities/calendar-event'
import { useHasPermission } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { CalendarEventDto, CalendarEventType } from '@/shared/api/contracts'
import { contentApi } from '@/shared/api/endpoints'
import { saveBlob } from '@/shared/lib/download'
import { toMarketDay } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'
import { useSearchParamsUpdate } from '@/shared/routes/useSearchParamsUpdate'
import { toast } from '@/shared/ui/toast'
import {
  AgendaPanel,
  CalendarAlertsPanel,
  CalendarFiltersPanel,
  EventDetailPanel,
  type CalendarStateChange,
} from '@/widgets/calendar-panels'
import { MARKET_CALENDAR_LAYOUT } from '../config/layout'
import { readCalendarParams, writeCalendarParams } from '../model/calendarParams'

/**
 * CAL, the event calendar (screen 32, sixth version; ROADMAP step 67, decision 57): the filters
 * with their counts, the agenda by day in Douala time, the event picked with its alert, its ICS
 * and its screen, and the user's calendar alerts. The view, the day, the filters and the event
 * picked live in the URL, so a link opens the same calendar.
 */
export function MarketCalendarPage() {
  const [searchParams, update] = useSearchParamsUpdate()
  const today = toMarketDay(useNow(60_000))
  const state = readCalendarParams(searchParams, today)
  const change = (patch: CalendarStateChange) =>
    update((params) =>
      writeCalendarParams({ ...readCalendarParams(params, today), ...patch }, today),
    )
  const range = rangeOf(state.view, state.date)
  const query = { ...range, types: state.types, countries: state.countries, mine: state.mine }
  const calendar = useCalendar(query)
  const counts = calendar.data
    ? (Object.fromEntries(
        calendar.data.counts.map((count) => [count.type, count.count]),
      ) as Partial<Record<CalendarEventType, number>>)
    : undefined

  const download = (blob: Promise<Blob>, name: string) =>
    blob.then((file) => saveBlob(file, name)).catch((error: Error) => toast.error(error.message))
  // An SVT's account reads CAL without alerts (ROADMAP step 68: its /alerts answered 403).
  const canAlert = useHasPermission('alerts:write')
  const alertOn = (event: CalendarEventDto) =>
    openAlertDialog({
      calendar: {
        event: event.type,
        country: event.country,
        securityId: event.securityId,
        securityCode: event.securityCode,
      },
    })

  const panels = {
    filters: (
      <CalendarFiltersPanel
        state={state}
        onChange={change}
        onReset={() => update(() => new URLSearchParams())}
        onExport={(format) =>
          void download(
            contentApi.calendarExport(format, query),
            `cmarket-calendar-${range.from}-${range.to}.${format}`,
          )
        }
        counts={counts}
        internationalShown={calendar.data?.internationalShown ?? true}
      />
    ),
    agenda: (
      <AgendaPanel
        query={calendar}
        today={today}
        range={range}
        selectedId={state.event}
        onSelect={(event) => change({ event: event.id })}
        onAlert={canAlert ? alertOn : undefined}
        onStep={(step) => change({ date: stepOf(state.view, state.date, step) })}
        onToday={() => change({ date: today })}
      />
    ),
    event: (
      <EventDetailPanel
        eventId={state.event}
        today={today}
        onAlert={canAlert ? alertOn : undefined}
        onIcs={(event) =>
          void download(
            contentApi.calendarExport('ics', { id: event.id }),
            `cmarket-${event.type}-${event.date}.ics`,
          )
        }
      />
    ),
    alerts: <CalendarAlertsPanel allowed={canAlert} />,
  }
  return <ScreenWorkspace screenId="CAL" defaultLayout={MARKET_CALENDAR_LAYOUT} panels={panels} />
}
