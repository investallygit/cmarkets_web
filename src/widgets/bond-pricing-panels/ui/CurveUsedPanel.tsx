import { clsx } from 'clsx'
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
import { cmarketCurveId, useBondPrice, useCurve } from '@/entities/bond'
import type { BondPriceDto, BondPriceRequestDto, CurvePointDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PricedView } from './PricedView'
import { curveWindow, priceTicks, yieldTicks } from '../lib/axes'
import { modeKey } from '../lib/modes'

interface CurveUsedPanelProps {
  request: BondPriceRequestDto | null
  /** The bond's country: its CMarket curve is drawn dashed beside the rates entered. */
  country: string | null
}

/**
 * Screen 16, right-hand panel from a curve or rates entered (fifth version): the curve used, its
 * nodes in blue and the bond's cash-flow dates in amber at the rate each is discounted at; or the
 * rates entered in amber with the CMarket curve of the bond's country dashed for comparison.
 */
export function CurveUsedPanel({ request, country }: CurveUsedPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const data = useBondPrice(request).data
  const mode = data ? modeKey(data.discount.mode) : 'curve'
  const curve = data?.discount.curve

  return (
    <Panel
      title={t(
        mode === 'rates' ? 'bondPricing.curveUsed.ratesTitle' : 'bondPricing.curveUsed.title',
      )}
      code="BP"
      options={
        <span>
          {mode === 'rates'
            ? t('bondPricing.curveUsed.ratesOptions')
            : curve?.kind === 'custom'
              ? t('bondPricing.curveUsed.customOptions', { name: curve.name })
              : t('bondPricing.curveUsed.options', {
                  country: format.country(curve?.country ?? country ?? ''),
                })}
        </span>
      }
      bodyClassName="flex flex-col"
    >
      <PricedView request={request}>
        {(priced, stale) => <Chart data={priced} stale={stale} country={country} />}
      </PricedView>
    </Panel>
  )
}

function Chart({
  data,
  stale,
  country,
}: {
  data: BondPriceDto
  stale: boolean
  country: string | null
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const rates = modeKey(data.discount.mode) === 'rates'
  const cmarket = useCurve(
    rates && country ? cmarketCurveId(country) : null,
    data.settlementDate,
  ).data
  const curve: CurvePointDto[] = (rates ? cmarket?.points : data.discount.curve?.points) ?? []
  const flows = data.cashFlows.map(({ years, zeroRatePct }) => ({ years, ratePct: zeroRatePct }))
  const { high: lastYear, points } = curveWindow(
    curve,
    flows.map((flow) => flow.years),
  )
  const values = [...points, ...flows].map((point) => point.ratePct)
  const yAxis = priceTicks(Math.min(...values), Math.max(...values))
  const rate = (value: number) => format.percent(value, 3, false)
  const curveName = rates ? cmarket : data.discount.curve
  const curveDate = curveName ? format.isoDate(curveName.date) : ''
  const note = rates
    ? cmarket && t('bondPricing.curveUsed.ratesNote', { date: curveDate })
    : data.discount.curve?.kind === 'custom'
      ? t('bondPricing.curveUsed.customNote', { name: data.discount.curve.name, date: curveDate })
      : t('bondPricing.curveUsed.note', { date: curveDate })

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col', stale && 'opacity-60')}>
      <p className="sr-only">
        {t('bondPricing.curveUsed.summary', {
          rates: data.cashFlows
            .map((flow) => `${format.isoDate(flow.date)} ${rate(flow.zeroRatePct)}`)
            .join(', '),
        })}
      </p>
      <ul
        aria-hidden
        className="flex shrink-0 flex-wrap gap-x-4 px-2 pt-1 font-sans text-title text-secondary"
      >
        {points.length > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              className={clsx(
                'inline-block w-4 border-t-2 border-[var(--info)]',
                rates && 'border-dashed',
              )}
            />
            {t(rates ? 'bondPricing.curveUsed.cmarketCurve' : 'bondPricing.curveUsed.nodes', {
              country: format.country(country ?? ''),
            })}
          </li>
        )}
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-[var(--accent-amber)]" />
          {t(rates ? 'bondPricing.curveUsed.ratesEntered' : 'bondPricing.curveUsed.flowDates')}
        </li>
      </ul>
      <div className="min-h-0 flex-1 px-1 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="years"
              type="number"
              domain={[0, lastYear]}
              ticks={yieldTicks(0, lastYear)}
              tickFormatter={(value: number) => t('bondPricing.curveUsed.yearTick', { value })}
              tick={theme.tick}
              stroke={theme.grid}
              allowDataOverflow
            />
            <YAxis
              domain={[yAxis.low, yAxis.high]}
              ticks={yAxis.ticks}
              tickFormatter={(value: number) => format.percent(value, 1, false)}
              tick={theme.tick}
              stroke={theme.grid}
              width={44}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload }) => {
                const point = active ? payload.at(0)?.payload : undefined
                return point ? (
                  <div className="border bg-panel-header px-2 py-1 font-mono text-data shadow-lg">
                    {t('bondPricing.curveUsed.point', {
                      years: format.number(point.years, 2),
                      rate: rate(point.ratePct),
                    })}
                  </div>
                ) : null
              }}
            />
            {flows.map((flow) => (
              <ReferenceLine
                key={flow.years}
                segment={[
                  { x: flow.years, y: yAxis.low },
                  { x: flow.years, y: flow.ratePct },
                ]}
                stroke={theme.amber}
                strokeDasharray="2 3"
                ifOverflow="hidden"
              />
            ))}
            <Line
              data={points}
              dataKey="ratePct"
              stroke={theme.info}
              strokeWidth={2}
              strokeDasharray={rates ? '4 4' : undefined}
              dot={rates ? false : { r: 2.5, fill: theme.info, stroke: theme.info }}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              data={flows}
              dataKey="ratePct"
              stroke={rates ? theme.amber : 'transparent'}
              strokeWidth={2}
              dot={{ r: 4, fill: theme.amber, stroke: theme.amber }}
              activeDot={{ r: 5, fill: theme.amber, stroke: theme.amber }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {note && <p className="shrink-0 px-2 pb-2 font-sans text-title text-secondary">{note}</p>}
    </div>
  )
}
