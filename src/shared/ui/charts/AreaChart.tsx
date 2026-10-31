import { AreaSeries, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import type { HistoryPointDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { cssVar, withAlpha } from '@/shared/lib/theme'
import { baseChartOptions, chartLocalization, toChartTime } from './chartOptions'

interface AreaChartProps {
  points: readonly HistoryPointDto[]
  /** What the chart shows, for screen readers (useChartLabel): the name of the figure. */
  label: string
  intraday: boolean
  decimals: number
  /** Latest real-time value, applied to the last point. */
  liveValue?: number
  /** Design token of the line and its fill. */
  color?: `--${string}`
  /** In a document: no wheel zoom or drag, so the page scrolls over the chart. */
  fixed?: boolean
}

/** Price area chart (TradingView Lightweight Charts, spec section 7). */
export function AreaChart({
  points,
  label,
  intraday,
  decimals,
  liveValue,
  color = '--info',
  fixed = false,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // The chart is created with them: they do not change afterwards.
  const [style] = useState({ color, fixed })
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const locale = useLocale()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const chart = createChart(container, {
      ...baseChartOptions(),
      ...(style.fixed && { handleScroll: false, handleScale: false }),
    })
    const lineColor = cssVar(style.color)
    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor,
      lineWidth: 2,
      topColor: withAlpha(lineColor, 0.3),
      bottomColor: withAlpha(lineColor, 0.02),
      priceLineColor: cssVar('--accent-amber'),
    })
    chartRef.current = chart
    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [style])

  useEffect(() => {
    chartRef.current?.applyOptions({ localization: chartLocalization(locale, decimals) })
  }, [locale, decimals])

  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return
    chart.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } })
    series.setData(
      points.map((point) => ({ time: toChartTime(point.time, intraday), value: point.value })),
    )
    chart.timeScale().fitContent()
  }, [points, intraday])

  useEffect(() => {
    const last = points.at(-1)
    if (liveValue === undefined || !last) return
    seriesRef.current?.update({ time: toChartTime(last.time, intraday), value: liveValue })
  }, [liveValue, points, intraday])

  return <div ref={containerRef} role="figure" aria-label={label} className="h-full w-full" />
}
