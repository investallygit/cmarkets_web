import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useGlobalRates } from '@/entities/rate'
import type { RateSeriesDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'

const MISSING = '—'

/**
 * Screen 25's sovereign and reference rates (spec section 9): the CEMAC's yields the Data admin
 * uploads, in amber, their change since the point before (the tooltip says what the point is,
 * the security it is read on and who gave it), then the 10-year yields of seven countries and the
 * 3-month Euribor, their change over a day. API /macro/global-rates?set=world.
 */
export function SovereignRatesPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const rates = useGlobalRates('world')

  const pointNote = (rate: RateSeriesDto) => {
    const last = rate.last
    if (!last || rate.origin !== 'cmkt') return undefined
    return [
      format.isoDate(last.date),
      last.pointType && t(`curves.pointTypes.${last.pointType}`),
      last.referenceSecurity,
      last.source && t(`curves.pointSources.${last.source}`),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  const cemacDay = rates.data?.find((rate) => rate.origin === 'cmkt' && rate.last)?.last?.date

  return (
    <Panel
      title={t('panels.sovereignRates')}
      code="ECO"
      options={<span>{t('eco.ratesScope')}</span>}
    >
      <QueryView
        query={rates}
        isEmpty={(series) => series.length === 0}
        emptyMessage={t('eco.noRates')}
      >
        {(series) => (
          <div className="flex h-full flex-col">
            <ScrollArea className="min-h-0 flex-1">
              <table className="w-full min-w-[22rem] font-sans text-data">
                <thead className="sticky top-0 bg-panel-header text-secondary">
                  <tr className="h-7 text-left">
                    <th scope="col" className="px-3 font-normal">
                      {t('eco.rateColumns.rate')}
                    </th>
                    <th scope="col" className="px-3 font-normal">
                      {t('eco.rateColumns.code')}
                    </th>
                    <th scope="col" className="px-3 text-right font-normal">
                      {t('eco.rateColumns.level')}
                    </th>
                    <th scope="col" className="px-3 text-right font-normal">
                      {t('eco.rateColumns.change')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((rate, index) => {
                    const cemac = rate.origin === 'cmkt'
                    // A dashed line between the CEMAC's yields and the world's, as the mockup.
                    const firstWorld = !cemac && index > 0 && series[index - 1].origin === 'cmkt'
                    return (
                      <tr
                        key={rate.code}
                        title={pointNote(rate)}
                        className={clsx(
                          'h-6 even:bg-row-alt',
                          firstWorld && 'border-t border-dashed border-accent-amber',
                        )}
                      >
                        <th
                          scope="row"
                          className={clsx(
                            'px-3 text-left font-normal',
                            cemac ? 'text-accent-amber' : 'text-primary',
                          )}
                        >
                          {locale === 'fr' ? rate.nameFr : rate.nameEn}
                          {rate.stale && (
                            <span className="ml-1.5 text-warning">{t('eco.stale')}</span>
                          )}
                        </th>
                        <td className="px-3 font-mono text-secondary">{rate.code}</td>
                        <td className="px-3 text-right font-mono text-primary tabular-nums">
                          {rate.last ? format.percent(rate.last.value, 2, false) : MISSING}
                        </td>
                        <td
                          className={clsx(
                            'px-3 text-right font-mono tabular-nums',
                            rate.changeBp == null || rate.changeBp === 0
                              ? 'text-secondary'
                              : rate.changeBp > 0
                                ? 'text-up'
                                : 'text-down',
                          )}
                        >
                          {rate.changeBp == null
                            ? MISSING
                            : t('eco.basisPoints', { value: format.signed(rate.changeBp, 0) })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </ScrollArea>
            <p className="shrink-0 border-t px-3 py-2 font-sans text-label text-secondary">
              {cemacDay
                ? t('eco.ratesNote', { date: format.isoDate(cemacDay) })
                : t('eco.ratesNoteNone')}
            </p>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
