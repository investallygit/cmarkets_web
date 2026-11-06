import { clsx } from 'clsx'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type DotItemDotProps,
} from 'recharts'
import { CURVE_COLOR_TOKENS, useMaturityLabel, useYieldCurves } from '@/entities/yield-curve'
import type { YieldCurveDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES, isCemacCountry, type CemacCountry } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'
import { COMPARE_OFFSETS, compareDate, useCurveView } from '../model/curveView'

/** Data key of the comparison curve in the chart rows. */
const PAST = 'past'

interface YieldCurvesPanelProps {
  /** Country of the bond in the calculator: its curve gets the comparison with a past date. */
  focusCountry: string | undefined
}

/**
 * Screen 4, CEMAC sovereign yield curves: one colour per country, maturities on a log scale,
 * the focus country dashed at a past date; a click on a legend item hides that country.
 * API /yield-curves.
 */
export function YieldCurvesPanel({ focusCountry }: YieldCurvesPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const compare = useCurveView((state) => state.compare)
  const setCompare = useCurveView((state) => state.setCompare)
  const curves = useYieldCurves()
  const date = curves.data?.at(0)?.date
  const country = focusCountry && isCemacCountry(focusCountry) ? focusCountry : undefined
  const pastDate = date && country ? compareDate(date, compare) : null
  const past = useYieldCurves(
    { date: pastDate ?? undefined, country },
    { enabled: pastDate !== null },
  )
  // While another date loads, or once the comparison is off, the previous curve is not shown.
  const pastCurve =
    pastDate && !past.isPlaceholderData
      ? past.data?.find((curve) => curve.country === country)
      : undefined

  return (
    <Panel
      title={t('panels.yieldCurves')}
      code="YCRV"
      options={
        <>
          {date && <span>{t('curves.date', { date: format.isoDate(date) })}</span>}
          <span aria-hidden>·</span>
          <span>{t('curves.compareTo')}</span>
          <PanelSelect
            value={compare}
            options={COMPARE_OFFSETS.map((value) => ({
              value,
              label: t(`curves.offsets.${value}`),
            }))}
            onChange={setCompare}
            aria-label={t('curves.compareTo')}
          />
        </>
      }
      bodyClassName="flex flex-col"
    >
      <QueryView query={curves}>
        {(data) => (
          <CurvesChart
            curves={data}
            pastCurve={pastCurve}
            focusCountry={country}
            pastLabel={t(`curves.offsets.${compare}`)}
          />
        )}
      </QueryView>
    </Panel>
  )
}

interface CurvesChartProps {
  curves: YieldCurveDto[]
  pastCurve: YieldCurveDto | undefined
  focusCountry: CemacCountry | undefined
  pastLabel: string
}

