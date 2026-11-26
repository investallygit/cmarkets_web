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
import { useBeacRateHistory } from '@/entities/beac'
import type { BeacRateHistoryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { cssVar } from '@/shared/lib/theme'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { corridorRows, yearTicks, type CorridorRow } from '../lib/corridor'

/** The corridor since 2019, as the spec asks. */
const FROM = '2019-01-01'

/** Each rate's line: the policy rate amber, the marginal lending facility grey, the deposit cyan. */
const LINES = [
  { key: 'policy', token: '--accent-amber', label: 'beac.indicators.policy' },
  { key: 'marginalLending', token: '--text-secondary', label: 'beac.indicators.lending' },
  { key: 'deposit', token: '--info', label: 'beac.indicators.deposit' },
] as const

/**
 * BEAC's rate corridor (screen 34): the policy rate (TIAO) and the two facilities as steps since
 * 2019, each meeting a step, run on to today. API /beac/rates/history.
 */
export function RateCorridorPanel({ today }: { today: string }) {
  const { t } = useTranslation()
  const history = useBeacRateHistory(FROM)

  return (
    <Panel
      title={t('panels.beacCorridor')}
      code="BEAC"
      options={t('beac.corridor.options', { from: FROM.slice(0, 4), to: today.slice(0, 4) })}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={history}
        isEmpty={(result) => result.points.length === 0}
        emptyMessage={t('beac.corridor.empty')}
      >
        {(result) => <Steps history={result} today={today} />}
      </QueryView>
      <p
        className={`shrink-0 border-t px-2 py-1 font-sans text-title ${history.data?.illustrative ? 'text-warning' : 'text-secondary'}`}
      >
        {history.data?.illustrative ? t('beac.corridor.illustrative') : t('beac.corridor.source')}
      </p>
    </Panel>
  )
}

function Steps({ history, today }: { history: BeacRateHistoryDto; today: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const rows = useMemo(() => corridorRows(history.points, today), [history, today])
  const ticks = useMemo(() => yearTicks(rows), [rows])
  const last = rows.at(-1) as CorridorRow
  const year = (time: number) => String(new Date(time).getUTCFullYear())

  return (
    <div className="flex min-h-40 flex-1 flex-col px-1 pt-1">
      <ul className="flex flex-wrap gap-x-4 px-2 font-sans text-data" aria-hidden>
        {LINES.map((line) => (
          <li key={line.key} className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3" style={{ backgroundColor: cssVar(line.token) }} />
            <span style={{ color: cssVar(line.token) }}>{t(line.label)}</span>
          </li>
        ))}
      </ul>
      <div
        role="img"
        aria-label={t('beac.corridor.chartLabel', {
          from: format.isoDate(history.from),
          policy: format.percent(last.policy, 2, false),
          deposit: format.percent(last.deposit, 2, false),
          lending: format.percent(last.marginalLending, 2, false),
        })}
        className="min-h-32 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={ticks}
              tickFormatter={year}
              tick={theme.tick}
              stroke={theme.grid}
            />
            <YAxis
              domain={[0, 'auto']}
              tickFormatter={(value: number) => format.number(value, 1)}
              tick={theme.tick}
              stroke={theme.grid}
              width={40}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: theme.secondary, strokeDasharray: '2 2' }}
              content={({ active, payload }) =>
                active && payload.length > 0 ? (
                  <div className="grid grid-cols-[auto_auto] gap-x-3 border bg-panel-header px-2 py-1.5 font-mono text-data shadow-lg">
                    <div className="col-span-full mb-1 text-secondary">
                      {format.isoDate(
                        new Date(Number(payload[0].payload.time)).toISOString().slice(0, 10),
                      )}
                    </div>
                    {LINES.map((line) => (
                      <div key={line.key} className="contents">
                        <span style={{ color: cssVar(line.token) }}>{t(line.label)}</span>
                        <span className="text-right">
                          {format.percent(Number(payload[0].payload[line.key]), 2, false)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
            />
            {LINES.map((line) => (
              <Line
                key={line.key}
                type="stepAfter"
                dataKey={line.key}
                stroke={cssVar(line.token)}
                strokeWidth={line.key === 'policy' ? 2 : 1.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
