import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'
import { Logo } from '@/shared/ui/Logo'
import { NAV_SECTIONS } from '../config/content'
import { HeaderActions } from './HomeActions'
import { Container } from './Section'

/** Stays at the top while the page scrolls: the logo, the sections, the language, the login. */
export function HomeHeader() {
  const { t } = useTranslation()
  return (
    <header className="sticky top-0 z-10 border-b border-primary/10 bg-brand-navy/95 backdrop-blur">
      <Container className="flex h-14 items-center gap-8">
        <Logo />
        <nav aria-label={t('home.nav.label')} className="hidden items-center gap-6 md:flex">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="font-sans text-label text-primary/75 hover:text-primary"
            >
              {t(`home.nav.${section}`)}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          <LanguageSwitch />
          <HeaderActions />
        </div>
      </Container>
    </header>
  )
}
