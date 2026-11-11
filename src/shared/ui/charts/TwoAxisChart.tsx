import {
  createChart,
  createTextWatermark,
  HistogramSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type ITextWatermarkPluginApi,
  type MouseEventParams,
  type Time,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import type { IsoDate } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { formatCompact } from '@/shared/lib/format'
import { cssVar, withAlpha } from '@/shared/lib/theme'
import { baseChartOptions, chartLocalization, formatChartTime, toChartTime } from './chartOptions'

/** Design token, e.g. "--accent-amber". */
type ColorToken = `--${string}`

/** A day of the chart: a value on each line (null for none that day), its volume (null: no bar). */
export interface TwoAxisPoint {
  time: IsoDate
  primary: number | null
  secondary: number | null
  /** The primary line lighter up to this day: a model price on screen 20. */
  faint: boolean
  volume: number | null
}

/** A line of the chart: its name, its values in the user's format, its colour. */
export interface TwoAxisLine {
  label: string
  format: (value: number) => string
  color: ColorToken
  /** The left axis for the primary line, the right one for the secondary unless it shares the left. */
  axis: 'left' | 'right'
  dotted?: boolean
}

interface TwoAxisChartProps {
  /** Oldest first. */
  points: readonly TwoAxisPoint[]
  primary: TwoAxisLine
  secondary?: TwoAxisLine
  /** The volume pane's name; no pane without it. */
  volumeLabel?: string
  /** What the chart shows, for screen readers: the canvas itself says nothing. */
  label: string
}

/** The volume pane's height against the prices'. */
const VOLUME_PANE_STRETCH = 0.22

/** How much of a faint stretch of the line shows: a model price drawn lighter (screen 20). */
const FAINT_ALPHA = 0.4

interface Hovered {
  time: Time
  primary?: number
  secondary?: number
  volume?: number
}

/**
 * Two lines on two axes over time (TradingView Lightweight Charts): the primary one solid on the
 * left axis, lighter on its faint days; the secondary one on the right axis or on the left, dotted
 * when asked; the volume below on the days it has one. Wheel to zoom, drag to pan, the values of
 * the day under the cursor in the corner.
 */
export function TwoAxisChart({
  points,
  primary,
  secondary,
  volumeLabel,
  label,
}: TwoAxisChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const locale = useLocale()
  const [hovered, setHovered] = useState<Hovered | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const base = baseChartOptions()
    const border = cssVar('--border')
    const chart = createChart(container, {
      ...base,
      layout: { ...base.layout, panes: { separatorColor: border, enableResize: false } },
      leftPriceScale: { visible: true, borderColor: border },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    })
    chartRef.current = chart
    return () => {
      chart.remove()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.applyOptions({ localization: chartLocalization(locale) })
  }, [locale])

  // Every series is rebuilt when the days, the lines or the language change.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const lineOptions = (line: TwoAxisLine) => ({
      color: cssVar(line.color),
      lineWidth: 2 as const,
      lineStyle: line.dotted ? LineStyle.Dotted : LineStyle.Solid,
      priceScaleId: line.axis,
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: { type: 'custom' as const, minMove: 0.0001, formatter: line.format },
    })
    chart.applyOptions({ rightPriceScale: { visible: secondary?.axis === 'right' } })

    const primaryColor = cssVar(primary.color)
    const faintColor = withAlpha(primaryColor, FAINT_ALPHA)
    const main = chart.addSeries(LineSeries, lineOptions(primary))
    // A day without a value leaves a gap; a faint day draws the stretch that ends on it lighter.
    main.setData(
      points.map((point) => {
        const time = toChartTime(point.time, false)
        return point.primary === null
          ? { time }
          : { time, value: point.primary, color: point.faint ? faintColor : primaryColor }
      }),
    )
    const other = secondary ? chart.addSeries(LineSeries, lineOptions(secondary)) : null
    other?.setData(
      points.map((point) => {
        const time = toChartTime(point.time, false)
        return point.secondary === null ? { time } : { time, value: point.secondary }
      }),
    )

    let volume: ISeriesApi<'Histogram'> | null = null
    const labels: ITextWatermarkPluginApi<Time>[] = []
    if (volumeLabel) {
      const barColor = withAlpha(cssVar('--text-secondary'), 0.6)
      volume = chart.addSeries(
        HistogramSeries,
        {
          lastValueVisible: false,
          priceLineVisible: false,
          priceFormat: {
            type: 'custom',
            formatter: (value: number) => formatCompact(value, locale),
          },
        },
        1,
      )
      volume.setData(
        points.map((point) => {
          const time = toChartTime(point.time, false)
          return point.volume === null ? { time } : { time, value: point.volume, color: barColor }
        }),
      )
      const pane = chart.panes()[1]
      pane.setStretchFactor(VOLUME_PANE_STRETCH)
      labels.push(
        createTextWatermark(pane, {
          horzAlign: 'left',
          vertAlign: 'top',
          lines: [
            {
              text: volumeLabel,
              color: cssVar('--text-secondary'),
              fontSize: 11,
              fontFamily: "'Inter Variable', sans-serif",
            },
          ],
        }),
      )
    }
    chart.panes()[0].setStretchFactor(1)

    const onCrosshairMove = (param: MouseEventParams) => {
      if (param.time === undefined || !param.point) {
        setHovered(null)
        return
      }
      const valueOf = (series: ISeriesApi<'Line'> | ISeriesApi<'Histogram'> | null) => {
        const point = series ? param.seriesData.get(series) : undefined
        return point && 'value' in point && typeof point.value === 'number'
          ? point.value
          : undefined
      }
      setHovered({
        time: param.time,
        primary: valueOf(main),
        secondary: valueOf(other),
        volume: valueOf(volume),
      })
    }
    chart.subscribeCrosshairMove(onCrosshairMove)
    chart.timeScale().fitContent()

    return () => {
      // On unmount the chart is already removed, with its series.
      if (chartRef.current !== chart) return
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      labels.forEach((watermark) => watermark.detach())
      // The volume pane first: an emptied pane is dropped.
      for (const series of [volume, other, main]) {
        if (series) chart.removeSeries(series)
      }
      setHovered(null)
    }
  }, [points, primary, secondary, volumeLabel, locale])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} role="figure" aria-label={label} className="h-full w-full" />
      <div className="pointer-events-none absolute top-1 right-16 left-16 z-10 flex flex-wrap items-baseline justify-between gap-x-3 font-mono text-title">
        <span style={{ color: `var(${primary.color})` }}>
          {primary.label}
          {hovered?.primary !== undefined && ` ${primary.format(hovered.primary)}`}
        </span>
        {hovered && <span className="text-secondary">{formatChartTime(hovered.time)}</span>}
        {secondary && (
          <span style={{ color: `var(${secondary.color})` }}>
            {secondary.label}
            {hovered?.secondary !== undefined && ` ${secondary.format(hovered.secondary)}`}
          </span>
        )}
      </div>
      {hovered?.volume !== undefined && (
        <span className="pointer-events-none absolute bottom-6 left-16 z-10 font-mono text-title text-secondary">
          {formatCompact(hovered.volume, locale)}
        </span>
      )}
    </div>
  )
}
