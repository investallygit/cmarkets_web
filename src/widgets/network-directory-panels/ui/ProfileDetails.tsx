import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { VerifiedBadge } from '@/entities/account'
import {
  AccountTypeBadge,
  ExperiencePeriod,
  experiencesInOrder,
  ProfileAvatar,
  ProfileStats,
  useSpecialties,
} from '@/entities/profile'
import type { PublicProfileDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'

const SECTION_TITLE =
  'font-sans text-title font-semibold tracking-title text-accent-amber uppercase'

interface ProfileDetailsProps {
  profile: PublicProfileDto
  /** The name is the page's h1 on the public page, under the panel's h2 in NET. */
  headingLevel: 1 | 3
}

/**
 * A profile in full (spec section 9, screen 10): photo or initials, name, type and VERIFIED
 * badges, job, organisation, place and languages, an Analyst's figures, about, specialties,
 * experience and certifications. NET and the public page show it alike.
 */
export function ProfileDetails({ profile, headingLevel }: ProfileDetailsProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const specialties = useSpecialties().data ?? []
  const Name = headingLevel === 1 ? 'h1' : 'h3'
  const Section = headingLevel === 1 ? 'h2' : 'h4'
  const section = (title: string, children: ReactNode) => (
    <section className="flex flex-col gap-1.5">
      <Section className={SECTION_TITLE}>{title}</Section>
      {children}
    </section>
  )
  const names = profile.specialties.map(
    (id) => specialties.find((specialty) => specialty.id === id)?.name[locale] ?? id,
  )

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-4">
        <ProfileAvatar
          name={profile.displayName}
          type={profile.accountType}
          photoUrl={profile.photoUrl}
          size="lg"
        />
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <Name className="max-w-full truncate font-sans text-figure font-semibold">
            {profile.displayName}
          </Name>
          <div className="flex flex-wrap gap-1.5">
            <AccountTypeBadge type={profile.accountType} />
            {profile.verified && <VerifiedBadge />}
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-0.5">
        <p className="font-sans text-label">{profile.jobTitle}</p>
        <p className="font-sans text-data text-secondary">
          {[
            profile.organization,
            [profile.city, format.country(profile.country)].filter(Boolean).join(', '),
            profile.languages.map((code) => format.language(code)).join(', '),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <ProfileStats stats={profile.stats} memberSince={profile.memberSince} className="mt-1" />
      </div>
      {profile.about &&
        section(
          t('network.view.about'),
          <p className="font-sans text-label whitespace-pre-line">{profile.about}</p>,
        )}
      {names.length > 0 &&
        section(
          t('network.view.specialties'),
          <ul className="flex flex-wrap gap-1.5">
            {names.map((name) => (
              <li key={name} className="border px-1.5 font-sans text-title text-info">
                {name}
              </li>
            ))}
          </ul>,
        )}
      {profile.experiences.length > 0 &&
        section(
          t('network.view.experience'),
          <ul className="flex flex-col gap-0.5">
            {experiencesInOrder(profile.experiences).map((experience) => (
              <li key={experience.id} className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
                <ExperiencePeriod experience={experience} />
                <span className="font-sans text-label">
                  {[experience.title, experience.organization].filter(Boolean).join(', ')}
                </span>
              </li>
            ))}
          </ul>,
        )}
    </div>
  )
}
