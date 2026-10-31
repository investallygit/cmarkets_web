import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CLIENT_ACCOUNT_TYPES } from '@/shared/api/contracts'
import { signUpPath } from '@/shared/routes/paths'
import { ButtonLink } from '@/shared/ui/form/Button'
import { useVisitorStatus } from '../model/useVisitorStatus'
import { Section } from './Section'

/**
 * The target users of spec section 1 by client account type, each with its sign-up; a visitor
 * already logged in has an account, so no sign-up is offered.
 */
export function AudienceSection() {
  const { t } = useTranslation()
  const visitor = useVisitorStatus()
  return (
    <Section
      id="audience"
      eyebrow={t('home.audience.eyebrow')}
      title={t('home.audience.title')}
      lead={t('home.audience.lead')}
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CLIENT_ACCOUNT_TYPES.map((accountType) => (
          <li key={accountType} className="flex flex-col gap-3 border bg-panel p-6">
            <p className="font-mono text-data tracking-title text-accent-amber uppercase">
              {t(`accountTypes.${accountType}`)}
            </p>
            <h3 className="font-sans text-label font-semibold">
              {t(`home.audience.${accountType}.who`)}
            </h3>
            <p className="font-sans text-label text-primary/75">
              {t(`home.audience.${accountType}.text`)}
            </p>
            {visitor === 'anonymous' && (
              <ButtonLink
                to={signUpPath(accountType)}
                icon={ArrowRight}
                className="mt-auto self-start"
              >
                {t(`home.audience.${accountType}.cta`)}
              </ButtonLink>
            )}
          </li>
        ))}
      </ul>
      <p className="max-w-3xl font-sans text-label text-primary/75">
        {t('home.audience.organization')}
      </p>
    </Section>
  )
}
