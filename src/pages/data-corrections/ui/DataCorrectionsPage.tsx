import { useStoredPrices } from '@/entities/stored-price'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { addDays } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { DescriptionEditorPanel } from '@/widgets/description-editor-panel'
import {
  CorrectionsLogPanel,
  PriceCorrectionPanel,
  StoredPricesPanel,
} from '@/widgets/price-correction-panels'

/**
 * CORR has no mockup: the correction on the left over its log, the stored sessions on the right
 * over the security's description.
 */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'correction', name: 'priceCorrection', x: 0, y: 0, w: 6, h: 13, minW: 4, minH: 10 },
  { i: 'log', name: 'corrections', x: 0, y: 13, w: 6, h: 13, minW: 4, minH: 5 },
  { i: 'sessions', name: 'storedPrices', x: 6, y: 0, w: 6, h: 11, minW: 4, minH: 8 },
  { i: 'description', name: 'descriptionEditor', x: 6, y: 11, w: 6, h: 15, minW: 4, minH: 8 },
]

/**
 * CORR (spec section 11): pick a security and a session, see the stored OHLCV, correct it with a
 * reason; write the security's description, in French and English, that EQS shows (step 35). The
 * security and the session are in the URL (?security=SEMC&date=2026-10-29); the latest session is
 * shown by default.
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
    description: <DescriptionEditorPanel securityId={securityId} />,
  }
  return <ScreenWorkspace screenId="CORR" defaultLayout={LAYOUT} panels={panels} />
}
