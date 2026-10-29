import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Params } from 'react-router'
import { AlertsIndicator } from '@/features/alerts'
import { MarketStatusBadge } from '@/features/market'
import { audienceOf, useCurrentUser, UserMenu } from '@/features/session'
import { canAccessScreen } from '../navigation/access'
import { screenById, type ScreenDefinition } from '../navigation/screens'
import { CommandBar } from './CommandBar'
import { Logo } from './Logo'
import { SessionClock } from './SessionClock'
import { useCurrentRoute } from './useCurrentRoute'

/** Command shown in the bar for the current screen, e.g. "SEMC DES". */
function commandOf(screen: ScreenDefinition | null, params: Params): string {
  if (!screen) return ''
  if (screen.id === 'DES') return `${params.securityId ?? ''} ${(params.fn ?? 'des').toUpperCase()}`
  if (screen.id === 'YAS') return `${params.bondId ?? ''} YAS`
  return screen.code
}

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
  const subject = params.securityId ?? params.bondId
  const title = screen ? `${subject ? `${subject} — ` : ''}${t(screen.titleKey)}` : ''

  return (
    <header className={clsx('flex min-w-0 items-center gap-4 border-b bg-app px-3', className)}>
      <Logo />
      <CommandBar currentCommand={commandOf(screen, params)} />
      <span className="min-w-0 truncate font-sans text-label">{title}</span>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {backOffice && (
          <span className="inline-flex h-6 items-center border border-info px-3 font-sans text-title font-semibold tracking-title text-info uppercase">
            {t('shell.backOffice')}
          </span>
        )}
        <MarketStatusBadge />
        <SessionClock />
        <AlertsIndicator to={canAccessScreen(user, alerts) ? alerts.path : undefined} />
        <UserMenu />
      </div>
    </header>
  )
}
