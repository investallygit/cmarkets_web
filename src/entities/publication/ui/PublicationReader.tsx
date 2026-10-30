import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { LibraryPublicationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ratingTone, upsidePct } from '../lib/rating'
import { PublicationBody } from './PublicationBody'
import { RatingText } from './PublicationTags'
import { Watermark } from './Watermark'

const RATING_BOX = {
  up: 'border-up bg-up/10',
  down: 'border-down bg-down/10',
  neutral: 'border-secondary',
} as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h4 className="font-sans text-title font-semibold tracking-title text-accent-amber uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

interface PublicationReaderProps {
  publication: LibraryPublicationDto
  /** Before purchase, under the locked contents: the price and the buy button. */
  purchase?: ReactNode
  /** With the full content, after the disclosures: downloads, rating, report. */
  actions?: ReactNode
}

/**
 * A publication as its readers see it (screen 8): the summary and the contents before purchase,
 * the whole text afterwards, watermarked with the buyer's name. The studio's reader preview shows
 * a draft through it.
 */
export function PublicationReader({ publication, purchase, actions }: PublicationReaderProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const { subject, rating } = publication
  const upside = upsidePct(publication.targetPrice, publication.referencePrice)
  const subjectName = subject.type === 'company' ? subject.code : format.country(subject.id)
  const latest = publication.versions.at(-1)

  return (
    <article className="flex flex-col gap-3 p-3">
      <header className="flex flex-col gap-1">
        <h3 className="font-sans text-figure font-semibold">{publication.title}</h3>
        <p className="font-sans text-data text-secondary">
          {[
            publication.analyst.displayName,
            format.date(publication.publishedAt),
            t('publication.pages', { count: publication.pages }),
            t(`publication.subjectTypes.${subject.type}`),
            subjectName,
          ].join(' · ')}
        </p>
        {publication.updatedAt && latest && (
          <p className="font-sans text-data text-info">
            {t('publication.updated', {
              date: format.date(publication.updatedAt),
              version: latest.number,
            })}
          </p>
        )}
      </header>

      {rating && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span
            className={clsx('border px-3 py-1 text-data uppercase', RATING_BOX[ratingTone(rating)])}
          >
            <RatingText
              rating={rating}
              targetPrice={publication.targetPrice}
              currency={subject.currency}
            />
          </span>
          {publication.referencePrice !== null && (
            <span className="font-mono text-data">
              {t('publication.reference', { price: format.number(publication.referencePrice, 0) })}
              {upside !== null &&
                ` · ${t('publication.upside', { upside: format.percent(upside, 1) })}`}
            </span>
          )}
          {publication.dataDate && (
            <span className="font-mono text-data">
              {t('publication.dataDate', { date: format.isoDate(publication.dataDate) })}
            </span>
          )}
        </div>
      )}

      <Section title={t('publication.summary')}>
        <p className="font-sans text-label leading-relaxed">{publication.summary}</p>
      </Section>

      {publication.hasAccess && publication.body ? (
        <>
          <div className="relative">
            <PublicationBody body={publication.body} charts={publication.charts} />
            {publication.watermark && (
              <Watermark
                text={t('publication.watermark', {
                  name: publication.watermark.name,
                  date: format.date(publication.watermark.purchasedAt),
                })}
              />
            )}
          </div>
          <Section title={t('publication.disclosures.title')}>
            <ul className="flex list-disc flex-col gap-0.5 pl-4 font-sans text-data text-secondary">
              <li>{t('publication.disclosures.conflicts')}</li>
              {publication.referencePrice !== null && publication.referenceDate && (
                <li>
                  {t('publication.disclosures.reference', {
                    price: format.number(publication.referencePrice, 0),
                    date: format.isoDate(publication.referenceDate),
                  })}
                </li>
              )}
              {publication.dataDate && (
                <li>
                  {t('publication.disclosures.dataDate', {
                    date: format.isoDate(publication.dataDate),
                  })}
                </li>
              )}
              <li>{t('publication.disclosures.disclaimer')}</li>
              <li>{t('publication.disclosures.sources')}</li>
            </ul>
          </Section>
          {actions}
        </>
      ) : (
        <>
          <Section title={t('publication.contents')}>
            <ol className="flex flex-col gap-1 font-sans text-label">
              {publication.contents.map((entry) => (
                <li key={entry} className="flex items-baseline justify-between gap-3">
                  <span>{entry}</span>
                  <span className="shrink-0 font-sans text-data text-secondary">
                    {t('publication.locked')}
                  </span>
                </li>
              ))}
            </ol>
          </Section>
          {purchase}
        </>
      )}
    </article>
  )
}
