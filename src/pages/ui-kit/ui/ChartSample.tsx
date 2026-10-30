import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import {
  PriceChart,
  type PriceChartOverlay,
  type PriceChartType,
} from '@/shared/ui/charts/PriceChart'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs, type PanelTabOption } from '@/shared/ui/PanelTabs'
import { movingAverage, sampleBars } from '../lib/sampleBars'

const BARS = sampleBars('2026-10-28')
const LAST_CLOSE = BARS.at(-1)?.close ?? 0
const OVERLAYS: PriceChartOverlay[] = [
  { id: 'ma20', label: 'MA20', color: '--accent-amber', points: movingAverage(BARS, 20) },
  { id: 'ma50', label: 'MA50', color: '--info', points: movingAverage(BARS, 50) },
]
const CHART_TYPES: PanelTabOption<PriceChartType>[] = [
  { value: 'candles', label: 'Candles' },
  { value: 'bars', label: 'Bars' },
  { value: 'line', label: 'Line' },
]

/** The chart of the security profile (screen 2), with simulated real-time prices. */
export function ChartSample({ className }: { className?: string }) {
  const [type, setType] = useState<PriceChartType>('candles')
  const [live, setLive] = useState(false)
  const [livePrice, setLivePrice] = useState<number>()

  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => {
      setLivePrice((current) => {
        const next = (current ?? LAST_CLOSE) * (1 + (Math.random() - 0.5) * 0.006)
        return Math.round(next / 50) * 50
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [live])

  return (
    <div className={clsx('h-110', className)}>
      <Panel
        title="Price chart"
        code="GP"
        options={
          <>
            <PanelTabs value={type} options={CHART_TYPES} onChange={setType} />
            <button
              type="button"
              aria-pressed={live}
              onClick={() => setLive((current) => !current)}
              className={clsx('panel-no-drag', live ? 'text-primary' : 'hover:text-primary')}
            >
              {live ? '[LIVE]' : 'LIVE'}
            </button>
          </>
        }
      >
        <PriceChart
          bars={BARS}
          type={type}
          intraday={false}
          decimals={0}
          overlays={OVERLAYS}
          livePrice={livePrice}
        />
      </Panel>
    </div>
  )
}
