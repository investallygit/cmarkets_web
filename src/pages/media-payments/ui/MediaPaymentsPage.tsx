import { isMonth, previousMonth, useStatements } from '@/entities/news-statement'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { useFormat } from '@/shared/i18n'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  AnomaliesPanel,
  PaymentsHeader,
  StatementPanel,
  StatementsPanel,
} from '@/widgets/media-payments-panels'

/** The screen 18 mockup: the statements and the anomalies on the left, the statement on the right. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'statements', name: 'mediaStatements', x: 0, y: 0, w: 8, h: 14, minW: 5, minH: 6 },
  { i: 'anomalies', name: 'clickAnomalies', x: 0, y: 14, w: 8, h: 11, minW: 5, minH: 6 },
  { i: 'statement', name: 'mediaStatement', x: 8, y: 0, w: 4, h: 25, minW: 3, minH: 10 },
]

/**
 * MPAY, the media payments (spec screen 18): the month's header over the workspace, the
 * statements by newspaper, the click anomalies of the newspaper picked and its statement. The
 * month and the statement are in the URL (/admin/media-payments?month=2026-10&id=); the month
 * before this one, its largest statement, by default.
 */
export function MediaPaymentsPage() {
  const format = useFormat()
  const [params, updateParams] = useSearchParamsUpdate()
  const asked = params.get('month')
  const month = isMonth(asked) ? asked : previousMonth(format.day(new Date()))
  const statements = useStatements(month)
  const selected =
    statements.data?.find((row) => row.id === params.get('id')) ?? statements.data?.[0] ?? null
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    statements: (
      <StatementsPanel
        month={month}
        selectedId={selected?.id ?? null}
        onSelect={(id) => set({ id })}
      />
    ),
    anomalies: (
      <AnomaliesPanel
        key={selected?.source.id ?? 'none'}
        month={month}
        source={selected ? { id: selected.source.id, shortName: selected.source.shortName } : null}
      />
    ),
    statement: <StatementPanel id={selected?.id ?? null} />,
  }
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <PaymentsHeader month={month} onMonthChange={(value) => set({ month: value, id: '' })} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="MPAY" defaultLayout={LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
