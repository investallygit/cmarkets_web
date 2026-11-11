import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { NewsTags } from '@/entities/news'
import { FrozenChart } from '@/entities/publication'
import type { SharedObjectDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { libraryPath, newsPath, securityPath } from '@/shared/routes/paths'

function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 self-start font-sans text-data text-info hover:underline"
    >
      {children}
      <ArrowRight aria-hidden className="size-3" />
    </Link>
  )
}

/**
 * A CMarket object shared in a message, in an amber frame, as it was when shared: a security
 * (a bond with its yield and duration), a frozen chart, a publication's preview or a news item
 * with its two tags. It opens the matching screen (spec section 9, screen 11): a security, the
 * profile of its type (a bond's, screen 20); a news item, its content.
 */
export function SharedCard({ shared }: { shared: SharedObjectDto }) {
  const { t } = useTranslation()
  const format = useFormat()

  if (shared.type === 'security') {
    const bond = shared.securityType === 'bond'
    return (
      <div className="flex flex-col gap-1.5 border border-accent-amber p-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-label font-bold text-accent-amber">{shared.code}</span>
          <span className="font-mono text-title text-secondary">DES</span>
        </div>
        <p className="font-mono text-data">
          {[
            t('messaging.card.price', { value: format.number(shared.price, bond ? 2 : 0) }),
            shared.changePct !== null && format.percent(shared.changePct),
            shared.yieldPct !== null &&
              t('messaging.card.yield', { value: format.percent(shared.yieldPct, 2, false) }),
            shared.modifiedDuration !== null &&
              t('messaging.card.duration', { value: format.number(shared.modifiedDuration, 2) }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <CardLink to={securityPath(shared.securityId)}>{t('messaging.card.openDes')}</CardLink>
      </div>
    )
  }

  if (shared.type === 'news') {
    return (
      <div className="flex flex-col gap-1.5 border border-accent-amber p-2.5">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-data">
          <NewsTags type={shared.newsType} source={shared.source} mode="none" />
          {shared.subject && (
            <span className="font-semibold text-accent-amber">{shared.subject}</span>
          )}
          <span className="text-secondary">
            {format.date(shared.publishedAt)} {format.time(shared.publishedAt)}
          </span>
        </p>
        <span className="font-sans text-label font-semibold">{shared.headline}</span>
        <CardLink to={newsPath(shared.newsId)}>{t('messaging.card.openNews')}</CardLink>
      </div>
    )
  }

  if (shared.type === 'chart') {
    return (
      <div className="flex flex-col gap-1.5 border border-accent-amber p-2.5">
        <div className="h-40 min-w-56">
          <FrozenChart chart={shared.chart} />
        </div>
        <CardLink to={securityPath(shared.chart.securityId, 'gp')}>
          {t('messaging.card.openGp')}
        </CardLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 border border-accent-amber p-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-label font-semibold">{shared.title}</span>
        <span
          className={
            shared.price === null
              ? 'shrink-0 font-mono text-data text-up uppercase'
              : 'shrink-0 font-mono text-data text-accent-amber'
          }
        >
          {shared.price === null
            ? t('publication.free')
            : t('publication.priceXaf', { price: format.number(shared.price, 0) })}
        </span>
      </div>
      <span className="font-sans text-data text-secondary">
        {t('messaging.card.by', { name: shared.analystName })}
      </span>
      <p className="line-clamp-3 font-sans text-data">{shared.summary}</p>
      {shared.access === 'paid' && (
        <p className="font-sans text-title text-secondary">{t('messaging.card.preview')}</p>
      )}
      <CardLink to={libraryPath(shared.publicationId)}>{t('messaging.card.openPub')}</CardLink>
    </div>
  )
}
