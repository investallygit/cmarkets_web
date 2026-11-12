import { useMemo } from 'react'
import { useEtfScreener } from '@/entities/etf'
import { EtfCriteriaPanel, toQuery, useEtfScreenerStore } from '@/features/screen-etfs'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { EtfBlocksPanel } from '@/widgets/etf-blocks-panel'
import { EtfScreenerResultsPanel } from '@/widgets/etf-screener-results-panel'
import { ETF_SCREENER_LAYOUT } from '../config/layout'

/** The query of the last run and the ETF the lower panel shows: the first result by default. */
function useSelectedEtf() {
  const applied = useEtfScreenerStore((state) => state.applied)
  const etfId = useEtfScreenerStore((state) => state.etfId)
  const query = useMemo(() => toQuery(applied), [applied])
  const results = useEtfScreener(query)
  const items = results.data?.items
  const selected = items?.find((row) => row.etfId === etfId) ?? items?.at(0)
  return { query, selectedId: selected?.etfId ?? null }
}

function Results() {
  const select = useEtfScreenerStore((state) => state.select)
  const { query, selectedId } = useSelectedEtf()
  return <EtfScreenerResultsPanel query={query} selectedId={selectedId} onSelect={select} />
}

function Profile() {
  const { selectedId } = useSelectedEtf()
  return <EtfBlocksPanel etfId={selectedId} />
}

const PANELS = {
  criteria: <EtfCriteriaPanel />,
  results: <Results />,
  profile: <Profile />,
}

/**
 * Screen 15, the ETF screener (ETFS): the criteria, the ETFs of the latest evening's calculation
 * that meet them, and the five blocks of the selected ETF.
 */
export function EtfScreenerPage() {
  return <ScreenWorkspace screenId="ETFS" defaultLayout={ETF_SCREENER_LAYOUT} panels={PANELS} />
}
