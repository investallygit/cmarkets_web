import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'
import { Logo } from '@/shared/ui/Logo'

interface AuthLayoutProps {
  title: string
  subtitle?: ReactNode
  /** Width of the card in px; the sign-up form needs more. */
  width?: number
  children: ReactNode
}

/**
 * The login pages, outside the app shell, in the brand navy and green (spec section 8): the logo,
 * the language, then the form on a card. The page scrolls when the form is longer than the window.
 */
export function AuthLayout({ title, subtitle, width = 400, children }: AuthLayoutProps) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-brand-navy">
      <header className="flex shrink-0 items-center justify-between px-6 py-4">
        <Logo />
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 justify-center px-4 py-6">
        <section
          aria-labelledby="auth-title"
          style={{ maxWidth: width }}
          className="my-auto flex w-full flex-col gap-4 border bg-panel p-6"
        >
          <header className="flex flex-col gap-1">
            <h1 id="auth-title" className="font-sans text-figure font-semibold">
              {title}
            </h1>
            {subtitle && <p className="font-sans text-label text-secondary">{subtitle}</p>}
          </header>
          {children}
        </section>
      </main>
      <footer className="shrink-0 px-6 py-3 font-sans text-data text-secondary">
        {t('auth.footer')}
      </footer>
    </div>
  )
}
