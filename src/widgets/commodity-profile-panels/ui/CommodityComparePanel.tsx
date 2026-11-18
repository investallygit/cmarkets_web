import { clsx } from 'clsx'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  COMPARISON_PERIODS,
  MAX_COMPARED,
  periodStart,
  useCommodities,
  useCommodityComparison,
  useCommodityNames,
  type ComparisonPeriod,
} from '@/entities/commodity'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { comparisonRows, toggleCode } from '../lib/comparisonRows'
import { timeTicks } from '../lib/timeTicks'

/** A colour a series, in the order chosen: the commodity's own in amber. */
const COMPARE_TOKENS = [
  '--accent-amber',
  '--chart-1',
  '--chart-3',
  '--chart-7',
  '--chart-5',
] as const

export interface ComparisonChoice {
  codes: string[]
  period: ComparisonPeriod
}

interface CommodityComparePanelProps {
  code: string
  choice: ComparisonChoice
  onChange: (choice: ComparisonChoice) => void
}

/**
 * Screen 21, CMP (spec section 9): up to five series on their monthly values, each rebased to 100
 * at the first month all of them have in the period, so that series of different frequencies stay
 * comparable; the commodity's own always among them, the others picked below. API
 * /commodities/compare.
 */
export function CommodityComparePanel({ code, choice, onChange }: CommodityComparePanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const names = useCommodityNames()
  const theme = useChartTheme()
  const today = useMarketDay()
  const list = useCommodities().data
  const from = periodStart(choice.period, today)
  const comparison = useCommodityComparison(
    choice.codes,
    from === null ? null : `${from.slice(0, 7)}-01`,
  )
  const shortName = (series: string) => {
    const item = list?.find((candidate) => candidate.code === series)
    return item ? names.name(item, true) : series
  }
  const rows = useMemo(
    () => (comparison.data ? comparisonRows(comparison.data) : []),
    [comparison.data],
  )
  // Each year once, or each quarter over a year (B10).
  const axis = useMemo(() => timeTicks(rows.map((row) => row.date)), [rows])

  return (
    <Panel
      title={t('panels.commodityCompare')}
      code="CMP"
      options={
        <PanelTabs
          value={choice.period}
          options={COMPARISON_PERIODS.map((value) => ({
            value,
            label: t(`commodities.periods.${value}`),
          }))}
          onChange={(period) => onChange({ ...choice, period })}
        />
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <QueryView query={comparison}>
        {(data) =>
          rows.length === 0 ? (
            <p className="px-3 py-2 font-sans text-label text-secondary">
              {t('commodities.compare.empty')}
            </p>
          ) : (
            <div
              role="img"
              aria-label={t('commodities.compare.summary', {
                series: data.series.map((series) => shortName(series.code)).join(', '),
                from: data.from ? format.isoDate(data.from) : '—',
                to: data.to ? format.isoDate(data.to) : '—',
              })}
              className={clsx(
                'min-h-40 flex-1 px-1 pt-2',
                comparison.isPlaceholderData && 'opacity-60',
              )}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" />
                  <XAxis
                    dataKey="date"
                    tick={theme.tick}
                    stroke={theme.grid}
                    ticks={axis.ticks}
                    interval="preserveStartEnd"
                    minTickGap={16}
                    tickFormatter={(date: string) =>
                      axis.byMonth ? format.shortMonth(date) : date.slice(0, 4)
                    }
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={theme.tick}
                    stroke={theme.grid}
                    width={48}
                    tickFormatter={(value: number) => format.number(value, 0)}
                  />
                  <ReferenceLine y={100} stroke={theme.secondary} strokeOpacity={0.6} />
                  <Tooltip
                    isAnimationActive={false}
                    cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
                    content={({ active, payload, label }) =>
                      active && payload.length > 0 ? (
                        <div className="grid grid-cols-[auto_auto] gap-x-3 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                          <span className="col-span-2 text-secondary">
                            {format.isoDate(String(label))}
                          </span>
                          {payload.map((entry) => (
                            <span key={String(entry.dataKey)} className="contents">
                              <span style={{ color: entry.color }}>
                                {shortName(String(entry.dataKey))}
                              </span>
                              <span className="text-right">
                                {format.number(Number(entry.value), 1)}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  {data.series.map((series, index) => (
                    <Line
                      key={series.code}
                      dataKey={series.code}
                      stroke={cssVar(COMPARE_TOKENS[index % COMPARE_TOKENS.length])}
                      strokeWidth={series.code === code ? 2 : 1.5}
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )
        }
      </QueryView>
      <div
        role="group"
        aria-label={t('commodities.compare.pick', { count: MAX_COMPARED })}
        className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-t px-2 py-1 font-sans text-label"
      >
        {(list ?? []).map((item) => {
          const index = choice.codes.indexOf(item.code)
          const on = index >= 0
          const full = !on && choice.codes.length >= MAX_COMPARED
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={on}
              disabled={full || item.code === code}
              title={
                full ? t('commodities.compare.full', { count: MAX_COMPARED }) : names.name(item)
              }
              onClick={() =>
                onChange({
                  ...choice,
                  codes: toggleCode(choice.codes, item.code, code, MAX_COMPARED),
                })
              }
              className={clsx(
                'inline-flex min-h-6 items-center gap-1.5 disabled:cursor-default',
                on
                  ? 'text-primary'
                  : 'text-secondary enabled:hover:text-primary disabled:opacity-40',
              )}
            >
              <span
                aria-hidden
                className={clsx('h-0.5 w-3', !on && 'bg-border')}
                style={
                  on
                    ? { backgroundColor: cssVar(COMPARE_TOKENS[index % COMPARE_TOKENS.length]) }
                    : undefined
                }
              />
              {names.name(item, true)}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
