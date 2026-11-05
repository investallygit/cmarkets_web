import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AccountType, ProfileStatsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { AccountTypeBadge } from './AccountTypeBadge'
import { ProfileAvatar } from './ProfileAvatar'

/** What a card shows of a profile, as the directory lists it. */
export interface ProfileCardData {
  displayName: string
  accountType: AccountType
  photoUrl: string | null
  jobTitle: string
  organization: string
  city: string
  /** ISO code, shown as is: "Douala, CM". */
  country: string
  /** Names, in the user's language. */
  specialties: string[]
  /** An Analyst's, when shown; the other cards say since when the user is a member. */
  stats: ProfileStatsDto | null
  memberSince: string
}

interface ProfileCardProps {
  profile: ProfileCardData
  /** Contact, View profile... */
  actions?: ReactNode
  selected?: boolean
  className?: string
}

/**
 * A profile card of the directory (spec section 9, screen 10): photo or initials, name and type,
 * job, organisation and place, specialties, then an Analyst's figures or the year they joined.
 */
export function ProfileCard({ profile, actions, selected = false, className }: ProfileCardProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const { stats } = profile
  return (
    <article
      className={clsx(
        'flex flex-col gap-2.5 border p-3',
        selected ? 'border-accent-amber bg-selected' : 'bg-panel',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <ProfileAvatar
          name={profile.displayName}
          type={profile.accountType}
          photoUrl={profile.photoUrl}
        />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <h3 className="max-w-full truncate font-sans text-label font-semibold">
            {profile.displayName}
          </h3>
          <AccountTypeBadge type={profile.accountType} />
        </div>
      </header>
      <div className="flex flex-col gap-0.5">
        <p className="font-sans text-label">{profile.jobTitle}</p>
        <p className="font-sans text-data text-secondary">
          {[profile.organization, `${profile.city}, ${profile.country}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {profile.specialties.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t('network.card.specialties')}>
          {profile.specialties.map((name) => (
            <li key={name} className="border px-1.5 font-sans text-title text-info">
              {name}
            </li>
          ))}
        </ul>
      )}
      <p className="font-mono text-data text-secondary">
        {stats
          ? [
              t('network.card.publications', { count: stats.publications }),
              stats.rating !== null && `★ ${format.number(stats.rating, 1)}`,
              t('network.card.followers', { count: stats.followers }),
            ]
              .filter(Boolean)
              .join(' · ')
          : t('network.card.memberSince', { year: profile.memberSince.slice(0, 4) })}
      </p>
      {actions}
    </article>
  )
}
