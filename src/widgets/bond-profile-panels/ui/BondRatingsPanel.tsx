import { useTranslation } from 'react-i18next'
import { useBondLabels, useBondRatings } from '@/entities/bond'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { DASH } from '../lib/words'

/**
 * Screen 20, ratings: S&P's, Moody's and Fitch's in force with the day each was given, "NR"
 * for an agency that does not rate the bond; the composite and the credit bucket. API
 * /bonds/{id}/ratings.
 */
export function BondRatingsPanel({ bondId }: { bondId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useBondLabels()
  const ratings = useBondRatings(bondId)
  return (
    <Panel
      title={t('panels.bondRatings')}
      code="RAT"
      options={
        ratings.data && (
          <span>
            {t('bondProfile.ratings.composite', { rating: labels.rating(ratings.data.composite) })}
          </span>
        )
      }
      bodyClassName="overflow-y-auto"
    >
      <QueryView query={ratings}>
        {(data) => (
          <dl>
            {data.agencies.map((agency, index) => (
              <div
                key={agency.agency}
                className={
                  index % 2 === 1
                    ? 'grid min-h-row grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 bg-row-alt px-2'
                    : 'grid min-h-row grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-2'
                }
              >
                <dt className="font-sans text-data text-secondary">
                  {t(`bondProfile.ratings.agencies.${agency.agency}`)}
                </dt>
                <dd className="font-mono text-data">{labels.rating(agency.rating)}</dd>
                <dd className="min-w-20 text-right font-mono text-data text-secondary">
                  {agency.ratedOn ? format.isoDate(agency.ratedOn) : DASH}
                </dd>
              </div>
            ))}
            <div className="flex min-h-row items-center gap-4 px-2">
              <dt className="font-sans text-data text-secondary">
                {t('bondProfile.ratings.bucket')}
              </dt>
              <dd className="ml-auto font-mono text-data">
                {t(`bondScreener.buckets.${data.bucket}`)}
              </dd>
            </div>
          </dl>
        )}
      </QueryView>
    </Panel>
  )
}
