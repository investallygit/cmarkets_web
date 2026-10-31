import {
  BarSeries,
  CandlestickSeries,
  createChart,
  createTextWatermark,
  HistogramSeries,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ITextWatermarkPluginApi,
  type LineWidth,
  type MouseEventParams,
  type SeriesType,
  type Time,
} from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ChartDrawingDto,
  ChartPointDto,
  HistoryPointDto,
  PriceBarDto,
} from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { formatCompact, formatNumber } from '@/shared/lib/format'
import { cssVar, withAlpha } from '@/shared/lib/theme'
import {
  baseChartOptions,
  chartLocalization,
  formatChartTime,
  fromChartTime,
  toChartTime,
} from './chartOptions'
import { toCloseLine, toLineData, toOhlcData, toVolumeData, withLivePrice } from './priceBars'
import { TrendLine } from './trendLine'

export type PriceChartType = 'candles' | 'bars' | 'line'

/** Design token, e.g. "--accent-amber". */
type ColorToken = `--${string}`

/** A line drawn with the prices: a moving average, a Bollinger band, a compared security. */
export interface PriceChartLine {
  id: string
  label: string
  color: ColorToken
  points: readonly HistoryPointDto[]
}

/** An indicator in its own pane below the prices, such as RSI or MACD. */
export interface PriceChartPane {
  id: string
  label: string
  /** histogram: bars coloured by sign, as the MACD histogram. */
  lines: readonly (PriceChartLine & { kind?: 'line' | 'histogram' })[]
  /** Dashed guide lines, e.g. 30 and 70 for the RSI. */
  levels?: readonly number[]
}

/** A line the user draws; the caller gives it an id and saves it. */
export type ChartDrawingInput =
  | { kind: 'trendline'; from: ChartPointDto; to: ChartPointDto }
  | { kind: 'horizontal'; price: number }

export type DrawingTool = ChartDrawingInput['kind']

interface PriceChartProps {
  bars: readonly PriceBarDto[]
  /** What the chart shows, for screen readers (useChartLabel): the name of the figure. */
  label: string
  type?: PriceChartType
  intraday: boolean
  decimals: number
  /**
   * Keep the arrays below stable between renders (query data or useMemo): a new array redraws
   * the chart and fits it to the data again.
   */
  overlays?: readonly PriceChartLine[]
  /** Other securities or indices; with any, every line is rebased to 100 (spec section 3). */
  comparisons?: readonly PriceChartLine[]
  panes?: readonly PriceChartPane[]
  showVolume?: boolean
  /** Latest real-time price, applied to the last bar. */
  livePrice?: number
  /** Lines saved by the user; shown on daily and weekly bars. */
  drawings?: readonly ChartDrawingDto[]
  /** While set, clicks on the chart draw: one click for a horizontal line, two for a trend line. */
  drawingTool?: DrawingTool | null
  onDraw?: (drawing: ChartDrawingInput) => void
}

/** Values of the bar under the crosshair. */
interface HoveredBar {
  time: Time
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  lines: (number | undefined)[]
}

type MainSeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Bar'> | ISeriesApi<'Line'>

const NO_LINES: readonly PriceChartLine[] = []
const NO_PANES: readonly PriceChartPane[] = []
const NO_DRAWINGS: readonly ChartDrawingDto[] = []
/** Stretch factors of the panes below the prices, which have 1. */
const VOLUME_PANE_STRETCH = 0.25
const INDICATOR_PANE_STRETCH = 0.3
/** Pointer movement between press and release still counted as a click. */
const CLICK_TOLERANCE_PX = 4

/**
 * Price chart of a security (spec section 9, screen 2): candles, bars or line, moving averages
 * and other lines, volume and indicator panes below, the last price in amber on the axis.
 * The mouse wheel zooms, dragging pans, the crosshair shows the values of the bar below it.
 */
