import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { MarketStatusBadge } from '@/entities/market'
import { usePortfolio } from '@/entities/portfolio'
import { useSecurityProfile } from '@/entities/security'
import { audienceOf, canAccessScreen, lockedModule, useCurrentUser } from '@/entities/session'
import { CommandBar } from '@/features/command-bar'
import { routes } from '@/shared/routes/paths'
import { screenById } from '@/shared/routes/screens'
import { useCurrentRoute } from '@/shared/routes/useCurrentRoute'
import { Logo } from '@/shared/ui/Logo'
import { AlertsIndicator } from './AlertsIndicator'
import { SessionClock } from './SessionClock'
import { TrialBadge } from './TrialBadge'
import { UserMenu } from './UserMenu'

/**
 * Top bar (40 px, spec section 8): logo, command bar, session clock, market status, alerts, user.
 * Back-office screens add a blue BACK-OFFICE badge.
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
  const subjectName = useSecurityProfile(subject).data?.name ?? subject ?? portfolioName
  const title = screen ? `${subjectName ? `${subjectName} — ` : ''}${t(screen.titleKey)}` : ''

  return (
    <header className={clsx('flex min-w-0 items-center gap-4 border-b bg-app px-3', className)}>
      <Logo to={routes.app} />
      <CommandBar />
      <span className="min-w-0 truncate font-sans text-label">{title}</span>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {backOffice && (
          <span className="inline-flex h-6 items-center border border-info px-3 font-sans text-title font-semibold tracking-title text-info uppercase">
            {t('shell.backOffice')}
          </span>
        )}
        {user.trialEndsAt && <TrialBadge endsOn={user.trialEndsAt} />}
        <MarketStatusBadge />
        <SessionClock />
        <AlertsIndicator to={canAccessScreen(user, alerts) ? alerts.path : undefined} />
        <UserMenu />
      </div>
    </header>
  )
}
