import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ProfileStatsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

interface ProfileStatsProps {
  /** An Analyst's, when shown; null for the others, who show since when they are members. */
  stats: ProfileStatsDto | null
  memberSince: string
  className?: string
}

/** "42 publications · ★ 4.4 · 412 followers", or "Member since 2026" (spec section 15). */
export function ProfileStats({ stats, memberSince, className }: ProfileStatsProps) {
  const { t } = useTranslation()
  const format = useFormat()
  return (
    <p className={clsx('font-mono text-data text-secondary', className)}>
      {stats
        ? [
            t('network.card.publications', { count: stats.publications }),
            stats.rating !== null && `★ ${format.number(stats.rating, 1)}`,
            t('network.card.followers', { count: stats.followers }),
          ]
            .filter(Boolean)
            .join(' · ')
        : t('network.card.memberSince', { year: memberSince.slice(0, 4) })}
    </p>
  )
}
