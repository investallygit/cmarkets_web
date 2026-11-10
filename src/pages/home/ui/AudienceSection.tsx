import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useVisitorStatus } from '@/entities/session'
import { CLIENT_ACCOUNT_TYPES } from '@/shared/api/contracts'
import { signUpPath } from '@/shared/routes/paths'
import { ButtonLink } from '@/shared/ui/form/Button'
import { AUDIENCE_PHOTOS } from '../config/photos'
import { revealDelay } from '../lib/reveal'
import { Photo } from './Photo'
import { Section } from './Section'

/**
 * The target users of spec section 1 by client account type, each under a photo of its work and
 * with its sign-up; a visitor already logged in has an account, so no sign-up is offered. Seven
 * types fill rows of three (two on a tablet), the last one centred.
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
      <ul className="flex flex-wrap justify-center gap-4">
        {CLIENT_ACCOUNT_TYPES.map((accountType, index) => (
          <li
            key={accountType}
            style={revealDelay(index)}
            className="reveal group flex basis-full flex-col border bg-panel sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-2rem)/3)]"
          >
            <div className="aspect-3/2 overflow-hidden border-b">
              <Photo
                photo={AUDIENCE_PHOTOS[accountType]}
                sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
                className="size-full brightness-75 saturate-50 transition duration-700 group-hover:brightness-90 group-hover:saturate-100 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-6">
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
            </div>
          </li>
        ))}
      </ul>
      <p
        style={revealDelay(CLIENT_ACCOUNT_TYPES.length)}
        className="reveal max-w-3xl font-sans text-label text-primary/75"
      >
        {t('home.audience.organization')}
      </p>
    </Section>
  )
}
