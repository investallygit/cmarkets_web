import { clsx } from 'clsx'
import { Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'
import { UnreadBadge } from '@/entities/conversation'
import { canAccessScreen, lockedModule, mayWriteMessages, useCurrentUser } from '@/entities/session'
import { SCREENS } from '@/shared/routes/screens'
import { useUiPreferences } from '../model/uiPreferences'

/**
 * Left menu (56 px collapsed, 200 px expanded); its items depend on the account type. A screen
 * outside the user's plan shows a lock and opens on the plans. MSG counts the unread messages and
 * the requests, except on MSG itself, whose tabs count them.
 */
export function SideMenu() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const expanded = useUiPreferences((state) => state.menuExpanded)
  const toggleMenu = useUiPreferences((state) => state.toggleMenu)
  const items = SCREENS.filter((screen) => screen.inMenu && canAccessScreen(user, screen))

  return (
    <nav
      aria-label={t('shell.mainMenu')}
      className={clsx(
        'flex min-h-0 flex-col border-r bg-app',
        expanded ? 'w-menu-expanded' : 'w-menu',
      )}
    >
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {items.map((screen) => {
          const locked = lockedModule(user, screen)
          return (
            <li key={screen.id}>
              <NavLink
                to={screen.path}
                title={
                  locked
                    ? t('subscription.locked.menuTitle', {
                        screen: t(screen.titleKey),
                        module: t(`modules.${locked}`),
                      })
                    : t(screen.titleKey)
                }
                className={({ isActive }) =>
                  clsx(
                    'relative flex border-l-[3px]',
                    isActive
                      ? 'border-accent-amber bg-selected'
                      : 'border-transparent hover:bg-panel-header',
                    expanded
                      ? 'h-10 items-center gap-3 px-3'
                      : 'h-14 flex-col items-center justify-center gap-0.5',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {expanded && (
                      <screen.icon aria-hidden className="size-4 shrink-0 text-secondary" />
                    )}
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 font-mono text-data font-bold',
                        isActive ? 'text-accent-amber' : locked ? 'text-secondary' : 'text-primary',
                      )}
                    >
                      {screen.code}
                      {locked && <Lock aria-hidden className="size-2.5" />}
                    </span>
                    <span
                      className={clsx(
                        'truncate font-sans text-secondary',
                        expanded ? 'text-label' : 'text-caption',
                      )}
                    >
                      {t(screen.menuKey)}
                    </span>
                    {screen.id === 'MSG' && !isActive && (
                      <UnreadBadge
                        enabled={mayWriteMessages(user)}
                        className={expanded ? 'ml-auto' : 'absolute top-0.5 right-0.5'}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={expanded ? t('shell.collapseMenu') : t('shell.expandMenu')}
        className="flex h-9 shrink-0 items-center justify-center border-t text-secondary hover:text-primary"
      >
        {expanded ? (
          <PanelLeftClose aria-hidden className="size-4" />
        ) : (
          <PanelLeftOpen aria-hidden className="size-4" />
        )}
      </button>
    </nav>
  )
}