export function PriceChart({
  bars,
  label,
  type = 'candles',
  intraday,
  decimals,
  overlays = NO_LINES,
  comparisons = NO_LINES,
  panes = NO_PANES,
  showVolume = true,
  livePrice,
  drawings = NO_DRAWINGS,
  drawingTool = null,
  onDraw,
}: PriceChartProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  /** Price series currently drawn; the drawings hang on it. */
  const mainRef = useRef<MainSeries | null>(null)
  /** Applies a real-time price to the series currently drawn. */
  const applyLivePriceRef = useRef<((price: number) => void) | null>(null)
  const onDrawRef = useRef(onDraw)
  const [hovered, setHovered] = useState<HoveredBar | null>(null)

  useEffect(() => {
    onDrawRef.current = onDraw
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const base = baseChartOptions()
    const crosshairLabel = { labelBackgroundColor: cssVar('--bg-selected') }
    const chart = createChart(container, {
      ...base,
      layout: {
        ...base.layout,
        panes: { separatorColor: cssVar('--border'), enableResize: false },
      },
      crosshair: { ...base.crosshair, vertLine: crosshairLabel, horzLine: crosshairLabel },
      // Spec section 9: mouse wheel = zoom, drag = pan.
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

  // Every series is rebuilt when the data, the chart type or the language change.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const up = cssVar('--up')
    const down = cssVar('--down')
    const amber = cssVar('--accent-amber')
    // Prices in the user's number format; each pane's axis follows its first series.
    const priceFormat = {
      type: 'custom' as const,
      minMove: 1 / 10 ** decimals,
      formatter: (price: number) => formatNumber(price, locale, decimals),
    }
    const hidden = { lastValueVisible: false, priceLineVisible: false, priceFormat }
    chart.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } })

    let main: MainSeries
    let line: ISeriesApi<'Line'> | null = null
    let ohlc: ISeriesApi<'Candlestick'> | ISeriesApi<'Bar'> | null = null
    if (type === 'line') {
      line = chart.addSeries(LineSeries, { ...hidden, color: cssVar('--info'), lineWidth: 2 })
      line.setData(toCloseLine(bars, intraday))
      main = line
    } else {
      ohlc =
        type === 'candles'
          ? chart.addSeries(CandlestickSeries, {
              ...hidden,
              upColor: up,
              downColor: down,
              wickUpColor: up,
              wickDownColor: down,
              borderVisible: false,
            })
          : chart.addSeries(BarSeries, { ...hidden, upColor: up, downColor: down, thinBars: false })
      ohlc.setData(toOhlcData(bars, intraday))
      main = ohlc
    }

    const addLine = (item: PriceChartLine, paneIndex: number, lineWidth: LineWidth) => {
      const series = chart.addSeries(
        LineSeries,
        { ...hidden, color: cssVar(item.color), lineWidth, crosshairMarkerVisible: false },
        paneIndex,
      )
      series.setData(toLineData(item.points, intraday))
      return series
    }
    const priceLines = [
      ...overlays.map((item) => addLine(item, 0, 1)),
      ...comparisons.map((item) => addLine(item, 0, 2)),
    ]

    // Panes below the prices: volume first, then each indicator, with its name in the corner.
    const labels: ITextWatermarkPluginApi<Time>[] = []
    let paneIndex = 1
    const openPane = (label: string, stretch: number) => {
      const pane = chart.panes()[paneIndex]
      pane.setStretchFactor(stretch)
      labels.push(
        createTextWatermark(pane, {
          horzAlign: 'left',
          vertAlign: 'top',
          lines: [
            {
              text: label,
              color: cssVar('--text-secondary'),
              fontSize: 11,
              fontFamily: "'Inter Variable', sans-serif",
            },
          ],
        }),
      )
      paneIndex += 1
    }

    let volume: ISeriesApi<'Histogram'> | null = null
    if (showVolume) {
      volume = chart.addSeries(
        HistogramSeries,
        {
          ...hidden,
          priceFormat: {
            type: 'custom',
            formatter: (value: number) => formatCompact(value, locale),
          },
        },
        paneIndex,
      )
      volume.setData(toVolumeData(bars, intraday, withAlpha(up, 0.5), withAlpha(down, 0.5)))
      openPane(t('chart.volume'), VOLUME_PANE_STRETCH)
    }

    const paneSeries: ISeriesApi<SeriesType>[] = []
    for (const pane of panes) {
      const series = pane.lines.map((item): ISeriesApi<SeriesType> => {
        if (item.kind !== 'histogram') return addLine(item, paneIndex, 1)
        const histogram = chart.addSeries(HistogramSeries, hidden, paneIndex)
        histogram.setData(
          item.points.map((point) => ({
            time: toChartTime(point.time, intraday),
            value: point.value,
            color: withAlpha(point.value >= 0 ? up : down, 0.6),
          })),
        )
        return histogram
      })
      for (const level of pane.levels ?? []) {
        series[0]?.createPriceLine({
          price: level,
          color: cssVar('--text-secondary'),
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: false,
        })
      }
      paneSeries.push(...series)
      openPane(pane.label, INDICATOR_PANE_STRETCH)
    }
    chart.panes()[0].setStretchFactor(1)
    // Only the prices are rebased to 100 during a comparison, not the panes below.
    chart.panes().forEach((_, index) => {
      chart.priceScale('right', index).applyOptions({
        mode:
          index === 0 && comparisons.length > 0
            ? PriceScaleMode.IndexedTo100
            : PriceScaleMode.Normal,
      })
    })

    let lastBar = bars.at(-1)
    const priceLine = lastBar
      ? main.createPriceLine({
          price: lastBar.close,
          color: amber,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          axisLabelColor: amber,
          axisLabelTextColor: cssVar('--bg-app'),
        })
      : null
    mainRef.current = main
    applyLivePriceRef.current = (price) => {
      if (!lastBar) return
      lastBar = withLivePrice(lastBar, price)
      const { open, high, low, close } = lastBar
      const time = toChartTime(lastBar.time, intraday)
      if (line) line.update({ time, value: close })
      else ohlc?.update({ time, open, high, low, close })
      priceLine?.applyOptions({ price })
    }

    const onCrosshairMove = (param: MouseEventParams) => {
      if (param.time === undefined || !param.point) {
        setHovered(null)
        return
      }
      const valueOf = (series: ISeriesApi<SeriesType> | null) => {
        const point = series ? param.seriesData.get(series) : undefined
        return point && 'value' in point && typeof point.value === 'number'
          ? point.value
          : undefined
      }
      const bar = param.seriesData.get(main)
      setHovered({
        time: param.time,
        ...(bar && 'close' in bar
          ? { open: bar.open, high: bar.high, low: bar.low, close: bar.close }
          : { close: valueOf(line) }),
        volume: valueOf(volume),
        lines: priceLines.map(valueOf),
      })
    }
    chart.subscribeCrosshairMove(onCrosshairMove)
    chart.timeScale().fitContent()

    return () => {
      mainRef.current = null
      applyLivePriceRef.current = null
      // On unmount the chart is already removed, with its series.
      if (chartRef.current !== chart) return
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      labels.forEach((label) => label.detach())
      // Bottom pane first: an emptied pane is dropped and the panes below would move up.
      for (const series of [...paneSeries].reverse().concat(volume ?? [], priceLines, main)) {
        if (series) chart.removeSeries(series)
      }
    }
  }, [bars, type, intraday, decimals, overlays, comparisons, panes, showVolume, locale, t])

  // The drawings hang on the price series: redrawn with it, or alone when they change.
  useEffect(() => {
    const main = mainRef.current
    if (!main || intraday) return
    const color = cssVar('--info')
    const priceLines: IPriceLine[] = []
    const trendLines: TrendLine[] = []
    for (const drawing of drawings) {
      if (drawing.kind === 'horizontal') {
        priceLines.push(
          main.createPriceLine({
            price: drawing.price,
            color,
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            axisLabelColor: color,
            axisLabelTextColor: cssVar('--bg-app'),
          }),
        )
      } else {
        const point = ({ time, price }: ChartPointDto) => ({
          time: toChartTime(time, false),
          price,
        })
        const trendLine = new TrendLine(point(drawing.from), point(drawing.to), color)
        main.attachPrimitive(trendLine)
        trendLines.push(trendLine)
      }
    }
    return () => {
      if (mainRef.current !== main) return
      priceLines.forEach((priceLine) => main.removePriceLine(priceLine))
      trendLines.forEach((trendLine) => main.detachPrimitive(trendLine))
    }
  }, [drawings, bars, type, intraday, overlays, comparisons, panes, showVolume, locale, t])

  // Clicks while a tool is active: a horizontal line at once, a trend line after two points.
  // Read from pointer events: the chart's own click event drops a second click within 500 ms
  // (its double-click window), and drawing a line takes two quick clicks.
  useEffect(() => {
    const chart = chartRef.current
    const container = containerRef.current
    if (!chart || !container || !drawingTool || intraday) return
    let firstPoint: ChartPointDto | null = null
    let pressedAt: { x: number; y: number } | null = null
    const onPointerDown = (event: PointerEvent) => {
      pressedAt = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event: PointerEvent) => {
      const moved = pressedAt
        ? Math.abs(event.clientX - pressedAt.x) + Math.abs(event.clientY - pressedAt.y)
        : Infinity
      pressedAt = null
      // A drag pans the chart.
      if (moved > CLICK_TOLERANCE_PX) return
      const bounds = container.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top
      const pricePane = chart.paneSize(0)
      if (x > pricePane.width || y > pricePane.height) return
      const time = chart.timeScale().coordinateToTime(x)
      const price = mainRef.current?.coordinateToPrice(y)
      if (time === null || price === null || price === undefined) return
      const point = { time: fromChartTime(time, intraday), price: Number(price.toFixed(decimals)) }
      if (drawingTool === 'horizontal') {
        onDrawRef.current?.({ kind: 'horizontal', price: point.price })
      } else if (!firstPoint) {
        firstPoint = point
      } else {
        onDrawRef.current?.({ kind: 'trendline', from: firstPoint, to: point })
        firstPoint = null
      }
    }
    container.addEventListener('pointerdown', onPointerDown, true)
    container.addEventListener('pointerup', onPointerUp, true)
    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true)
      container.removeEventListener('pointerup', onPointerUp, true)
    }
  }, [drawingTool, intraday, decimals])

  useEffect(() => {
    if (livePrice !== undefined) applyLivePriceRef.current?.(livePrice)
  }, [livePrice, bars, type, intraday, overlays, comparisons, panes, showVolume, locale, t])

  const price = (value: number | undefined) =>
    value === undefined ? '' : formatNumber(value, locale, decimals)
  const legendLines = [...overlays, ...comparisons]

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} role="figure" aria-label={label} className="h-full w-full" />
      <div className="pointer-events-none absolute top-1 left-2 z-10 flex flex-wrap items-baseline gap-x-3 font-mono text-title">
        {legendLines.map((item, index) => (
          <span key={item.id} style={{ color: `var(${item.color})` }}>
            {item.label}
            {hovered?.lines[index] !== undefined && ` ${price(hovered.lines[index])}`}
          </span>
        ))}
        {hovered && (
          <>
            <span className="text-secondary">{formatChartTime(hovered.time)}</span>
            {hovered.open !== undefined && (
              <Value label={t('chart.open')} value={price(hovered.open)} />
            )}
            {hovered.high !== undefined && (
              <Value label={t('chart.high')} value={price(hovered.high)} />
            )}
            {hovered.low !== undefined && (
              <Value label={t('chart.low')} value={price(hovered.low)} />
            )}
            {hovered.close !== undefined && (
              <Value label={t('chart.close')} value={price(hovered.close)} />
            )}
            {hovered.volume !== undefined && (
              <Value
                label={t('chart.volumeShort')}
                value={formatNumber(hovered.volume, locale, 0)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-primary">
      <span className="text-secondary">{label}</span> {value}
    </span>
  )
}
