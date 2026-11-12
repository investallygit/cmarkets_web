import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAllocation } from '@/entities/portfolio'
import type { AllocationBy, AllocationItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { withAlpha } from '@/shared/lib/theme'
import { AllocationBar as Breakdown } from '@/shared/ui/charts/AllocationBar'
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
    <Breakdown
      rows={ordered.map((row) => ({
        key: row.key,
        label: labelOf(row.key),
        weightPct: row.weightPct,
        color: colorOf(row.key),
      }))}
    />
  )
}

/** Bonds short to long, then shares (no maturity), then cash. */
function order(key: string): number {
  const bucket = MATURITIES.indexOf(key)
  if (bucket !== -1) return bucket
  return key === CASH ? MATURITIES.length + 1 : MATURITIES.length
}
