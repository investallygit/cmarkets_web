import { useTranslation } from 'react-i18next'
import { useGlobalRates } from '@/entities/rate'
import { useFormat, useLocale } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const MISSING = '—'

/**
 * Screen 26, the euro area's benchmarks (spec section 9): Euribor 1, 3, 6 and 12 months and the
 * EUR 10-year swap, EODHD's MONEY series at their latest point; the peg makes them the BEAC's
 * concern, as the mockup notes. API /macro/global-rates?set=euro.
 */
export function EuroBenchmarksPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const rates = useGlobalRates('euro')

  return (
    <Panel title={t('panels.euroBenchmarks')} code="FX" options={<span>{t('fx.money')}</span>}>
      <QueryView query={rates} isEmpty={(series) => series.length === 0}>
        {(series) => (
          <div className="flex flex-col">
            <dl className="font-sans text-data">
              {series.map((rate) => (
                <div
                  key={rate.code}
                  className="flex h-7 items-center justify-between gap-3 px-3 even:bg-row-alt"
                >
                  <dt className="text-primary">{locale === 'fr' ? rate.nameFr : rate.nameEn}</dt>
                  <dd className="font-mono text-primary tabular-nums">
                    {rate.last ? format.percent(rate.last.value, 2, false) : MISSING}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="px-3 py-2 font-sans text-label text-secondary">{t('fx.euroNote')}</p>
          </div>
        )}
      </QueryView>
    </Panel>
  )
}
