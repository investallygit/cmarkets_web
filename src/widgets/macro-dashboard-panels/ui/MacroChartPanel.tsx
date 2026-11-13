import { clsx } from 'clsx'
import { useContext, useMemo, useState } from 'react'
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
  formatMacroAxis,
  formatMacroFigure,
  MACRO_PERIODS,
  useMacroComparison,
  useMacroIndicators,
  useMacroNames,
  type MacroPeriod,
} from '@/entities/macro'
import type { MacroComparisonDto, MacroCountryDto } from '@/shared/api/contracts'
import { useLocale } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { downloadXlsx } from '@/shared/lib/xlsx'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { TableExportContext } from '@/shared/ui/tableExport'
import { toast } from '@/shared/ui/toast'
import { macroChartRows, type MacroChartRow } from '../lib/macroChartRows'
import { niceTicks } from '../lib/niceTicks'

/** The mockup's lines: Cameroon in amber, Gabon blue, Congo teal, Chad purple, then two more. */
const LINE_TOKENS = [
  '--accent-amber',
  '--chart-1',
  '--chart-3',
  '--chart-7',
  '--chart-5',
  '--chart-6',
] as const

/** "Up to 6 countries per chart" (spec section 9). */
const MAX_COUNTRIES = LINE_TOKENS.length

/** The mockup's chart: GDP growth of the CEMAC's first four. */
const DEFAULT_COUNTRIES = ['CMR', 'GAB', 'COG', 'TCD']
const DEFAULT_INDICATOR = 'gdpGrowth'

/**
 * Screen 25's chart (spec section 9): an indicator of the 37 for up to six economies, from 1960 to
 * the latest year (2010 to 2025 by default, as the mockup), a line each; the economies are picked
 * under it, the indicator and the period above; XLSX export of the years shown. API /macro/compare.
 */
export function MacroChartPanel({
  countries,
}: {
  countries: readonly MacroCountryDto[] | undefined
}) {
  const { t } = useTranslation()
  const names = useMacroNames()
  const canExport = useContext(TableExportContext)
  const [indicator, setIndicator] = useState(DEFAULT_INDICATOR)
  const [chosen, setChosen] = useState<string[]>(DEFAULT_COUNTRIES)
  const [period, setPeriod] = useState<MacroPeriod>('15Y')
  const indicators = useMacroIndicators()
  const comparison = useMacroComparison(chosen, indicator)
  const info = indicators.data?.find((candidate) => candidate.id === indicator)
  const byCode = useMemo(
    () => new Map((countries ?? []).map((country) => [country.code, country])),
    [countries],
  )
  const economyName = (code: string) => {
    const country = byCode.get(code)
    return country ? names.economy(country) : code
  }
  const data = comparison.data
  const chart = useMemo(() => (data ? macroChartRows(data, period) : null), [data, period])

  const exportChart = () => {
    if (!data || !chart) return
    const header = [t('eco.year'), ...data.series.map((series) => economyName(series.country))]
    const body = chart.rows.map((row) => [
      row.year,
      ...data.series.map((series) => row[series.country] ?? null),
    ])
    downloadXlsx(`eco-${indicator}-${chart.from}-${chart.to}`, [header, ...body]).catch(
      (error: unknown) =>
        toast.error(
          t('menu.exportFailed', {
            message: error instanceof Error ? error.message : String(error),
          }),
        ),
    )
  }

  const toggle = (code: string) =>
    setChosen((current) =>
      current.includes(code)
        ? current.length > 1
          ? current.filter((candidate) => candidate !== code)
          : current
        : current.length < MAX_COUNTRIES
          ? [...current, code]
          : current,
    )

  return (
    <Panel
      title={info ? names.withUnit(info) : t('panels.macroChart')}
      code="ECO"
      options={
        <>
          <span className="flex min-w-0 items-center gap-1.5">
            <span>{t('eco.indicator')}</span>
            <PanelSelect
              value={indicator}
              options={(indicators.data ?? []).map((candidate) => ({
                value: candidate.id,
                label: names.name(candidate),
              }))}
              onChange={setIndicator}
              aria-label={t('eco.indicator')}
              className="max-w-44 truncate sm:max-w-64"
            />
          </span>
          {chart && (
            <span className="font-mono">
              {chart.from} – {chart.to}
            </span>
          )}
          <PanelTabs
            value={period}
            options={MACRO_PERIODS.map((value) => ({ value, label: value }))}
            onChange={setPeriod}
          />
          {canExport && (
            <button
              type="button"
              onClick={exportChart}
              disabled={!chart}
              aria-label={t('eco.exportChart')}
              className="panel-no-drag uppercase hover:text-primary disabled:opacity-40"
            >
              XLSX
            </button>
          )}
        </>
      }
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={comparison}
        isEmpty={(result) => result.series.every((series) => series.points.length === 0)}
        emptyMessage={t('eco.noFigures')}
      >
        {(result) => (
          <Lines
            comparison={result}
            rows={chart?.rows ?? []}
            economyName={economyName}
            label={t('eco.chartLabel', {
              indicator: info ? names.withUnit(info) : indicator,
              countries: result.series.map((series) => economyName(series.country)).join(', '),
              from: chart?.from,
              to: chart?.to,
            })}
          />
        )}
      </QueryView>
      {/* The economies to draw: each a 24 px target (WCAG 2.5.8), six at most. */}
      <div
        role="group"
        aria-label={t('eco.chartCountries')}
        className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t px-3 py-1 font-sans text-data"
      >
        {(countries ?? []).map((country) => {
          const index = chosen.indexOf(country.code)
          const on = index >= 0
          const full = !on && chosen.length >= MAX_COUNTRIES
          return (
            <button
              key={country.code}
              type="button"
              aria-pressed={on}
              disabled={full}
              title={full ? t('eco.chartFull', { count: MAX_COUNTRIES }) : names.economy(country)}
              onClick={() => toggle(country.code)}
              className={clsx(
                'inline-flex min-h-6 items-center gap-1.5 disabled:opacity-40',
                on ? 'text-primary' : 'text-secondary hover:text-primary',
              )}
            >
              <span
                aria-hidden
                className={clsx('h-0.5 w-3', !on && 'bg-border')}
                style={on ? { backgroundColor: cssVar(LINE_TOKENS[index]) } : undefined}
              />
              {names.economy(country, true)}
            </button>
          )
        })}
        <span className="ml-auto text-label text-secondary">
          {t('eco.chartHint', { count: MAX_COUNTRIES })}
        </span>
      </div>
    </Panel>
  )
}

