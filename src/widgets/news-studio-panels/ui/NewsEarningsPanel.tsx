import { useTranslation } from 'react-i18next'
import { useNewsEarnings } from '@/entities/news'
import type { NewsEarningsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * Screen 13, left, bottom: the current month's payable unique clicks, the rate per click of the
 * contract, the amount payable within the cap, and the clicks the checks excluded (spec section
 * 16: the newspaper follows its clicks and estimated amount live). API GET /provider/earnings.
 */
export function NewsEarningsPanel() {
  const { t } = useTranslation()
  const earnings = useNewsEarnings()
  return (
    <Panel title={t('panels.newsEarnings')} code="NEWS">
      <QueryView query={earnings}>{(data) => <Earnings earnings={data} />}</QueryView>
    </Panel>
  )
}

function Earnings({ earnings }: { earnings: NewsEarningsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const money = (value: number) => `${earnings.currency} ${format.number(value, 0)}`
  const capped =
    earnings.monthlyCap !== null && earnings.amount >= earnings.monthlyCap && earnings.amount > 0
  const rows: { label: string; value: string; className?: string }[] = [
    { label: t('newsStudio.earnings.payable'), value: format.number(earnings.payableClicks, 0) },
    { label: t('newsStudio.earnings.rate'), value: money(earnings.ratePerClick) },
    {
      label: t('newsStudio.earnings.amount'),
      value: money(earnings.amount),
      className: 'font-semibold text-up',
    },
    {
      label: t('newsStudio.earnings.excluded'),
      value: format.number(earnings.excludedClicks, 0),
      className: 'text-accent-amber',
    },
  ]
  return (
    <section aria-labelledby="news-earnings-title" className="m-3 flex flex-col gap-2 border p-3">
      <h3
        id="news-earnings-title"
        className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase"
      >
        {t('newsStudio.earnings.title', { month: format.month(earnings.month) })}
      </h3>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 font-sans text-data">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-secondary">{row.label}</dt>
            <dd className={`text-right font-mono ${row.className ?? ''}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="font-sans text-title text-secondary">
        {capped && earnings.monthlyCap !== null
          ? t('newsStudio.earnings.capped', { cap: money(earnings.monthlyCap) })
          : t('newsStudio.earnings.estimate')}
      </p>
    </section>
  )
}
