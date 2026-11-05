import { clsx } from 'clsx'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useVisitorStatus } from '@/entities/session'
import { routes } from '@/shared/routes/paths'
import { ButtonLink } from '@/shared/ui/form/Button'

/**
 * The calls to action of the hero and of the end of the page: the free trial and the login, or
 * the terminal for a visitor already logged in. They keep their place while the session is
 * restored, so nothing moves.
 */
export function HomeActions() {
  const { t } = useTranslation()
  const visitor = useVisitorStatus()
  if (visitor === 'authenticated') {
    return (
      <ButtonLink
        to={routes.app}
        variant="brand"
        size="xl"
        icon={ArrowRight}
        className="self-start"
      >
        {t('home.cta.open')}
      </ButtonLink>
    )
  }
  return (
    <div className={clsx('flex flex-wrap gap-3', visitor === 'pending' && 'invisible')}>
      <ButtonLink to={routes.signUp} variant="brand" size="xl" icon={ArrowRight}>
        {t('home.cta.trial')}
      </ButtonLink>
      <ButtonLink to={routes.login} size="xl">
        {t('home.cta.logIn')}
      </ButtonLink>
    </div>
  )
}

/** The same in the header: the login, then the trial, which a phone leaves to the hero. */
export function HeaderActions() {
  const { t } = useTranslation()
  const visitor = useVisitorStatus()
  if (visitor === 'authenticated') {
    return (
      <ButtonLink to={routes.app} variant="brand" size="lg" icon={ArrowRight}>
        {t('home.cta.open')}
      </ButtonLink>
    )
  }
  return (
    <div className={clsx('flex items-center gap-2', visitor === 'pending' && 'invisible')}>
      <ButtonLink to={routes.login} size="lg">
        {t('home.cta.logIn')}
      </ButtonLink>
      <ButtonLink to={routes.signUp} variant="brand" size="lg" className="max-sm:hidden">
        {t('home.cta.trialShort')}
      </ButtonLink>
    </div>
  )
}
