import { ScreenWorkspace } from '@/features/workspace-layout'
import { toMarketDay } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'
import { useSearchParamsUpdate } from '@/shared/routes/useSearchParamsUpdate'
import { AuctionsPanel } from '@/widgets/auctions-panel'
import { CalendarViewPanel, type CalendarViewChange } from '@/widgets/calendar-view-panel'
import { MARKET_CALENDAR_LAYOUT } from '../config/layout'
import { readCalendarParams, writeCalendarParams } from '../model/calendarParams'

/**
 * CAL screen: the market calendar by day or week, and the latest BEAC auctions. The day, the view
 * and the filters live in the URL, so a link opens the same calendar.
 */
export function MarketCalendarPage() {
  const [searchParams, update] = useSearchParamsUpdate()
  const today = toMarketDay(useNow(60_000))
  const state = readCalendarParams(searchParams, today)
  const change = (next: CalendarViewChange) =>
    update((params) => {
      const current = readCalendarParams(params, today)
      const patch = typeof next === 'function' ? next(current) : next
      return writeCalendarParams({ ...current, ...patch }, today)
    })

  const panels = {
    calendar: <CalendarViewPanel state={state} onChange={change} />,
    auctions: <AuctionsPanel />,
  }
  return <ScreenWorkspace screenId="CAL" defaultLayout={MARKET_CALENDAR_LAYOUT} panels={panels} />
}
