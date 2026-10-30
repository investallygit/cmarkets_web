import { clsx } from 'clsx'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  PERFORMANCE_RANGES,
  rangeFrom,
  usePerformance,
  type PerformanceRange,
} from '@/entities/portfolio'
import type { PerformanceDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { monthTicks } from '../lib/monthTicks'

interface PortfolioPerformancePanelProps {
  portfolioId: string
  /** full: the Performance tab, with the period's figures under the chart. */
  variant?: 'compact' | 'full'
}

/**
 * Screen 5, performance vs benchmark: the portfolio in amber, the benchmark in grey, both at
 * base 100 (spec section 9). Time-weighted, so deposits and withdrawals do not show as gains.
 * API GET /portfolios/{id}/performance.
 */
export function PortfolioPerformancePanel({
  portfolioId,
  variant = 'compact',
}: PortfolioPerformancePanelProps) {
  const { t } = useTranslation()
  const [range, setRange] = useState<PerformanceRange>('1y')
  const today = useMarketDay()
  const performance = usePerformance(portfolioId, { from: rangeFrom(range, today) })
  const tabs = useMemo(
    () => PERFORMANCE_RANGES.map((value) => ({ value, label: t(`portfolio.ranges.${value}`) })),
    [t],
  )

  return (
    <Panel
      title={t('panels.performance')}
      code="PORT"
      options={<PanelTabs value={range} options={tabs} onChange={setRange} />}
      bodyClassName="flex flex-col"
    >
      <QueryView query={performance}>
        {(data) =>
          data.series.length < 2 ? (
            <PanelEmpty message={t('portfolio.performance.noHistory')} />
          ) : (
            <div
              className={clsx(
                'flex min-h-0 flex-1 flex-col transition-opacity',
                performance.isPlaceholderData && 'opacity-60',
              )}
            >
              <PerformanceChart performance={data} />
              {variant === 'full' && <PeriodFigures performance={data} />}
            </div>
          )
        }
      </QueryView>
    </Panel>
  )
}

function benchmarkLabel(t: TFunction, performance: PerformanceDto): string {
  return performance.benchmark.kind === 'price'
    ? t('portfolio.performance.priceIndex', { name: performance.benchmark.name })
    : performance.benchmark.name
}

function PerformanceChart({ performance }: { performance: PerformanceDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const theme = useChartTheme()
  const { series } = performance
  const dates = series.map((point) => point.date)
  const ticks = monthTicks(dates)
  const month = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        timeZone: 'UTC',
      }),
    [locale],
  )
  // "Oct 25 · Jan · Apr · Jul · Oct 26", as in the mockup.
  const tickLabel = (date: string) => {
    const name = month.format(new Date(`${date}T12:00:00Z`))
    const withYear = date === ticks.at(0) || date.slice(5, 7) === '01' || date === ticks.at(-1)
    return withYear ? `${name} ${date.slice(2, 4)}` : name
  }
  const last = series.at(-1)
  const benchmark = benchmarkLabel(t, performance)
  const names = { portfolio: t('portfolio.performance.portfolio'), benchmark }
  // The legend carries the last value of each line, which an end label would set on the axis.
  const legend = [
    {
      key: 'portfolio',
      label: t('portfolio.performance.portfolioBase'),
      color: theme.amber,
      value: last?.portfolio ?? null,
    },
    { key: 'benchmark', label: benchmark, color: theme.secondary, value: last?.benchmark ?? null },
  ]

  return (
    <>
      <ul className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 px-3 pt-2 font-sans text-data">
        {legend.map((item) => (
          <li key={item.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-3.5" style={{ backgroundColor: item.color }} />
            {item.label}
            {item.value !== null && (
              <span className="font-mono font-semibold">{format.number(item.value, 1)}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="min-h-0 flex-1 px-1 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 30 }}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={tickLabel}
              tick={theme.tick}
              stroke={theme.grid}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => format.number(value, 0)}
              tick={theme.tick}
              stroke={theme.grid}
              width={44}
              orientation="right"
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload.length > 0 ? (
                  <div className="flex flex-col gap-0.5 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                    <span className="text-secondary">{format.isoDate(String(label))}</span>
                    {payload.map((entry) => (
                      <span key={String(entry.dataKey)} className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className="h-0.5 w-3"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-semibold">
                          {format.number(Number(entry.value), 2)}
                        </span>
                        <span className="font-sans text-secondary">
                          {names[entry.dataKey as keyof typeof names]}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : null
              }
            />
            <Line
              dataKey="benchmark"
              stroke={theme.secondary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: theme.secondary, stroke: theme.panel, strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              dataKey="portfolio"
              stroke={theme.amber}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: theme.amber, stroke: theme.panel, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* The chart in words, for screen readers. */}
      <p className="sr-only">
        {t('portfolio.performance.summary', {
          from: format.isoDate(performance.from),
          to: format.isoDate(performance.to),
          portfolio: format.percent(performance.twrPct),
          benchmark:
            performance.benchmarkPct === null ? '—' : format.percent(performance.benchmarkPct),
        })}
      </p>
    </>
  )
}

/** The period's returns under the chart of the Performance tab. */
function PeriodFigures({ performance }: { performance: PerformanceDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const figures = [
    {
      label: t('portfolio.performance.twr'),
      value: <ChangeText value={performance.twrPct} percent />,
    },
    {
      label: t('portfolio.performance.annualized'),
      value:
        performance.annualizedPct === null ? (
          '—'
        ) : (
          <ChangeText value={performance.annualizedPct} percent />
        ),
    },
    {
      label: benchmarkLabel(t, performance),
      value:
        performance.benchmarkPct === null ? (
          '—'
        ) : (
          <ChangeText value={performance.benchmarkPct} percent />
        ),
    },
    {
      label: t('portfolio.performance.outperformance'),
      value:
        performance.outperformancePts === null ? (
          '—'
        ) : (
          <ChangeText value={performance.outperformancePts} suffix={t('portfolio.points')} />
        ),
    },
    {
      label: t('portfolio.performance.irr'),
      value: performance.irrPct === null ? '—' : <ChangeText value={performance.irrPct} percent />,
    },
  ]
  return (
    <dl className="flex shrink-0 flex-wrap gap-x-8 gap-y-2 border-t px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <dt className="font-sans text-title text-secondary">{t('portfolio.performance.period')}</dt>
        <dd className="font-mono text-data font-semibold">
          {format.isoDate(performance.from)} – {format.isoDate(performance.to)}
        </dd>
      </div>
      {figures.map((figure) => (
        <div key={figure.label} className="flex flex-col gap-0.5">
          <dt className="font-sans text-title text-secondary">{figure.label}</dt>
          <dd className="font-mono text-data font-semibold">{figure.value}</dd>
        </div>
      ))}
    </dl>
  )
}
