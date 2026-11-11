import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BondPriceDto, BondPriceRequestDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { CHART_FONT, useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PricedView } from './PricedView'
import { priceTicks, yieldTicks } from '../lib/axes'

interface PriceYieldPanelProps {
  request: BondPriceRequestDto | null
}

/**
 * Screen 16, price-yield relationship: the clean price for yields 3 points either side of the
 * yield priced, the bond's position as an amber point.
 */
export function PriceYieldPanel({ request }: PriceYieldPanelProps) {
  const { t } = useTranslation()
  return (
    <Panel
      title={t('bondPricing.priceYield')}
      code="BP"
      options={<span>{t('bondPricing.cleanPriceCurve')}</span>}
      bodyClassName="flex flex-col"
    >
      <PricedView request={request}>
        {(data, stale) => <Curve data={data} stale={stale} />}
      </PricedView>
    </Panel>
  )
}

function Curve({ data, stale }: { data: BondPriceDto; stale: boolean }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const points = data.priceYield
  const first = points.at(0)
  const last = points.at(-1)
  if (!first || !last) return null
  const prices = points.map((point) => point.cleanPrice)
  const yAxis = priceTicks(Math.min(...prices), Math.max(...prices))
  const yieldLabel = (value: number) => format.percent(value, 2, false)
  const priceLabel = (value: number) => format.number(value, 2)
  const position = t('bondPricing.point', {
    yield: yieldLabel(data.ytmPct),
    price: priceLabel(data.pricing.cleanPrice),
  })

  return (
    <div className={clsx('flex min-h-0 flex-1 flex-col', stale && 'opacity-60')}>
      <p className="sr-only">
        {t('bondPricing.chartSummary', {
          high: priceLabel(first.cleanPrice),
          lowYield: yieldLabel(first.ytmPct),
          low: priceLabel(last.cleanPrice),
          highYield: yieldLabel(last.ytmPct),
          price: priceLabel(data.pricing.cleanPrice),
          yield: yieldLabel(data.ytmPct),
        })}
      </p>
      <p aria-hidden className="shrink-0 px-2 pt-1 font-sans text-title text-secondary">
        {t('bondPricing.priceAxis')}
      </p>
      <div className="min-h-0 flex-1 px-1 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="ytmPct"
              type="number"
              domain={[first.ytmPct, last.ytmPct]}
              ticks={yieldTicks(first.ytmPct, last.ytmPct)}
              tickFormatter={(value: number) => format.percent(value, 0, false)}
              tick={theme.tick}
              stroke={theme.grid}
              allowDataOverflow
            />
            <YAxis
              domain={[yAxis.low, yAxis.high]}
              ticks={yAxis.ticks}
              tickFormatter={(value: number) => format.number(value, 0)}
              tick={theme.tick}
              stroke={theme.grid}
              width={40}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload }) => {
                const point = active ? payload.at(0)?.payload : undefined
                return point ? (
                  <div className="border bg-panel-header px-2 py-1 font-mono text-data shadow-lg">
                    {t('bondPricing.point', {
                      yield: format.percent(point.ytmPct, 2, false),
                      price: format.number(point.cleanPrice, 4),
                    })}
                  </div>
                ) : null
              }}
            />
            <Line
              dataKey="cleanPrice"
              stroke={theme.info}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: theme.info, stroke: theme.info }}
              isAnimationActive={false}
            />
            <ReferenceDot
              x={data.ytmPct}
              y={data.pricing.cleanPrice}
              r={5}
              fill={theme.amber}
              stroke={theme.amber}
              label={{
                value: position,
                position: 'right',
                offset: 10,
                fill: theme.amber,
                fontFamily: CHART_FONT,
                fontSize: 11,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
