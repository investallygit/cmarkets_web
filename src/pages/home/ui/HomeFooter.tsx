import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useVisitorStatus } from '@/entities/session'
import { routes } from '@/shared/routes/paths'
import { Logo } from '@/shared/ui/Logo'
import { Container } from './Section'

/** The footer's links follow the session as the top of the page does (B37). */
export function HomeFooter() {
  const { t } = useTranslation()
  const visitor = useVisitorStatus()
  const link = 'font-sans text-label text-primary/75 hover:text-primary'
  return (
    <footer className="border-t border-primary/10 py-10">
      <Container className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="font-sans text-data text-secondary">{t('auth.footer')}</p>
          <p className="font-sans text-data text-secondary">{t('home.footer.sources')}</p>
          <p className="font-sans text-data text-secondary">{t('home.footer.photos')}</p>
        </div>
        <nav aria-label={t('home.footer.label')} className="flex flex-wrap gap-x-6 gap-y-2">
          <a href="#plans" className={link}>
            {t('home.nav.plans')}
          </a>
          {visitor === 'authenticated' ? (
            <Link to={routes.app} className={link}>
              {t('home.cta.open')}
            </Link>
          ) : (
            <>
              <Link to={routes.login} className={link}>
                {t('home.cta.logIn')}
              </Link>
              <Link to={routes.signUp} className={link}>
                {t('auth.login.signUp')}
              </Link>
            </>
          )}
        </nav>
      </Container>
    </footer>
  )
}
