import { clsx } from 'clsx'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  PublicationAccess,
  PublicationRating,
  PublicationSubjectDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { isRecommendation, ratingTone } from '../lib/rating'

const TONE_CLASSES = { up: 'text-up', down: 'text-down', neutral: 'text-primary' } as const

/** Price in amber or FREE in green (screen 8). */
export function AccessBadge({
  access,
  price,
}: {
  access: PublicationAccess
  price: number | null
}) {
  const { t } = useTranslation()
  const format = useFormat()
  return access === 'free' || price === null ? (
    <Badge tone="up">{t('publication.free')}</Badge>
  ) : (
    <Badge tone="amber">{t('publication.priceXaf', { price: format.number(price, 0) })}</Badge>
  )
}

interface RatingTextProps {
  rating: PublicationRating | null
  targetPrice: number | null
  /** The target's currency; XAF prices show without it, as in the mockups. */
  currency: string | null
  className?: string
}

/** "Buy · target 58,000" or "Stable outlook", in the rating's colour. */
export function RatingText({ rating, targetPrice, currency, className }: RatingTextProps) {
  const { t } = useTranslation()
  const format = useFormat()
  if (!rating) return null
  const target =
    isRecommendation(rating) && targetPrice
      ? t('publication.target', {
          price: `${format.number(targetPrice, 0)}${currency && currency !== 'XAF' ? ` ${currency}` : ''}`,
        })
      : null
  return (
    <span className={clsx('font-mono font-semibold', TONE_CLASSES[ratingTone(rating)], className)}>
      {[t(`publication.ratings.${rating}`), target].filter(Boolean).join(' · ')}
    </span>
  )
}

/** Readers' average rating: ★ 4.6. */
export function ScoreText({ score, count }: { score: number | null; count?: number }) {
  const { t } = useTranslation()
  const format = useFormat()
  if (score === null) return <span className="font-mono text-data text-secondary">—</span>
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-data text-accent-amber"
      title={count === undefined ? undefined : t('publication.scoreCount', { count })}
    >
      <Star aria-hidden className="size-3 fill-current" />
      <span className="sr-only">{t('publication.score')}</span>
      {format.number(score, 1)}
    </span>
  )
}

/** "Company · SEMC" or "Sov. · Cameroon". */
export function SubjectText({ subject }: { subject: PublicationSubjectDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <span className="font-mono text-info">
      {t(`publication.subjectTypes.${subject.type}`)} ·{' '}
      {subject.type === 'company' ? subject.code : format.country(subject.id)}
    </span>
  )
}
