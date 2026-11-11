import { useMemo } from 'react'
import { useBondScreener } from '@/entities/bond'
import { BondCriteriaPanel, toQuery, useBondScreenerStore } from '@/features/screen-bonds'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { BondAnalyticsPanel } from '@/widgets/bond-analytics-panel'
import { BondScreenerResultsPanel } from '@/widgets/bond-screener-results-panel'
import { BOND_SCREENER_LAYOUT } from '../config/layout'

/** The query of the last run and the bond the lower panel shows: the first result by default. */
function useSelectedBond() {
  const applied = useBondScreenerStore((state) => state.applied)
  const bondId = useBondScreenerStore((state) => state.bondId)
  const query = useMemo(() => toQuery(applied), [applied])
  const results = useBondScreener(query)
  const items = results.data?.items
  const selected = items?.find((row) => row.bondId === bondId) ?? items?.at(0)
  return { query, selectedId: selected?.bondId ?? null }
}

function Results() {
  const select = useBondScreenerStore((state) => state.select)
  const { query, selectedId } = useSelectedBond()
  return <BondScreenerResultsPanel query={query} selectedId={selectedId} onSelect={select} />
}

function Profile() {
  const { selectedId } = useSelectedBond()
  return <BondAnalyticsPanel bondId={selectedId} />
}

const PANELS = {
  criteria: <BondCriteriaPanel />,
  results: <Results />,
  profile: <Profile />,
}

/**
 * Screen 17, the bond screener (BS): the criteria, the bonds of the latest daily calculation
 * that meet them, and the four blocks of the selected bond.
 */
export function BondScreenerPage() {
  return <ScreenWorkspace screenId="BS" defaultLayout={BOND_SCREENER_LAYOUT} panels={PANELS} />
}
