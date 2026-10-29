import {
  AreaSeries,
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import type { HistoryPointDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { formatNumber, toMarketDay } from '@/shared/lib/format'
import { cssVar, withAlpha } from '@/shared/lib/theme'

/** Douala is UTC+1 all year round; the chart displays timestamps as given, so shift them. */
const DOUALA_OFFSET_SECONDS = 3600

function toChartTime(iso: string, intraday: boolean): Time {
  if (!intraday) return toMarketDay(iso)
  return (Math.floor(Date.parse(iso) / 1000) + DOUALA_OFFSET_SECONDS) as UTCTimestamp
}

interface AreaChartProps {
  points: readonly HistoryPointDto[]
  intraday: boolean
  decimals: number
  /** Latest real-time value, applied to the last point. */
  liveValue?: number
}

/** Price area chart (TradingView Lightweight Charts, spec section 7). */
export function AreaChart({ points, intraday, decimals, liveValue }: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const locale = useLocale()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: cssVar('--bg-panel') },
        textColor: cssVar('--text-secondary'),
        fontFamily: "'JetBrains Mono Variable', monospace",
        fontSize: 11,
        // Required by the Lightweight Charts licence unless TradingView is credited elsewhere.
        attributionLogo: true,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: cssVar('--border'), style: LineStyle.Dotted },
      },
      rightPriceScale: { borderColor: cssVar('--border') },
      timeScale: { borderColor: cssVar('--border') },
      crosshair: { mode: CrosshairMode.Normal },
    })
    const lineColor = cssVar('--info')
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
  }, [])

  useEffect(() => {
    chartRef.current?.applyOptions({
      localization: {
        locale: locale === 'fr' ? 'fr-FR' : 'en-US',
        dateFormat: 'dd/MM/yyyy',
        priceFormatter: (price: number) => formatNumber(price, locale, decimals),
      },
    })
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

  return <div ref={containerRef} className="h-full w-full" />
}
