import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { MarketStatusBadge } from '@/entities/market'
import { useProviderSource } from '@/entities/news'
import { usePortfolio } from '@/entities/portfolio'
import { useSecurityProfile } from '@/entities/security'
import { audienceOf, canAccessScreen, lockedModule, useCurrentUser } from '@/entities/session'
import { CommandBar } from '@/features/command-bar'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { routes } from '@/shared/routes/paths'
import { SECURITY_PROFILES } from '@/shared/routes/profiles'
import { screenById } from '@/shared/routes/screens'
import { useCurrentRoute } from '@/shared/routes/useCurrentRoute'
import { Logo } from '@/shared/ui/Logo'
import { AlertsIndicator } from './AlertsIndicator'
import { SessionClock } from './SessionClock'
import { TrialBadge } from './TrialBadge'
import { UserMenu } from './UserMenu'

/**
 * Top bar (40 px, spec section 8): logo, command bar, session clock, market status, alerts, user.
 * Back-office screens add a blue BACK-OFFICE badge. On a narrower window (a tablet, a zoomed
 * page) the least needed go first, so that the command bar, the alerts and the user's menu stay:
 * the title, the clock and the badges below 1024 px, the market status below 768 px, the words
 * of the logo and of the alerts and user buttons below 640 px.
 */
export function TopBar({ className }: { className?: string }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { screen, params } = useCurrentRoute()
  const backOffice = audienceOf(user.accountType) === 'backoffice'
  const alerts = screenById('ALRT')
  // A screen the user cannot open, or out of the plan, shows its lock: the title loads nothing of
  // it either.
  const open = screen !== null && canAccessScreen(user, screen) && !lockedModule(user, screen)
  const subject = open ? (params.securityId ?? params.bondId) : undefined
  const portfolioName = usePortfolio(open ? params.portfolioId : undefined).data?.name
  // The security's name once loaded, as in the screen 2 mockup; its code until then. The
  // portfolio screen names the portfolio, as in the screen 5 mockup.
  const profile = useSecurityProfile(subject).data
  const subjectName = profile?.name ?? subject ?? portfolioName
  // The news studio names its newspaper after it, as the screen 13 mockup does.
  const newspaper = useProviderSource({ enabled: open && screen.id === 'NEWSNEW' }).data?.name
  // DES names the profile of the security's type: "Bond profile" (screen 20 mockup).
  const screenTitle = !screen
    ? ''
    : screen.id === 'DES' && profile
      ? t(SECURITY_PROFILES[profile.type].titleKey)
      : t(screen.titleKey)
  const title = !screen
    ? ''
    : newspaper && screen.id === 'NEWSNEW'
      ? `${screenTitle} — ${newspaper}`
      : `${subjectName ? `${subjectName} — ` : ''}${screenTitle}`
  // A path that is no screen names itself (NotFoundPage).
  useDocumentTitle(screen ? title : null)

  return (
    <header
      className={clsx('flex min-w-0 items-center gap-2 border-b bg-app px-3 sm:gap-4', className)}
    >
      <Logo to={routes.app} compact />
      <CommandBar />
      <span className="hidden min-w-0 truncate font-sans text-label lg:block">{title}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        {backOffice && (
          <span className="hidden h-6 items-center border border-info px-3 font-sans text-title font-semibold tracking-title text-info uppercase lg:inline-flex">
            {t('shell.backOffice')}
          </span>
        )}
        {user.trialEndsAt && (
          <span className="hidden lg:contents">
            <TrialBadge endsOn={user.trialEndsAt} />
          </span>
        )}
        <span className="hidden md:contents">
          <MarketStatusBadge />
        </span>
        <span className="hidden lg:contents">
          <SessionClock />
        </span>
        <AlertsIndicator to={canAccessScreen(user, alerts) ? alerts.path : undefined} />
        <UserMenu />
      </div>
    </header>
  )
}