interface LinesProps {
  comparison: MacroComparisonDto
  rows: readonly MacroChartRow[]
  economyName: (code: string) => string
  label: string
}

function Lines({ comparison, rows, economyName, label }: LinesProps) {
  const locale = useLocale()
  const theme = useChartTheme()
  const unit = comparison.unit
  const colors = LINE_TOKENS.map((token) => cssVar(token))
  const figures = rows.flatMap((row) =>
    comparison.series.map((series) => row[series.country]).filter((value) => value !== undefined),
  )
  const ticks = niceTicks(Math.min(...figures), Math.max(...figures))

  return (
    <div role="img" aria-label={label} className="min-h-40 flex-1 px-1 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...rows]} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" />
          <XAxis
            dataKey="year"
            type="number"
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
            tick={theme.tick}
            stroke={theme.grid}
            minTickGap={24}
          />
          <YAxis
            domain={ticks.length > 0 ? [ticks[0], ticks[ticks.length - 1]] : ['auto', 'auto']}
            ticks={ticks.length > 0 ? ticks : undefined}
            tickFormatter={(value: number) => formatMacroAxis(value, unit, locale)}
            tick={theme.tick}
            stroke={theme.grid}
            width={56}
          />
          <ReferenceLine y={0} stroke={theme.secondary} strokeOpacity={0.6} />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
            content={({ active, payload, label: year }) =>
              active && payload.length > 0 ? (
                <div className="grid grid-cols-[auto_auto_auto] items-center gap-x-2 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                  <div className="col-span-full mb-1 text-secondary">{String(year)}</div>
                  {payload.map((entry) => (
                    <div key={String(entry.dataKey)} className="contents">
                      <span
                        aria-hidden
                        className="size-2"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="font-sans">{economyName(String(entry.dataKey))}</span>
                      <span className="pl-2 text-right">
                        {formatMacroFigure(Number(entry.value), unit, locale, 'tile')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null
            }
          />
          {comparison.series.map((series, index) => (
            <Line
              key={series.country}
              dataKey={series.country}
              stroke={colors[index]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: colors[index], stroke: colors[index] }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
