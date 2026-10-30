import { clsx } from 'clsx'
import { Check, Clock, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AnalystAvatar, useAnalyst } from '@/entities/analyst'
import { RatingText } from '@/entities/publication'
import { FollowButton } from '@/features/follow-analyst'
import type { AnalystDto, AnalystRatingDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ChangeText } from '@/shared/ui/ChangeText'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'

const OUTCOME_ICONS = { confirmed: Check, missed: X, open: Clock } as const
const OUTCOME_CLASSES = { confirmed: 'text-up', missed: 'text-down', open: 'text-secondary' }

/**
 * Screen 8, the author of the publication open: short profile, Follow, and each Buy / Hold / Sell
 * against the price 12 months later (spec section 13). API GET /analysts/{id}.
 */
export function AnalystPanel({ analystId }: { analystId: string | null }) {
  const { t } = useTranslation()
  const analyst = useAnalyst(analystId)
  return (
    <Panel
      title={t('panels.analyst')}
      code="PUB"
      options={analyst.data && <FollowButton analyst={analyst.data} />}
    >
      {analystId === null ? (
        <PanelEmpty message={t('library.choose')} />
      ) : (
        <QueryView query={analyst}>{(data) => <AnalystProfile analyst={data} />}</QueryView>
      )}
    </Panel>
  )
}

function AnalystProfile({ analyst }: { analyst: AnalystDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const rows: [label: string, value: string][] = [
    [t('analyst.publications'), format.number(analyst.publications, 0)],
    [
      t('analyst.score'),
      analyst.score === null
        ? '—'
        : t('analyst.scoreValue', { score: format.number(analyst.score, 1) }),
    ],
    [t('analyst.followers'), format.number(analyst.followers, 0)],
    [
      t('analyst.confirmed'),
      analyst.confirmedPct === null ? '—' : format.percent(analyst.confirmedPct, 0, false),
    ],
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 p-3">
        <AnalystAvatar name={analyst.displayName} />
        <div className="min-w-0">
          <p className="truncate font-sans text-label font-semibold">{analyst.displayName}</p>
          <p className="truncate font-sans text-data text-secondary">{analyst.headline}</p>
        </div>
      </div>
      <dl>
        {rows.map(([label, value], index) => (
          <div
            key={label}
            className={clsx(
              'flex h-row items-center justify-between px-3',
              index % 2 === 0 && 'bg-row-alt',
            )}
          >
            <dt className="font-sans text-label text-secondary">{label}</dt>
            <dd className="font-mono text-data">{value}</dd>
          </div>
        ))}
      </dl>
      {analyst.ratings.length > 0 && <RatingHistory ratings={analyst.ratings} />}
    </div>
  )
}

function RatingHistory({ ratings }: { ratings: readonly AnalystRatingDto[] }) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <section className="mt-2 border-t">
      <h3 className="px-3 pt-2 pb-1 font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
        {t('analyst.history')}
      </h3>
      <table className="w-full font-mono text-data">
        <thead>
          <tr className="h-row text-left font-sans text-secondary">
            <th scope="col" className="px-3 font-normal">
              {t('analyst.columns.date')}
            </th>
            <th scope="col" className="px-1 font-normal">
              {t('analyst.columns.rating')}
            </th>
            <th scope="col" className="px-1 text-right font-normal">
              {t('analyst.columns.reference')}
            </th>
            <th scope="col" className="px-1 text-right font-normal">
              {t('analyst.columns.after')}
            </th>
            <th scope="col" className="px-3 text-right font-normal">
              <span className="sr-only">{t('analyst.columns.outcome')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ratings.map((rating) => {
            const Icon = OUTCOME_ICONS[rating.outcome]
            return (
              <tr key={rating.publicationId} className="h-row border-t" title={rating.title}>
                <td className="px-3 text-secondary">{format.isoDate(rating.publishedAt)}</td>
                <td className="px-1">
                  <span className="text-accent-amber">{rating.subjectCode}</span>{' '}
                  <RatingText
                    rating={rating.rating}
                    targetPrice={null}
                    currency={rating.currency}
                  />
                </td>
                <td className="px-1 text-right">{format.number(rating.referencePrice, 0)}</td>
                <td className="px-1 text-right">
                  {rating.changePct === null ? (
                    '—'
                  ) : (
                    <ChangeText value={rating.changePct} percent />
                  )}
                </td>
                <td className="px-3 text-right">
                  <Icon
                    aria-label={t(`analyst.outcomes.${rating.outcome}`)}
                    className={clsx('inline size-3.5', OUTCOME_CLASSES[rating.outcome])}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
