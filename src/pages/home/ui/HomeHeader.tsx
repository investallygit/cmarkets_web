import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'
import { Logo } from '@/shared/ui/Logo'
import { NAV_SECTIONS } from '../config/content'
import { HeaderActions } from './HomeActions'
import { Container } from './Section'

/**
 * Stays at the top while the page scrolls: the logo, the sections, the language, the login. Once
 * the page has scrolled, a border and a shadow set it apart from the content under it.
 */
export function HomeHeader({ scrolled }: { scrolled: boolean }) {
  const { t } = useTranslation()
  return (
    <header
      className={clsx(
        'sticky top-0 z-10 border-b bg-brand-navy/95 backdrop-blur transition-[border-color,box-shadow] duration-300',
        scrolled
          ? 'border-primary/10 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.7)]'
          : 'border-transparent',
      )}
    >
      <Container className="flex h-14 items-center gap-8">
        <Logo />
        <nav aria-label={t('home.nav.label')} className="hidden items-center gap-6 md:flex">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="font-sans text-label text-primary/75 transition-colors hover:text-primary"
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
