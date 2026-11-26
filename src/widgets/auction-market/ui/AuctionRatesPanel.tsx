import { useMemo } from 'react'
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
import { useAuctionLabel, useAuctionRates } from '@/entities/auction'
import type { AuctionRatesDto } from '@/shared/api/contracts'
import { cemacCode3 } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'
import { AUCTION_TENORS, LINE_TOKENS, TENOR_TERMS } from '../lib/tenors'

interface AuctionRatesPanelProps {
  tenor: string
  onTenorChange: (tenor: string) => void
  /** The state of the result picked, drawn thicker. */
  country: string | null
}

/**
 * AUC's average rate by country (screen 33): a tenor's (the 52-week BTA by default) monthly average
 * over 24 months, a line a state, a month without an auction a gap (decision 58). A row of the
 * results shows its security's tenor. API /auctions/rates.
 */
export function AuctionRatesPanel({ tenor, onTenorChange, country }: AuctionRatesPanelProps) {
  const { t } = useTranslation()
  const label = useAuctionLabel()
  const rates = useAuctionRates({ tenor })
  const known = TENOR_TERMS[tenor as keyof typeof TENOR_TERMS]
  const security = known ? label(known) : tenor

  return (
    <Panel
      title={t('auctionMarket.rates.title', { security })}
      code="AUC"
      options={
        <>
          <span>{t('auctionMarket.rates.options')}</span>
          <PanelSelect
            value={tenor}
            options={AUCTION_TENORS.map((value) => ({ value, label: label(TENOR_TERMS[value]) }))}
            onChange={onTenorChange}
            aria-label={t('auctionMarket.rates.tenor')}
          />
        </>
      }
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={rates}
        isEmpty={(result) =>
          result.series.every((series) => series.rates.every((rate) => rate === null))
        }
        emptyMessage={t('auctionMarket.rates.empty')}
      >
        {(result) => <Lines rates={result} security={security} highlight={country} />}
      </QueryView>
      <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
        {t('auctionMarket.rates.note')}
      </p>
    </Panel>
  )
}

function Lines({
  rates,
  security,
  highlight,
}: {
  rates: AuctionRatesDto
  security: string
  highlight: string | null
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const rows = useMemo(
    () =>
      rates.months.map((month, index) => ({
        month,
        ...Object.fromEntries(rates.series.map((series) => [series.country, series.rates[index]])),
      })),
    [rates],
  )
  const drawn = rates.series.filter((series) => series.rates.some((rate) => rate !== null))
  return (
    <div className="flex min-h-40 flex-1 flex-col px-1 pt-1">
      <ul className="flex flex-wrap gap-x-3 px-2 font-mono text-data" aria-hidden>
        {drawn.map((series) => (
          <li key={series.country} className="inline-flex items-center gap-1.5">
            <span
              className="h-0.5 w-3"
              style={{
                backgroundColor: cssVar(
                  LINE_TOKENS[rates.series.indexOf(series) % LINE_TOKENS.length],
                ),
              }}
            />
            {cemacCode3(series.country)}
          </li>
        ))}
      </ul>
      <div
        role="img"
        aria-label={t('auctionMarket.rates.chartLabel', {
          security,
          countries: drawn.map((series) => format.country(series.country)).join(', '),
        })}
        className="min-h-32 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" />
            <XAxis
              dataKey="month"
              tickFormatter={(month: string) => format.shortMonth(month)}
              tick={theme.tick}
              stroke={theme.grid}
              minTickGap={32}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => format.number(value, 1)}
              tick={theme.tick}
              stroke={theme.grid}
              width={40}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload, label: month }) =>
                active && payload.length > 0 ? (
                  <div className="grid grid-cols-[auto_auto] gap-x-3 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                    <div className="col-span-full mb-1 text-secondary">
                      {format.month(String(month))}
                    </div>
                    {payload
                      .filter((entry) => entry.value != null)
                      .map((entry) => (
                        <div key={String(entry.dataKey)} className="contents">
                          <span style={{ color: entry.color }}>
                            {cemacCode3(String(entry.dataKey))}
                          </span>
                          <span className="text-right">
                            {format.percent(Number(entry.value), 2, false)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : null
              }
            />
            {rates.series.map((series, index) => {
              const color = cssVar(LINE_TOKENS[index % LINE_TOKENS.length])
              return (
                <Line
                  key={series.country}
                  dataKey={series.country}
                  stroke={color}
                  strokeWidth={series.country === highlight ? 2.5 : 1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: color, stroke: color }}
                  isAnimationActive={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
