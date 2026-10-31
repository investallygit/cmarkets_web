import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { priceDecimals, useLiveQuote } from '@/entities/quote'
import { useIndicator, useSecurityHistory } from '@/entities/security'
import { useHasPermission } from '@/entities/session'
import { CompareBar, useComparisonLines, type ComparedItem } from '@/features/compare-securities'
import { DrawingTools, useDrawings } from '@/features/draw-on-chart'
import type { CurrencyCode, PriceBarDto, SecurityType } from '@/shared/api/contracts'
import { isIntraday, type ChartPeriod } from '@/shared/lib/chartPeriods'
import {
  PriceChart,
  type DrawingTool,
  type PriceChartLine,
  type PriceChartPane,
  type PriceChartType,
} from '@/shared/ui/charts/PriceChart'
import { useChartLabel } from '@/shared/ui/charts/useChartLabel'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs, PanelToggle } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

type Indicator = 'ma20' | 'ma50' | 'bollinger' | 'rsi' | 'macd'

const COMPACT_PERIODS: readonly ChartPeriod[] = ['1M', '3M', '6M', '1Y', '5Y']
const FULL_PERIODS: readonly ChartPeriod[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', '10Y']
const CHART_TYPES: readonly PriceChartType[] = ['candles', 'bars', 'line']
const COMPACT_INDICATORS: readonly Indicator[] = ['ma20', 'ma50']
const FULL_INDICATORS: readonly Indicator[] = ['ma20', 'ma50', 'bollinger', 'rsi', 'macd']
const NOTHING_COMPARED: readonly ComparedItem[] = []
const NO_BARS: readonly PriceBarDto[] = []

interface PriceChartPanelProps {
  securityId: string
  /** The security's code, which names the chart for screen readers. */
  code: string
  securityType: SecurityType
  currency: CurrencyCode
  /** full: the GP tab, with intraday periods, more indicators, comparison and drawing tools. */
  variant?: 'compact' | 'full'
}

function Separator() {
  return <span aria-hidden>·</span>
}

/**
 * Screen 2, price chart (DES and GP tabs): candles and 20- / 50-day moving averages by default,
 * volume below. API /securities/{id}/history, /indicators/{id}, /charts/{id}/drawings.
 */
export function PriceChartPanel({
  securityId,
  code,
  securityType,
  currency,
  variant = 'compact',
}: PriceChartPanelProps) {
  const { t } = useTranslation()
  const full = variant === 'full'
  // Intraday data comes with the order book: not for Students (spec section 12).
  const intradayAllowed = useHasPermission('market:orderbook')
  const periods = (full ? FULL_PERIODS : COMPACT_PERIODS).filter(
    (candidate) => intradayAllowed || !isIntraday(candidate),
  )
  const [period, setPeriod] = useState<ChartPeriod>(full ? '1Y' : '6M')
  const [chartType, setChartType] = useState<PriceChartType>('candles')
  const [indicators, setIndicators] = useState<ReadonlySet<Indicator>>(
    () => new Set(['ma20', 'ma50']),
  )
  const [showVolume, setShowVolume] = useState(true)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compared, setCompared] = useState<ComparedItem[]>([])
  const [tool, setTool] = useState<DrawingTool | null>(null)

  const history = useSecurityHistory(securityId, period)
  const daily = !isIntraday(period)
  const comparing = full && compared.length > 0
  // Moving averages and bands would be rebased too: they step aside during a comparison.
  const shows = (indicator: Indicator) => indicators.has(indicator) && daily && !comparing
  const [ma20On, ma50On, bandsOn, rsiOn, macdOn] = [
    shows('ma20'),
    shows('ma50'),
    full && shows('bollinger'),
    full && shows('rsi'),
    full && shows('macd'),
  ]
  const ma20 = useIndicator(securityId, 'SMA', 20, period, ma20On).data
  const ma50 = useIndicator(securityId, 'SMA', 50, period, ma50On).data
  const bands = useIndicator(securityId, 'BBANDS', 20, period, bandsOn).data
  const rsi = useIndicator(securityId, 'RSI', 14, period, rsiOn).data
  const macd = useIndicator(securityId, 'MACD', 26, period, macdOn).data
  const comparisons = useComparisonLines(full ? compared : NOTHING_COMPARED, period)
  const { drawings, add, undo, clear } = useDrawings(securityId)
  const livePrice = useLiveQuote(securityId)?.last
  const drawingTool = full && daily && !comparing ? tool : null
  const decimals = priceDecimals(securityType, currency)
  const label = useChartLabel(
    t('chart.priceOf', { code }),
    period,
    history.data?.bars ?? NO_BARS,
    decimals,
    livePrice,
  )

  const overlays = useMemo<PriceChartLine[]>(() => {
    const lines: PriceChartLine[] = []
    const bollinger = t('chart.indicators.bollinger')
    if (ma20On && ma20) {
      lines.push({
        id: 'ma20',
        label: t('chart.indicators.ma20'),
        color: '--accent-amber',
        points: ma20.lines.value,
      })
    }
    if (ma50On && ma50) {
      lines.push({
        id: 'ma50',
        label: t('chart.indicators.ma50'),
        color: '--info',
        points: ma50.lines.value,
      })
    }
    if (bandsOn && bands) {
      lines.push(
        {
          id: 'bands-upper',
          label: `${bollinger} +`,
          color: '--text-secondary',
          points: bands.lines.upper,
        },
        {
          id: 'bands-middle',
          label: bollinger,
          color: '--text-secondary',
          points: bands.lines.middle,
        },
        {
          id: 'bands-lower',
          label: `${bollinger} −`,
          color: '--text-secondary',
          points: bands.lines.lower,
        },
      )
    }
    return lines
  }, [t, ma20On, ma20, ma50On, ma50, bandsOn, bands])

  const panes = useMemo<PriceChartPane[]>(() => {
    const result: PriceChartPane[] = []
    if (rsiOn && rsi) {
      result.push({
        id: 'rsi',
        label: `${t('chart.indicators.rsi')} 14`,
        lines: [
          {
            id: 'rsi',
            label: t('chart.indicators.rsi'),
            color: '--accent-amber',
            points: rsi.lines.value,
          },
        ],
        levels: [30, 70],
      })
    }
    if (macdOn && macd) {
      result.push({
        id: 'macd',
        label: `${t('chart.indicators.macd')} 12 26 9`,
        lines: [
          {
            id: 'macd',
            label: t('chart.indicators.macd'),
            color: '--accent-amber',
            points: macd.lines.macd,
          },
          { id: 'signal', label: 'Signal', color: '--info', points: macd.lines.signal },
          {
            id: 'histogram',
            label: '',
            color: '--text-secondary',
            points: macd.lines.histogram,
            kind: 'histogram',
          },
        ],
      })
    }
    return result
  }, [t, rsiOn, rsi, macdOn, macd])

  const toggle = (indicator: Indicator, on: boolean) =>
    setIndicators((current) => {
      const next = new Set(current)
      if (on) next.add(indicator)
      else next.delete(indicator)
      return next
    })
  const typeLabel = (type: PriceChartType) => t(`chart.types.${type}`)
  const nextType = CHART_TYPES[(CHART_TYPES.indexOf(chartType) + 1) % CHART_TYPES.length]

  const options = (
    <>
      <PanelTabs
        value={period}
        options={periods.map((value) => ({ value, label: value }))}
        onChange={setPeriod}
      />
      <Separator />
      {full ? (
        <PanelTabs
          value={chartType}
          options={CHART_TYPES.map((value) => ({ value, label: typeLabel(value) }))}
          onChange={setChartType}
        />
      ) : (
        <button
          type="button"
          onClick={() => setChartType(nextType)}
          className="panel-no-drag uppercase hover:text-primary"
        >
          {typeLabel(chartType)}
        </button>
      )}
      <Separator />
      {(full ? FULL_INDICATORS : COMPACT_INDICATORS).map((indicator) => (
        <PanelToggle
          key={indicator}
          active={indicators.has(indicator)}
          disabled={!daily || comparing}
          onChange={(on) => toggle(indicator, on)}
        >
          {t(`chart.indicators.${indicator}`)}
        </PanelToggle>
      ))}
      <Separator />
      <PanelToggle active={showVolume} onChange={setShowVolume}>
        {t('chart.volume')}
      </PanelToggle>
      {full && (
        <>
          <PanelToggle active={compareOpen || comparing} onChange={setCompareOpen}>
            {t('chart.compare')}
          </PanelToggle>
          <Separator />
          <DrawingTools
            tool={drawingTool}
            onToolChange={setTool}
            count={drawings.length}
            onUndo={undo}
            onClear={clear}
            disabled={!daily || comparing}
          />
        </>
      )}
    </>
  )

  return (
    <Panel title={t('panels.priceChart')} code="GP" options={options}>
      <div className="flex h-full flex-col">
        {full && (compareOpen || comparing) && (
          <CompareBar securityId={securityId} items={compared} onChange={setCompared} />
        )}
        <div className="relative min-h-0 flex-1">
          <QueryView query={history}>
            {(data) => (
              <PriceChart
                bars={data.bars}
                label={label}
                type={chartType}
                intraday={isIntraday(data.period)}
                decimals={decimals}
                overlays={overlays}
                comparisons={comparisons}
                panes={panes}
                showVolume={showVolume}
                livePrice={livePrice}
                drawings={drawings}
                drawingTool={drawingTool}
                onDraw={add}
              />
            )}
          </QueryView>
          {drawingTool && (
            <p className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2 border bg-panel-header px-2 py-0.5 font-sans text-data text-secondary">
              {t(`chart.draw.${drawingTool}Hint`)}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}
