import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  type ScatterShapeProps,
} from 'recharts'
import type { OptAssetClass, OptResultDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { CHART_FONT, useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { nearestPoint, percentTicks } from '../lib/frontierScale'

interface FrontierPanelProps {
  result: OptResultDto
  /** A point of the curve chosen: its allocation is computed (POST /optimizer/frontier-point). */
  onPick: (returnPct: number) => void
  picking: boolean
}

interface ChartPoint {
  x: number
  y: number
  label?: string
}

/**
 * Screen 29's efficient frontier: the best return for each level of risk under the constraints
 * (problem A at 25 returns), each security, the optimum, equal weights and the portfolio compared;
 * a click on the curve, or a point chosen in the list, computes that allocation.
 */
export function FrontierPanel({ result, onPick, picking }: FrontierPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const pct = (value: number) => format.percent(value, 2, false)
  const classColor = useMemo<Record<OptAssetClass, string>>(
    () => ({ equity: cssVar('--info'), bond: cssVar('--up'), etf: cssVar('--type-trader') }),
    [],
  )
  const frontier = result.frontier
  const curve: ChartPoint[] = frontier.points.map((point) => ({
    x: point.volatilityPct,
    y: point.returnPct,
  }))
  const xs = [
    ...curve.map((point) => point.x),
    ...frontier.securities.map((point) => point.volatilityPct),
    frontier.equalWeights.volatilityPct,
    frontier.portfolio?.volatilityPct ?? 0,
  ]
  const ys = [
    ...curve.map((point) => point.y),
    ...frontier.securities.map((point) => point.returnPct),
    frontier.equalWeights.returnPct,
    frontier.portfolio?.returnPct ?? frontier.optimal.returnPct,
  ]
  const xAxis = percentTicks(xs, 5)
  const yAxis = percentTicks(ys)
  const pick = (returnPct: number) => {
    const point = nearestPoint(frontier.points, returnPct)
    if (point && !picking) onPick(point.returnPct)
  }

  const curveShape = (props: ScatterShapeProps) => (
    <circle
      cx={props.cx}
      cy={props.cy}
      r={5}
      fill={theme.info}
      fillOpacity={0.35}
      stroke="none"
      cursor="pointer"
      onClick={() => pick(Number((props.payload as ChartPoint | undefined)?.y))}
    />
  )

  return (
    <Panel
      title={t('opt.frontier.title')}
      code="OPT RES"
      options={
        <span className="font-sans text-label text-secondary uppercase">
          {t('opt.frontier.axes')}
        </span>
      }
    >
      <div className="flex h-full flex-col">
        <div
          className="min-h-0 flex-1"
          role="img"
          aria-label={`${t('opt.frontier.title')}: ${t('opt.frontier.optimal', { ret: pct(frontier.optimal.returnPct), vol: pct(frontier.optimal.volatilityPct) })}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 88, bottom: 8, left: 4 }}>
              <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" vertical={false} />
              <XAxis
                type="number"
                dataKey="x"
                domain={xAxis.domain}
                ticks={xAxis.ticks}
                tick={theme.tick}
                tickFormatter={(value: number) => `${value}%`}
                stroke={theme.grid}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                tick={theme.tick}
                tickFormatter={(value: number) => `${value}%`}
                stroke={theme.grid}
                width={44}
              />
              <Scatter
                data={curve}
                line={{ stroke: theme.info, strokeWidth: 2 }}
                shape={curveShape}
                isAnimationActive={false}
              />
              <Scatter
                data={frontier.securities.map((point) => ({
                  x: point.volatilityPct,
                  y: point.returnPct,
                  label: point.code,
                  assetClass: point.assetClass,
                }))}
                isAnimationActive={false}
                shape={(props: ScatterShapeProps) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={classColor[(props.payload as { assetClass: OptAssetClass }).assetClass]}
                  />
                )}
              >
                <LabelList
                  dataKey="label"
                  position="right"
                  fill={theme.secondary}
                  fontFamily={CHART_FONT}
                  fontSize={10}
                />
              </Scatter>
              <Scatter
                data={[
                  {
                    x: frontier.equalWeights.volatilityPct,
                    y: frontier.equalWeights.returnPct,
                    label: t('opt.frontier.equal', {
                      ret: pct(frontier.equalWeights.returnPct),
                      vol: pct(frontier.equalWeights.volatilityPct),
                    }),
                  },
                ]}
                isAnimationActive={false}
                shape={(props: ScatterShapeProps) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth={1.5}
                  />
                )}
              >
                <LabelList
                  dataKey="label"
                  position="right"
                  fill={theme.secondary}
                  fontFamily={CHART_FONT}
                  fontSize={10}
                />
              </Scatter>
              {frontier.portfolio && (
                <Scatter
                  data={[
                    {
                      x: frontier.portfolio.volatilityPct,
                      y: frontier.portfolio.returnPct,
                      label: t('opt.frontier.portfolio', {
                        name: frontier.portfolio.name,
                        ret: pct(frontier.portfolio.returnPct),
                        vol: pct(frontier.portfolio.volatilityPct),
                      }),
                    },
                  ]}
                  isAnimationActive={false}
                  shape={(props: ScatterShapeProps) => (
                    <rect
                      x={Number(props.cx) - 5}
                      y={Number(props.cy) - 5}
                      width={10}
                      height={10}
                      fill={theme.warning}
                    />
                  )}
                >
                  <LabelList
                    dataKey="label"
                    position="right"
                    fill={theme.warning}
                    fontFamily={CHART_FONT}
                    fontSize={10}
                  />
                </Scatter>
              )}
              <Scatter
                data={[
                  {
                    x: frontier.optimal.volatilityPct,
                    y: frontier.optimal.returnPct,
                    label: t('opt.frontier.optimal', {
                      ret: pct(frontier.optimal.returnPct),
                      vol: pct(frontier.optimal.volatilityPct),
                    }),
                  },
                ]}
                isAnimationActive={false}
                shape={(props: ScatterShapeProps) => (
                  <circle cx={props.cx} cy={props.cy} r={7} fill={theme.amber} />
                )}
              >
                <LabelList
                  dataKey="label"
                  position="left"
                  fill={theme.amber}
                  fontFamily={CHART_FONT}
                  fontSize={11}
                  fontWeight={600}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-2 py-1 font-sans text-label text-secondary">
          <span>{t('opt.frontier.caption')}</span>
          <Select<string>
            value=""
            disabled={picking}
            options={[
              { value: '', label: t('opt.frontier.pickPlaceholder') },
              ...frontier.points.map((point) => ({
                value: String(point.returnPct),
                label: t('opt.frontier.point', {
                  ret: pct(point.returnPct),
                  vol: pct(point.volatilityPct),
                }),
              })),
            ]}
            onChange={(value) => value && pick(Number(value))}
            aria-label={t('opt.frontier.pick')}
          />
        </div>
      </div>
    </Panel>
  )
}
