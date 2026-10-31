import { useStoredPrices } from '@/entities/stored-price'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { addDays } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import {
  CorrectionsLogPanel,
  PriceCorrectionPanel,
  StoredPricesPanel,
} from '@/widgets/price-correction-panels'

/** CORR has no mockup: the correction on the left over its log, the stored sessions on the right. */
const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'correction', x: 0, y: 0, w: 6, h: 13, minW: 4, minH: 10 },
  { i: 'log', x: 0, y: 13, w: 6, h: 13, minW: 4, minH: 5 },
  { i: 'sessions', x: 6, y: 0, w: 6, h: 26, minW: 4, minH: 8 },
]

/**
 * CORR (spec section 11): pick a security and a session, see the stored OHLCV, correct it with a
 * reason. The security and the session are in the URL (?security=SEMC&date=2026-10-29); the
 * latest session is shown by default.
 */
export function DataCorrectionsPage() {
  const today = useMarketDay()
  const [params, updateParams] = useSearchParamsUpdate()
  const securityId = params.get('security')
  const sessions = useStoredPrices(securityId, addDays(today, -62), today)
  const date = params.get('date') ?? sessions.data?.[0]?.date ?? null
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    correction: (
      <PriceCorrectionPanel
        securityId={securityId}
        date={date}
        onSecurityChange={(id) => set({ security: id, date: '' })}
        onDateChange={(value) => set({ date: value })}
      />
    ),
    log: (
      <CorrectionsLogPanel
        onOpen={(correction) => set({ security: correction.securityId, date: correction.date })}
      />
    ),
    sessions: (
      <StoredPricesPanel
        securityId={securityId}
        date={date}
        onDateChange={(value) => set({ date: value })}
      />
    ),
  }
  return <ScreenWorkspace screenId="CORR" defaultLayout={LAYOUT} panels={panels} />
}
