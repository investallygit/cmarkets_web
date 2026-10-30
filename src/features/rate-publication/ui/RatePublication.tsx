import { clsx } from 'clsx'
import { Star } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScoreText, useRatePublication } from '@/entities/publication'
import type { LibraryPublicationDto } from '@/shared/api/contracts'
import { toast } from '@/shared/ui/toast'

const STARS = [1, 2, 3, 4, 5] as const

/** 1 to 5 stars from a reader of the full content; rating again replaces the first one. */
export function RatePublication({ publication }: { publication: LibraryPublicationDto }) {
  const { t } = useTranslation()
  const rate = useRatePublication(publication.id)
  const [hovered, setHovered] = useState<number | null>(null)
  if (!publication.canRate) return null
  const shown = hovered ?? publication.myRating ?? 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-sans text-data text-secondary">
        {publication.myRating ? t('rating.yours') : t('rating.rate')}
      </span>
      <div
        role="radiogroup"
        aria-label={t('rating.rate')}
        className="flex"
        onMouseLeave={() => setHovered(null)}
      >
        {STARS.map((stars) => (
          <button
            key={stars}
            type="button"
            role="radio"
            aria-checked={publication.myRating === stars}
            aria-label={t('rating.stars', { count: stars })}
            disabled={rate.isPending}
            onMouseEnter={() => setHovered(stars)}
            onClick={() =>
              rate.mutate(stars, {
                onSuccess: () => toast.success(t('rating.thanks')),
                onError: (error) => toast.error(error.message),
              })
            }
            className="p-0.5 text-accent-amber disabled:opacity-50"
          >
            <Star
              aria-hidden
              className={clsx('size-4', stars <= shown ? 'fill-current' : 'opacity-40')}
            />
          </button>
        ))}
      </div>
      <span className="ml-auto inline-flex items-center gap-1 font-mono text-data text-secondary">
        <ScoreText score={publication.score} />
        {t('publication.scoreCount', { count: publication.scoreCount })}
      </span>
    </div>
  )
}
