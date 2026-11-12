import { useTranslation } from 'react-i18next'
import { currencySymbol, useEtf, useEtfDistributions, useEtfLabels } from '@/entities/etf'
import type { EtfDistributionsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { paidOverYear, paidPerYear } from '../lib/portfolio'
import { DASH, FigureLine } from './words'

/**
 * DIST, the distributions: each one's ex-date, payment date and amount, the latest first; a fund
 * that accumulates says it pays none. API /etfs/{id}/distributions.
 */
export function EtfDistributionsPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const distributions = useEtfDistributions(etfId)
  return (
    <Panel title={t('panels.etfDistributions')} code="DIST" bodyClassName="overflow-y-auto">
      <QueryView query={distributions}>
        {(data) => <DistributionsTable data={data} etfId={etfId} />}
      </QueryView>
    </Panel>
  )
}

function DistributionsTable({ data, etfId }: { data: EtfDistributionsDto; etfId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const perShare = usePerShare()
  const code = useEtf(etfId).data?.identification.code ?? etfId
  if (data.distribution === 'accumulating' && data.items.length === 0) {
    return (
      <p className="p-3 font-sans text-data text-secondary">
        {t('etfProfile.distributions.accumulating', { code })}
      </p>
    )
  }
  if (data.items.length === 0) {
    return (
      <p className="p-3 font-sans text-data text-secondary">
        {t('etfProfile.distributions.empty')}
      </p>
    )
  }
  const head = 'px-2 py-1 font-sans text-title font-normal text-secondary'
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" className={`${head} text-left`}>
            {t('etfProfile.distributions.exDate')}
          </th>
          <th scope="col" className={`${head} text-left`}>
            {t('etfProfile.distributions.paymentDate')}
          </th>
          <th scope="col" className={`${head} text-right`}>
            {t('etfProfile.distributions.amount')}
          </th>
        </tr>
      </thead>
      <tbody className="font-mono text-data">
        {data.items.map((item) => (
          <tr key={item.exDate} className="even:bg-panel-header/40">
            <th scope="row" className="px-2 py-1 text-left font-normal">
              {format.isoDate(item.exDate)}
            </th>
            <td className="px-2 py-1">{format.isoDate(item.paymentDate)}</td>
            <td className="px-2 py-1 text-right">{perShare(item.amount, item.currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** "$0.3087": a distribution per share, to the four decimals the funds pay it in. */
function usePerShare() {
  const { t } = useTranslation()
  const format = useFormat()
  return (amount: number, currency: string) =>
    t('etf.amount', { symbol: currencySymbol(currency), value: format.number(amount, 4) })
}

/**
 * DIST, the policy: accumulating or distributing, the rhythm, the 12-month yield, what the fund
 * paid over 12 months, its last distribution, the distributions recorded; then what it paid each
 * calendar year as bars. API /etfs/{id}/distributions.
 */
export function EtfDistributionPolicyPanel({ etfId }: { etfId: string }) {
  const { t } = useTranslation()
  const distributions = useEtfDistributions(etfId)
  return (
    <Panel title={t('panels.etfDistributionPolicy')} code="DIST" bodyClassName="overflow-y-auto">
      <QueryView query={distributions}>{(data) => <Policy data={data} etfId={etfId} />}</QueryView>
    </Panel>
  )
}

function Policy({ data, etfId }: { data: EtfDistributionsDto; etfId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const perShare = usePerShare()
  const today = useMarketDay()
  const currency = useEtf(etfId).data?.identification.currency ?? data.items[0]?.currency ?? ''
  const last = data.items[0]
  const years = paidPerYear(data.items)
  const largest = Math.max(0, ...years.map((year) => year.amount))
  const thisYear = Number(today.slice(0, 4))
  return (
    <div>
      <dl className="py-1">
        <FigureLine
          label={t('etfProfile.policy.policy')}
          value={t(`etfProfile.policies.${data.distribution}`)}
        />
        <FigureLine
          label={t('etfProfile.policy.frequency')}
          value={data.frequency ? labels.frequency(data.frequency) : DASH}
        />
        <FigureLine
          label={t('etfProfile.policy.yield')}
          value={
            data.distribution === 'accumulating'
              ? t('etfScreener.accumulatingYield')
              : data.trailingYieldPct === null
                ? DASH
                : format.percent(data.trailingYieldPct, 2, false)
          }
        />
        <FigureLine
          label={t('etfProfile.policy.trailing')}
          value={
            data.items.length === 0 ? DASH : perShare(paidOverYear(data.items, today), currency)
          }
        />
        <FigureLine
          label={t('etfProfile.policy.last')}
          value={
            last
              ? t('etfProfile.policy.lastValue', {
                  amount: perShare(last.amount, last.currency),
                  date: format.isoDate(last.exDate),
                })
              : DASH
          }
        />
        <FigureLine
          label={t('etfProfile.policy.count')}
          value={format.number(data.items.length, 0)}
        />
      </dl>
      {years.length > 0 && (
        <section aria-label={t('etfProfile.policy.perYear')} className="px-2 pt-2 pb-3">
          <h3 className="mb-1 font-sans text-title font-semibold text-accent-amber uppercase">
            {t('etfProfile.policy.perYear')}
          </h3>
          <dl className="flex flex-col gap-1">
            {years.map((year) => (
              <div key={year.year} className="flex items-center gap-2 font-mono text-data">
                <dt className="w-24 shrink-0 font-sans text-secondary">
                  {year.year === thisYear
                    ? t('etfProfile.policy.yearToDate', { year: year.year })
                    : year.year}
                </dt>
                <dd className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 bg-accent-amber/70"
                    style={{ width: `${largest > 0 ? (year.amount / largest) * 70 : 0}%` }}
                  />
                  <span className="ml-auto">{perShare(year.amount, currency)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  )
}
