import { Settings, UserRound } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { audienceOf, canAccessScreen, initialOf, useCurrentUser } from '@/entities/session'
import { useLogoutMenuItems } from '@/features/log-out'
import { useAccountMenuItems } from '@/features/switch-account'
import { useLanguageMenuItems } from '@/features/switch-language'
import { screenById } from '@/shared/routes/screens'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import type { MenuItem } from '@/shared/ui/menu'

const MENU_WIDTH = 216

/**
 * User badge of the top bar ("K. ANALYST"): settings, language, the prototype's account switch and
 * the logout.
 */
export function UserMenu() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setPosition(null), [])
  const languageItems = useLanguageMenuItems()
  const accountItems = useAccountMenuItems()
  const logoutItems = useLogoutMenuItems()
  const navigate = useNavigate()
  const settings = screenById('CFG')

  const badge = t(`accountBadge.${user.accountType}`)
  const label =
    audienceOf(user.accountType) === 'client' ? `${initialOf(user.displayName)} ${badge}` : badge

  const items: MenuItem[] = [
    { id: 'user', kind: 'label', label: user.displayName },
    ...(canAccessScreen(user, settings)
      ? [
          {
            id: 'settings',
            label: t(settings.titleKey),
            icon: Settings,
            onSelect: () => navigate(settings.path),
          },
        ]
      : []),
    ...languageItems,
    ...accountItems,
    ...logoutItems,
  ]

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={position !== null}
        onClick={(event) => {
          if (position) return close()
          const rect = event.currentTarget.getBoundingClientRect()
          setPosition({ x: rect.right - MENU_WIDTH, y: rect.bottom + 4 })
        }}
        className="inline-flex h-6 items-center gap-1.5 border bg-panel-header px-3 font-sans text-title tracking-title text-secondary uppercase hover:text-primary"
      >
        <UserRound aria-hidden className="size-3" />
        {label}
      </button>
      {position && (
        <ContextMenu
          x={position.x}
          y={position.y}
          items={items}
          onClose={close}
          ignoreRef={buttonRef}
        />
      )}
    </>
  )
}
