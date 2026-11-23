import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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
import { useIndexConstituents, useIndexHistory, useIndices } from '@/entities/market'
import { securityHistoryQuery } from '@/entities/security'
import { useFormat } from '@/shared/i18n'
import type { ChartPeriod } from '@/shared/lib/chartPeriods'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { chartRows, dayOf, type ChartRow } from '../lib/series'

/** The comparison drop-down's value without one. */
const NONE = ''

interface IndexValuePanelProps {
  code: string
  /** DES's periods, 1M to 5Y; GP's add 10Y. */
  periods: readonly ChartPeriod[]
  screen: 'DES' | 'GP'
}

/**
 * Screen 31, "Index value" (spec section 9, fifth version): the line of the closes, 1 month to 5
 * years (10 on GP), a base-100 view and a comparison with another index or one of its
 * constituents, both based 100 on their first common day. API /indices/{code}/history and
 * /securities/{id}/history.
 */
export function IndexValuePanel({ code, periods, screen }: IndexValuePanelProps) {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<ChartPeriod>('1Y')
  const [base100, setBase100] = useState(false)
  const [compare, setCompare] = useState(NONE)
  const indices = useIndices().data ?? []
  const constituents = useIndexConstituents(code, null).data?.constituents ?? []
  const history = useIndexHistory(code, period)
  const [kind, id] = compare.split(':') as [string, string | undefined]
  const otherIndex = useIndexHistory(kind === 'index' ? id : undefined, period)
  const security = useQuery({
    ...securityHistoryQuery(id ?? '', period),
    enabled: kind === 'security' && Boolean(id),
  })
  const compared =
    kind === 'index'
      ? (otherIndex.data?.map((point) => ({ day: dayOf(point.time), value: point.value })) ?? null)
      : kind === 'security'
        ? (security.data?.bars.map((bar) => ({ day: dayOf(bar.time), value: bar.close })) ?? null)
        : null
  const comparedName =
    kind === 'index'
      ? indices.find((index) => index.code === id)?.name
      : constituents.find((constituent) => constituent.securityId === id)?.code
  const options = [
    { value: NONE, label: t('indexProfile.chart.noComparison') },
    ...indices
      .filter((index) => index.code !== code && index.code !== 'MCAP')
      .map((index) => ({ value: `index:${index.code}`, label: index.name })),
    ...constituents.map((constituent) => ({
      value: `security:${constituent.securityId}`,
      label: constituent.code,
    })),
  ]

  return (
    <Panel
      title={t('panels.indexValue')}
      code={screen}
      options={
        <>
          <PanelTabs
            value={period}
            options={periods.map((value) => ({ value, label: value }))}
            onChange={setPeriod}
          />
          <span aria-hidden>·</span>
          <button
            type="button"
            aria-pressed={base100 || compare !== NONE}
            disabled={compare !== NONE}
            onClick={() => setBase100(!base100)}
            className="panel-no-drag min-h-6 uppercase hover:text-primary aria-pressed:text-accent-amber"
          >
            {t('indexProfile.chart.base100')}
          </button>
          <span aria-hidden>·</span>
          <Select
            aria-label={t('indexProfile.chart.compare')}
            value={compare}
            options={options}
            onChange={(value: string) => setCompare(value)}
            className="panel-no-drag w-40"
          />
        </>
      }
      bodyClassName="flex flex-col"
    >
      <QueryView query={history} isEmpty={(points) => points.length === 0}>
        {(points) => (
          <Chart
            rows={chartRows(
              points.map((point) => ({ day: dayOf(point.time), value: point.value })),
              compare === NONE ? null : compared,
              base100,
            )}
            based={base100 || compare !== NONE}
            name={code}
            comparedName={compare === NONE ? null : (comparedName ?? null)}
          />
        )}
      </QueryView>
    </Panel>
  )
}

function Chart({
  rows,
  based,
  name,
  comparedName,
}: {
  rows: ChartRow[]
  based: boolean
  name: string
  comparedName: string | null
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const first = rows.at(0)
  const last = rows.at(-1)
  const decimals = based ? 1 : 2
  const values = rows.flatMap((row) =>
    row.compared === undefined ? [row.value] : [row.value, row.compared],
  )
  const low = Math.min(...values)
  const high = Math.max(...values)
  const pad = (high - low) * 0.05 || 1

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {first && last && (
        <p className="sr-only">
          {t('indexProfile.chart.summary', {
            name,
            from: format.isoDate(first.day),
            to: format.isoDate(last.day),
            first: format.number(first.value, decimals),
            last: format.number(last.value, decimals),
          })}
        </p>
      )}
      {comparedName && (
        <ul
          aria-hidden
          className="flex shrink-0 gap-4 px-2 pt-1 font-sans text-title text-secondary"
        >
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-[var(--info)]" />
            {name}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-[var(--accent-amber)]" />
            {comparedName}
          </li>
        </ul>
      )}
      <div className="min-h-0 flex-1 px-1 pb-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="day"
              tickFormatter={(day: string) => format.isoDate(day).slice(3)}
              tick={theme.tick}
              stroke={theme.grid}
              minTickGap={40}
            />
            <YAxis
              orientation="right"
              domain={[low - pad, high + pad]}
              tickFormatter={(value: number) => format.number(value, 0)}
              tick={theme.tick}
              stroke={theme.grid}
              width={56}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload }) => {
                const row = active ? (payload.at(0)?.payload as ChartRow | undefined) : undefined
                return row ? (
                  <div className="border bg-panel-header px-2 py-1 font-mono text-data shadow-lg">
                    <p>{format.isoDate(row.day)}</p>
                    <p>
                      {name} {format.number(row.value, decimals)}
                    </p>
                    {row.compared !== undefined && comparedName && (
                      <p className="text-accent-amber">
                        {comparedName} {format.number(row.compared, decimals)}
                      </p>
                    )}
                  </div>
                ) : null
              }}
            />
            <Line
              dataKey="value"
              stroke={theme.info}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            {comparedName && (
              <Line
                dataKey="compared"
                stroke={theme.amber}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {based && (
        <p className="shrink-0 px-2 pb-1 font-sans text-caption text-secondary">
          {t('indexProfile.chart.basedNote')}
        </p>
      )}
    </div>
  )
}
