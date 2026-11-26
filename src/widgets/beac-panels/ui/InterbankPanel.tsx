import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { formatBp, INTERBANK_TENORS, useBeacInterbank } from '@/entities/beac'
import type { BeacInterbankDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

/** A rate that rose shows red, one that fell green, as the mockup colours the interbank market. */
const toneOf = (change: number | null) =>
  change === null || change === 0 ? 'text-secondary' : change > 0 ? 'text-down' : 'text-up'

/**
 * The CEMAC interbank market (screen 34): the latest week's average rates overnight, at one week,
 * one month and three months, and the volume lent (XAF bn), each with its change from the week
 * before. API /beac/interbank.
 */
export function InterbankPanel() {
  const { t } = useTranslation()
  const interbank = useBeacInterbank()

  return (
    <Panel
      title={t('panels.beacInterbank')}
      code="BEAC"
      options={t('beac.interbank.options')}
      bodyClassName="flex flex-col"
    >
      <QueryView
        query={interbank}
        isEmpty={(week) => week.weekStart === null}
        emptyMessage={t('beac.interbank.empty')}
      >
        {(week) => <Week week={week} />}
      </QueryView>
    </Panel>
  )
}

function Week({ week }: { week: BeacInterbankDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const bp = t('beac.decisions.bp')
  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        <table className="w-full font-mono text-data">
          <tbody>
            {INTERBANK_TENORS.map((tenor) => {
              const rate = week.rates.find((entry) => entry.tenor === tenor)
              return (
                <tr key={tenor} className="h-9 border-b even:bg-row-alt">
                  <th scope="row" className="px-3 text-left font-sans font-normal text-secondary">
                    {t(`beac.interbank.tenors.${tenor}`)}
                  </th>
                  <td className="px-2 text-right text-primary tabular-nums">
                    {rate?.rate != null ? format.percent(rate.rate, 2, false) : '—'}
                  </td>
                  <td
                    className={clsx('px-3 text-right tabular-nums', toneOf(rate?.changeBp ?? null))}
                  >
                    {formatBp(rate?.changeBp ?? null, bp)}
                  </td>
                </tr>
              )
            })}
            <tr className="h-9 border-b">
              <th scope="row" className="px-3 text-left font-sans font-normal text-secondary">
                {t('beac.interbank.volume')}
              </th>
              <td className="px-2 text-right text-primary tabular-nums">
                {week.volume != null
                  ? t('beac.bn', { amount: format.number(week.volume, 0) })
                  : '—'}
              </td>
              <td className="px-3 text-right text-secondary tabular-nums">
                {week.volumeChangePct != null ? format.percent(week.volumeChangePct, 0) : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </ScrollArea>
      {week.weekStart && week.weekEnd && (
        <p className="shrink-0 border-t px-2 py-1 font-sans text-title text-secondary">
          {t('beac.interbank.week', {
            from: format.isoDate(week.weekStart),
            to: format.isoDate(week.weekEnd),
          })}
        </p>
      )}
    </>
  )
}
