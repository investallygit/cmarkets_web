import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { usePublicProfile } from '@/entities/profile'
import { useVisitorStatus } from '@/entities/session'
import { isApiError } from '@/shared/api'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { directoryPath, loginPath, routes } from '@/shared/routes/paths'
import { ButtonLink } from '@/shared/ui/form/Button'
import { LanguageSwitch } from '@/shared/ui/LanguageSwitch'
import { Logo } from '@/shared/ui/Logo'
import { PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { ProfileDetails } from '@/widgets/network-directory-panels'

/**
 * /p/{handle}, a profile its owner made public (spec section 15): read without login, without the
 * contact details, with "Log in to contact", which opens it in NET once logged in. Outside the app
 * shell, in the brand colours as the login pages.
 */
export function PublicProfilePage() {
  const { t } = useTranslation()
  const { handle = '' } = useParams()
  const profile = usePublicProfile(handle)
  const visitor = useVisitorStatus()
  const missing = isApiError(profile.error, 404)
  // The tab says what the page says: the name, or that the profile is not to be read.
  useDocumentTitle(
    profile.data?.displayName ??
      (missing ? t('network.publicPage.notFound') : t('screens.NET.title')),
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-brand-navy">
      <header className="flex shrink-0 items-center justify-between px-6 py-4">
        <Logo />
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 justify-center px-4 py-6">
        <article className="my-auto flex w-full max-w-160 flex-col gap-5 border bg-panel p-6">
          <p className="font-sans text-title font-semibold tracking-title text-secondary uppercase">
            {t('network.publicPage.kicker')}
          </p>
          {profile.data ? (
            <>
              <ProfileDetails profile={profile.data} headingLevel={1} />
              <div
                className={
                  visitor === 'pending' ? 'invisible flex border-t pt-4' : 'flex border-t pt-4'
                }
              >
                <ButtonLink
                  to={
                    visitor === 'authenticated'
                      ? directoryPath(profile.data.userId)
                      : loginPath(directoryPath(profile.data.userId))
                  }
                  variant="brand"
                  size="xl"
                  icon={ArrowRight}
                >
                  {visitor === 'authenticated'
                    ? t('network.publicPage.open')
                    : t('network.publicPage.logInToContact')}
                </ButtonLink>
              </div>
            </>
          ) : missing ? (
            <>
              <h1 className="font-sans text-figure font-semibold">
                {t('network.publicPage.notFound')}
              </h1>
              <ButtonLink to={routes.home} size="lg" className="self-start">
                {t('network.publicPage.home')}
              </ButtonLink>
            </>
          ) : profile.isError ? (
            <PanelError error={profile.error} onRetry={() => void profile.refetch()} />
          ) : (
            <PanelLoading />
          )}
        </article>
      </main>
      <footer className="shrink-0 px-6 py-3 font-sans text-data text-secondary">
        {t('auth.footer')}
      </footer>
    </div>
  )
}
