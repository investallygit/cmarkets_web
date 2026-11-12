import { useMemo } from 'react'
import { useScreener } from '@/entities/screener'
import { CriteriaPanel, useAppliedCriteria } from '@/features/screen-equities'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { ScreenerRowDto } from '@/shared/api/contracts'
import {
  FinancialStatementsPanel,
  FinancialSummaryPanel,
} from '@/widgets/financial-statements-panel'
import { PeerComparisonPanel } from '@/widgets/peer-comparison-panel'
import { ScreenerResultsPanel } from '@/widgets/screener-results-panel'
import { SecurityDescriptionPanel } from '@/widgets/security-description-panel'
import { EQUITY_SCREENER_LAYOUT } from '../config/layout'
import { useScreenerSelection } from '../model/selection'

const NO_ROWS: ScreenerRowDto[] = []

/** The results of the last run and the row the lower panels show: the first one by default. */
function useSelectedRow() {
  const results = useScreener({ criteria: useAppliedCriteria() })
  const securityId = useScreenerSelection((state) => state.securityId)
  const rows = results.data?.items ?? NO_ROWS
  return { rows, selected: rows.find((row) => row.securityId === securityId) ?? rows.at(0) }
}

function ScreenerResults() {
  const criteria = useAppliedCriteria()
  const select = useScreenerSelection((state) => state.select)
  const { selected } = useSelectedRow()
  return (
    <ScreenerResultsPanel
      criteria={criteria}
      selectedId={selected?.securityId ?? null}
      onSelect={select}
    />
  )
}

function ScreenerDescription() {
  const { selected } = useSelectedRow()
  return <SecurityDescriptionPanel securityId={selected?.securityId} code={selected?.code} />
}

// The selected security against the other results.
function ScreenerComparison() {
  const select = useScreenerSelection((state) => state.select)
  const { rows, selected } = useSelectedRow()
  const peerIds = useMemo(() => rows.map((row) => row.securityId), [rows])
  return (
    <PeerComparisonPanel securityId={selected?.securityId} peerIds={peerIds} onSelect={select} />
  )
}

function ScreenerStatements() {
  const { selected } = useSelectedRow()
  return <FinancialStatementsPanel securityId={selected?.securityId} code={selected?.code} />
}

function ScreenerSummary() {
  const { selected } = useSelectedRow()
  return <FinancialSummaryPanel securityId={selected?.securityId} code={selected?.code} />
}

const PANELS = {
  criteria: <CriteriaPanel />,
  results: <ScreenerResults />,
  description: <ScreenerDescription />,
  comparison: <ScreenerComparison />,
  statements: <ScreenerStatements />,
  summary: <ScreenerSummary />,
}

/**
 * Screen 3, equity screener and fundamental analysis (EQS): criteria, results, the description of
 * the selected row, then its comparison and statements.
 */
export function EquityScreenerPage() {
  return <ScreenWorkspace screenId="EQS" defaultLayout={EQUITY_SCREENER_LAYOUT} panels={PANELS} />
}