function CurvesChart({ curves, pastCurve, focusCountry, pastLabel }: CurvesChartProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const maturityLabel = useMaturityLabel()
  const hidden = useCurveView((state) => state.hidden)
  const toggleCountry = useCurveView((state) => state.toggleCountry)
  const colors = useMemo(
    () =>
      Object.fromEntries(
        CEMAC_COUNTRIES.map((code) => [code, cssVar(CURVE_COLOR_TOKENS[code])]),
      ) as Record<CemacCountry, string>,
    [],
  )

  const visible = curves.filter(
    (curve) => isCemacCountry(curve.country) && !hidden.includes(curve.country),
  )
  const past = pastCurve && !hidden.includes(pastCurve.country) ? pastCurve : undefined
  const maturities = [
    ...new Set(curves.flatMap((curve) => curve.points.map((point) => point.years))),
  ].sort((a, b) => a - b)
  const rows = maturities.map((years) => {
    const row: Record<string, number> = { years }
    for (const curve of [...curves, ...(past ? [{ ...past, country: PAST }] : [])]) {
      const point = curve.points.find((candidate) => candidate.years === years)
      if (point) row[curve.country] = point.yieldPct
    }
    return row
  })
  const auctionPoints = new Set(
    curves.flatMap((curve) =>
      curve.points
        .filter((point) => point.source === 'auction')
        .map((point) => `${curve.country}|${point.years}`),
    ),
  )

  // Half-point ticks around the curves shown.
  const shown = [...visible, ...(past ? [past] : [])].flatMap((curve) =>
    curve.points.map((point) => point.yieldPct),
  )
  const low = Math.floor((Math.min(...shown, 5) - 0.25) * 2) / 2
  const high = Math.ceil((Math.max(...shown, 5) + 0.25) * 2) / 2
  const yTicks = Array.from({ length: Math.round((high - low) * 2) + 1 }, (_, i) => low + i / 2)
  const countryName = (code: string) =>
    code === PAST && past
      ? t('curves.pastLegend', { country: format.country(past.country), offset: pastLabel })
      : format.country(code)

  // Small squares at each maturity, as in the mockup.
  const squareDot =
    (color: string) =>
    ({ cx, cy, index }: DotItemDotProps) =>
      typeof cx === 'number' && typeof cy === 'number' ? (
        <rect key={index} x={cx - 2} y={cy - 2} width={4} height={4} fill={color} />
      ) : null

  return (
    <>
      <div className="min-h-0 flex-1 px-1 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" />
            <XAxis
              dataKey="years"
              type="number"
              scale="log"
              domain={[maturities.at(0) ?? 0.25, maturities.at(-1) ?? 10]}
              ticks={maturities}
              tickFormatter={(years: number) => maturityLabel(years)}
              tick={theme.tick}
              stroke={theme.grid}
              allowDataOverflow
            />
            <YAxis
              domain={[low, high]}
              ticks={yTicks}
              tickFormatter={(value: number) => format.percent(value, 1, false)}
              tick={theme.tick}
              stroke={theme.grid}
              width={52}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload, label }) =>
                active && payload.length > 0 ? (
                  <div className="grid grid-cols-[auto_auto_auto_auto] items-center gap-x-2 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                    <div className="col-span-4 mb-1 text-secondary">
                      {maturityLabel(Number(label))}
                    </div>
                    {payload.map((entry) => {
                      const key = String(entry.dataKey)
                      return (
                        <Fragment key={key}>
                          <span
                            aria-hidden
                            className="size-2"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-sans">{countryName(key)}</span>
                          <span className="pl-2 text-right">
                            {format.percent(Number(entry.value), 2, false)}
                          </span>
                          <span className="text-secondary">
                            {auctionPoints.has(`${key}|${Number(label)}`) && t('curves.auction')}
                          </span>
                        </Fragment>
                      )
                    })}
                  </div>
                ) : null
              }
            />
            {visible.map((curve) => {
              const color = colors[curve.country as CemacCountry]
              return (
                <Line
                  key={curve.country}
                  dataKey={curve.country}
                  stroke={color}
                  strokeWidth={curve.country === focusCountry ? 2 : 1.5}
                  dot={squareDot(color)}
                  activeDot={{ r: 3, fill: color, stroke: color }}
                  isAnimationActive={false}
                  connectNulls
                />
              )
            })}
            {past && (
              <Line
                dataKey={PAST}
                stroke={colors[past.country as CemacCountry]}
                strokeWidth={1.25}
                strokeDasharray="4 3"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Each country is a 24 px target (WCAG 2.5.8): the legend wraps close in a narrow window. */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 font-sans text-data">
        {CEMAC_COUNTRIES.map((code) => {
          const off = hidden.includes(code)
          return (
            <button
              key={code}
              type="button"
              aria-pressed={!off}
              title={t(off ? 'curves.show' : 'curves.hide', { country: format.country(code) })}
              onClick={() => toggleCountry(code)}
              className={clsx(
                'inline-flex min-h-6 items-center gap-1.5',
                off ? 'text-secondary line-through' : 'text-primary hover:text-accent-amber',
              )}
            >
              <span
                aria-hidden
                className="h-0.5 w-3"
                style={{ backgroundColor: off ? theme.grid : colors[code] }}
              />
              {format.country(code)}
            </button>
          )
        })}
        {past && (
          <span
            className="inline-flex items-center gap-1.5 font-mono"
            style={{ color: colors[past.country as CemacCountry] }}
          >
            <span
              aria-hidden
              className="w-3 border-t border-dashed"
              style={{ borderColor: colors[past.country as CemacCountry] }}
            />
            {countryName(PAST)}
          </span>
        )}
      </div>
    </>
  )
}
