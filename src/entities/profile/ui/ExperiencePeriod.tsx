import { useTranslation } from 'react-i18next'
import type { ExperienceDto } from '@/shared/api/contracts'

/** "2014 – 2020", "2020 – now", or "Certification": the first column of an experience. */
export function ExperiencePeriod({ experience }: { experience: ExperienceDto }) {
  const { t } = useTranslation()
  return (
    <span className="font-mono text-data text-secondary">
      {experience.kind === 'certification'
        ? t('network.profile.certification')
        : `${experience.from ?? ''} – ${experience.to ?? t('network.profile.now')}`}
    </span>
  )
}
