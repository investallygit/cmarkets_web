import {
  BarSeries,
  CandlestickSeries,
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
import { useTranslation } from 'react-i18next'
import type { HistoryPointDto, PriceBarDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { formatCompact, formatNumber } from '@/shared/lib/format'
import { cssVar, withAlpha } from '@/shared/lib/theme'
import { baseChartOptions, chartLocalization, formatChartTime, toChartTime } from './chartOptions'
import { toCloseLine, toLineData, toOhlcData, toVolumeData, withLivePrice } from './priceBars'

export type PriceChartType = 'candles' | 'bars' | 'line'

/** A line over the prices, such as a moving average returned by /indicators. */
export interface PriceChartOverlay {
  id: string
  label: string
  /** Design token, e.g. "--accent-amber". */
  color: `--${string}`
  points: readonly HistoryPointDto[]
}

interface PriceChartProps {
  bars: readonly PriceBarDto[]
  type?: PriceChartType
  intraday: boolean
  decimals: number
  /** Keep the array stable between renders (query data or useMemo): a new one redraws the chart. */
  overlays?: readonly PriceChartOverlay[]
  showVolume?: boolean
  /** Latest real-time price, applied to the last bar. */
  livePrice?: number
}

/** Values of the bar under the crosshair. */
interface HoveredBar {
  time: Time
  open?: number
  high?: number
  low?: number
  close?: number
  volume?: number
  overlays: (number | undefined)[]
}

type MainSeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Bar'> | ISeriesApi<'Line'>

const NO_OVERLAYS: readonly PriceChartOverlay[] = []
/** Stretch factor of the volume pane; the price pane has 1, so volume gets a fifth. */
const VOLUME_PANE_STRETCH = 0.25

/**
 * Price chart of a security (spec section 9, screen 2): candles, bars or line, overlays such as
 * the 20- and 50-day moving averages, volume below, the last price in amber on the axis.
 * The mouse wheel zooms, dragging pans, the crosshair shows the values of the bar below it.
 */
export function PriceChart({
  bars,
  type = 'candles',
  intraday,
  decimals,
  overlays = NO_OVERLAYS,
  showVolume = true,
  livePrice,
}: PriceChartProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  /** Applies a real-time price to the series currently drawn. */
  const applyLivePriceRef = useRef<((price: number) => void) | null>(null)
  const [hovered, setHovered] = useState<HoveredBar | null>(null)

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
    chartRef.current?.applyOptions({ localization: chartLocalization(locale, decimals) })
  }, [locale, decimals])

  // Every series is rebuilt when the data, the chart type or the language change.
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const up = cssVar('--up')
    const down = cssVar('--down')
    const amber = cssVar('--accent-amber')
    const hidden = { lastValueVisible: false, priceLineVisible: false }
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

    const overlaySeries = overlays.map((overlay) => {
      const series = chart.addSeries(LineSeries, {
        ...hidden,
        color: cssVar(overlay.color),
        lineWidth: 1,
        crosshairMarkerVisible: false,
      })
      series.setData(toLineData(overlay.points, intraday))
      return series
    })

    let volume: ISeriesApi<'Histogram'> | null = null
    let volumeLabel: ITextWatermarkPluginApi<Time> | null = null
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
        1,
      )
      volume.setData(toVolumeData(bars, intraday, withAlpha(up, 0.5), withAlpha(down, 0.5)))
      const [pricePane, volumePane] = chart.panes()
      pricePane.setStretchFactor(1)
      volumePane.setStretchFactor(VOLUME_PANE_STRETCH)
      volumeLabel = createTextWatermark(volumePane, {
        horzAlign: 'left',
        vertAlign: 'top',
        lines: [
          {
            text: t('chart.volume'),
            color: cssVar('--text-secondary'),
            fontSize: 11,
            fontFamily: "'Inter Variable', sans-serif",
          },
        ],
      })
    }

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
      const valueOf = (series: ISeriesApi<'Line'> | ISeriesApi<'Histogram'> | null) => {
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
        overlays: overlaySeries.map(valueOf),
      })
    }
    chart.subscribeCrosshairMove(onCrosshairMove)
    chart.timeScale().fitContent()

    return () => {
      applyLivePriceRef.current = null
      // On unmount the chart is already removed, with its series.
      if (chartRef.current !== chart) return
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      volumeLabel?.detach()
      // Volume first: an emptied price pane would be dropped and the volume pane take its place.
      for (const series of [volume, ...overlaySeries, main]) if (series) chart.removeSeries(series)
    }
  }, [bars, type, intraday, overlays, showVolume, locale, t])

  useEffect(() => {
    if (livePrice !== undefined) applyLivePriceRef.current?.(livePrice)
  }, [livePrice, bars, type, intraday, overlays, showVolume, locale, t])

  const price = (value: number | undefined) =>
    value === undefined ? '' : formatNumber(value, locale, decimals)

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute top-1 left-2 z-10 flex flex-wrap items-baseline gap-x-3 font-mono text-title">
        {overlays.map((overlay, index) => (
          <span key={overlay.id} style={{ color: `var(${overlay.color})` }}>
            {overlay.label}
            {hovered?.overlays[index] !== undefined && ` ${price(hovered.overlays[index])}`}
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
