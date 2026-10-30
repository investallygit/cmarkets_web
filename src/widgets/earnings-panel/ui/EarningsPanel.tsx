import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePayouts, usePublicationStats } from '@/entities/publication'
import type { PayoutDto, PublicationStatsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { addDays, addMonths } from '@/shared/lib/isoDate'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'

/** Months offered, the current one first. */
const MONTHS = 12

/**
 * Screen 7, my earnings for a month: reads, sales, revenue, CMarket's commission, net payable,
 * readers' rating and followers; then the monthly payouts. API GET /me/publications/stats and
 * GET /me/payouts.
 */
export function EarningsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const current = today.slice(0, 7)
  const [month, setMonth] = useState(current)
  const months = Array.from({ length: MONTHS }, (_, index) =>
    addMonths(`${current}-01`, -index).slice(0, 7),
  )
  const from = `${month}-01`
  const to = month === current ? today : addDays(addMonths(from, 1), -1)
  const stats = usePublicationStats(from, to)

  return (
    <Panel
      title={t('panels.earnings')}
      code="PUB"
      options={
        <PanelSelect
          value={month}
          options={months.map((value) => ({ value, label: format.month(value) }))}
          onChange={setMonth}
          aria-label={t('studio.earnings.month')}
        />
      }
    >
      <QueryView query={stats}>{(data) => <Earnings stats={data} />}</QueryView>
      <Payouts />
    </Panel>
  )
}

function Earnings({ stats }: { stats: PublicationStatsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const xaf = (value: number) => t('studio.earnings.xaf', { amount: format.number(value, 0) })
  const rows: {
    key: 'reads' | 'sales' | 'revenue' | 'commission' | 'net' | 'score' | 'followers'
    value: string
    className?: string
  }[] = [
    { key: 'reads', value: format.number(stats.reads, 0) },
    { key: 'sales', value: format.number(stats.sales, 0) },
    { key: 'revenue', value: xaf(stats.revenue) },
    { key: 'commission', value: `- ${xaf(stats.commission)}` },
    { key: 'net', value: xaf(stats.net), className: 'font-semibold text-up' },
    {
      key: 'score',
      value:
        stats.score === null
          ? '—'
          : t('studio.earnings.scoreValue', {
              score: format.number(stats.score, 1),
              count: stats.scoreCount,
            }),
      className: 'text-accent-amber',
    },
    { key: 'followers', value: format.number(stats.followers, 0) },
  ]
  return (
    <dl>
      {rows.map((row, index) => (
        <div
          key={row.key}
          className={clsx(
            'flex h-row items-center justify-between px-3',
            index % 2 === 0 && 'bg-row-alt',
          )}
        >
          <dt className="font-sans text-label text-secondary">{t(`studio.earnings.${row.key}`)}</dt>
          <dd className={clsx('font-mono text-data', row.className)}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Payouts() {
  const { t } = useTranslation()
  const format = useFormat()
  const payouts = usePayouts()
  const status = (payout: PayoutDto) =>
    payout.status === 'paid' && payout.paidAt
      ? t('studio.payouts.paidOn', { date: format.isoDate(payout.paidAt) })
      : t(`studio.payouts.${payout.status}`)
  return (
    <section className="mt-2 border-t">
      <h3 className="px-3 pt-2 pb-1 font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
        {t('studio.payouts.title')}
      </h3>
      <QueryView
        query={payouts}
        isEmpty={(items) => items.length === 0}
        emptyMessage={t('studio.payouts.empty')}
      >
        {(items) => (
          <table className="w-full font-mono text-data">
            <tbody>
              {items.map((payout) => (
                <tr key={payout.month} className="h-row border-t">
                  <th scope="row" className="px-3 text-left font-sans font-normal text-secondary">
                    {format.month(payout.month)}
                  </th>
                  <td className="px-1 text-right">
                    {t('studio.earnings.xaf', { amount: format.number(payout.net, 0) })}
                  </td>
                  <td
                    className={clsx(
                      'px-3 text-right font-sans',
                      payout.status === 'paid' ? 'text-up' : 'text-secondary',
                    )}
                  >
                    {status(payout)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </QueryView>
    </section>
  )
}
