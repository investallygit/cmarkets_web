import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAllocation } from '@/entities/portfolio'
import type { AllocationBy, AllocationItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { withAlpha } from '@/shared/lib/theme'
import { MAX_SERIES, useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

/** The tabs of the screen 5 mockup: [SECTOR] · COUNTRY · ASSET CLASS. */
const DEFAULT_VIEWS: readonly AllocationBy[] = ['sector', 'country', 'asset']
/** Maturity buckets of the bond sleeve, short to long. */
const MATURITIES = ['0-1', '1-3', '3-5', '5-10', '10+']
const CASH = 'cash'
const OTHER = 'other'

interface PortfolioAllocationPanelProps {
  portfolioId: string
  /** The breakdowns offered, as tabs when there are several; maturity for the Risk tab. */
  views?: readonly AllocationBy[]
}

/**
 * Screen 5, allocation: a stacked bar and its legend, by sector, country or asset class (spec
 * section 9), or the bonds by maturity. API GET /portfolios/{id}/allocation?by=.
 */
export function PortfolioAllocationPanel({
  portfolioId,
  views = DEFAULT_VIEWS,
}: PortfolioAllocationPanelProps) {
  const { t } = useTranslation()
  const [by, setBy] = useState<AllocationBy>(views[0] ?? 'sector')
  const allocation = useAllocation(portfolioId, by)
  const tabs = useMemo(
    () => views.map((value) => ({ value, label: t(`portfolio.allocation.views.${value}`) })),
    [t, views],
  )

  return (
    <Panel
      title={by === 'maturity' ? t('panels.maturities') : t('panels.allocation')}
      code="PORT"
      options={tabs.length > 1 ? <PanelTabs value={by} options={tabs} onChange={setBy} /> : null}
    >
      <QueryView query={allocation}>
        {(data) => (
          <div className={clsx('h-full', allocation.isPlaceholderData && 'opacity-60')}>
            <AllocationBar items={data.items} by={data.by} />
          </div>
        )}
      </QueryView>
    </Panel>
  )
}

function AllocationBar({ items, by }: { items: AllocationItemDto[]; by: AllocationBy }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()

  const cash = items.find((item) => item.key === CASH)
  const named = items.filter((item) => item.key !== CASH)
  // Past eight classes, the smallest fold into "Other".
  const kept = named.length > MAX_SERIES ? named.slice(0, MAX_SERIES - 1) : named
  const folded = named.slice(kept.length)
  const rows = [
    ...kept,
    ...(folded.length > 0
      ? [
          {
            key: OTHER,
            value: folded.reduce((sum, item) => sum + item.value, 0),
            weightPct: folded.reduce((sum, item) => sum + item.weightPct, 0),
          },
        ]
      : []),
    ...(cash ? [cash] : []),
  ]

  // A class keeps its colour whatever its weight: slots go in alphabetical order.
  const slots = kept.map((item) => item.key).sort((a, b) => a.localeCompare(b))
  const neutral = withAlpha(theme.secondary, 0.45)
  const colorOf = (key: string) => {
    if (key === CASH) return theme.secondary
    if (key === OTHER) return neutral
    if (by === 'maturity') {
      const bucket = MATURITIES.indexOf(key)
      return bucket === -1 ? neutral : theme.ordinal[bucket]
    }
    return theme.series[slots.indexOf(key)] ?? neutral
  }
  const labelOf = (key: string) => {
    if (key === CASH) return t('portfolio.allocation.cash')
    if (key === OTHER) return t('portfolio.allocation.other')
    if (by === 'country') return format.country(key)
    if (by === 'asset')
      return t(`portfolio.allocation.assets.${key === 'bond' ? 'bond' : 'equity'}`)
    if (by === 'maturity') {
      return MATURITIES.includes(key)
        ? t(`portfolio.allocation.maturities.${key as '0-1' | '1-3' | '3-5' | '5-10' | '10+'}`)
        : t('portfolio.allocation.noMaturity')
    }
    return key
  }
  // The maturity view reads short to long; the others largest first, cash last.
  const ordered = by === 'maturity' ? [...rows].sort((a, b) => order(a.key) - order(b.key)) : rows

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div
        role="img"
        aria-label={ordered
          .map((row) => `${labelOf(row.key)} ${format.percent(row.weightPct, 1, false)}`)
          .join(', ')}
        className="flex h-5 w-full shrink-0 gap-0.5"
      >
        {ordered
          .filter((row) => row.weightPct > 0)
          .map((row) => (
            <div
              key={row.key}
              title={`${labelOf(row.key)}: ${format.percent(row.weightPct, 1, false)}`}
              className="min-w-0.5 first:rounded-l-xs last:rounded-r-xs"
              style={{ flexGrow: row.weightPct, flexBasis: 0, backgroundColor: colorOf(row.key) }}
            />
          ))}
      </div>
      <ul className="flex min-h-0 flex-col gap-1.5 overflow-auto">
        {ordered.map((row) => (
          <li key={row.key} className="flex items-center gap-2 font-sans text-label">
            <span
              aria-hidden
              className="size-2.5 shrink-0"
              style={{ backgroundColor: colorOf(row.key) }}
            />
            <span className="truncate">{labelOf(row.key)}</span>
            <span className="ml-auto font-mono text-data">
              {format.percent(row.weightPct, 1, false)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Bonds short to long, then shares (no maturity), then cash. */
function order(key: string): number {
  const bucket = MATURITIES.indexOf(key)
  if (bucket !== -1) return bucket
  return key === CASH ? MATURITIES.length + 1 : MATURITIES.length
}
