import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { billions, scheduleBars, useDebtRedemptions } from '@/entities/debt'
import { useFormat } from '@/shared/i18n'
import { useChartTheme } from '@/shared/ui/charts/chartTheme'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { useDebtCountryName } from '../lib/names'

/**
 * DEBT's redemption schedule (screen 35, sixth version): the principal to repay by quarter of the
 * current year, then by year, the years beyond the seventh in one bar, BTA (amber) above OTA,
 * the total over each bar, in billions of XAF (ROADMAP decision 60). API /debt/{country}/redemptions.
 */
export function RedemptionSchedulePanel({ country }: { country: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const theme = useChartTheme()
  const name = useDebtCountryName()
  const redemptions = useDebtRedemptions(country)
  const bn = (value: number) => format.number(value, 0)

  return (
    <Panel
      title={t('panels.debtSchedule')}
      code="DEBT"
      options={t('debt.schedule.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={redemptions}
        isEmpty={(data) => data.total === 0}
        emptyMessage={t('debt.schedule.empty')}
      >
        {(data) => {
          const bars = scheduleBars(data.periods, (quarter, year) =>
            t('debt.schedule.quarter', { quarter, year: String(year).slice(2) }),
          )
          return (
            <>
              <div className="flex shrink-0 items-center gap-4 px-3 pt-2 font-sans text-data text-secondary">
                <Legend color={theme.amber} label={t('debt.securities.bta')} />
                <Legend color={theme.info} label={t('debt.securities.ota')} />
              </div>
              <div
                role="img"
                aria-label={t('debt.schedule.label', {
                  country: name(country),
                  bars: bars
                    .map((bar) =>
                      t('debt.schedule.bar', {
                        label: bar.label,
                        total: bn(bar.total),
                        bta: bn(bar.bta),
                        ota: bn(bar.ota),
                      }),
                    )
                    .join(', '),
                })}
                className="min-h-40 flex-1 px-1"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bars} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="2 4" />
                    <XAxis dataKey="label" tick={theme.tick} stroke={theme.grid} interval={0} />
                    <YAxis
                      tick={theme.tick}
                      stroke={theme.grid}
                      width={44}
                      tickFormatter={(value: number) => bn(value)}
                    />
                    <Bar dataKey="ota" stackId="debt" fill={theme.info} isAnimationActive={false} />
                    <Bar dataKey="bta" stackId="debt" fill={theme.amber} isAnimationActive={false}>
                      <LabelList
                        dataKey="total"
                        position="top"
                        formatter={(value: unknown) => bn(Number(value))}
                        fill={theme.primary}
                        fontSize={11}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="shrink-0 border-t px-3 py-1 font-sans text-title text-secondary">
                {t('debt.schedule.total', { total: bn(billions(data.total)) })}
              </p>
            </>
          )
        }}
      </QueryView>
    </Panel>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-2.5" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
