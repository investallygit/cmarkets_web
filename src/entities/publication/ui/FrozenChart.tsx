import { lazy, Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { FrozenChartDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { AreaChart } from '@/shared/ui/charts/AreaChart'
import { PanelLoading } from '@/shared/ui/StatusViews'

// Candles need the full price chart; a line is enough for most notes.
const PriceChart = lazy(() =>
  import('@/shared/ui/charts/PriceChart').then((module) => ({ default: module.PriceChart })),
)

/**
 * A "CMarket chart" block: the prices as they were the day it was inserted, whatever the market
 * did since (spec section 9, screen 7).
 */
export function FrozenChart({ chart }: { chart: FrozenChartDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const points = useMemo(
    () => chart.bars.map((bar) => ({ time: bar.time, value: bar.close })),
    [chart.bars],
  )
  const decimals = chart.bars.every((bar) => Number.isInteger(bar.close)) ? 0 : 2

  return (
    <figure className="border border-accent-amber/60" contentEditable={false}>
      <figcaption className="flex h-row items-center border-b border-accent-amber/30 px-2 font-mono text-title font-semibold text-accent-amber uppercase">
        {t('publication.chart.caption', {
          title: chart.title,
          date: format.isoDate(chart.frozenAt),
        })}
      </figcaption>
      <div className="h-56">
        {chart.type === 'line' ? (
          <AreaChart
            points={points}
            intraday={false}
            decimals={decimals}
            color="--accent-amber"
            fixed
          />
        ) : (
          <Suspense fallback={<PanelLoading />}>
            <PriceChart bars={chart.bars} type="candles" intraday={false} decimals={decimals} />
          </Suspense>
        )}
      </div>
    </figure>
  )
}
