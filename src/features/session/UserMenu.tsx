import { Languages, UserRound } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ACCOUNT_TYPES } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import { LANGUAGES } from '@/shared/i18n'
import { ContextMenu } from '@/shared/ui/ContextMenu'
import type { MenuItem } from '@/shared/ui/menu'
import { audienceOf, initialOf } from './accountTypes'
import { useCurrentUser, useSwitchPrototypeAccount } from './api'

const MENU_WIDTH = 216
const LANGUAGE_NAMES = { fr: 'Français', en: 'English' } as const

/** User badge of the top bar ("K. ANALYST"), with language and prototype account switch. */
export function UserMenu() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const switchAccount = useSwitchPrototypeAccount()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const close = useCallback(() => setPosition(null), [])

  const badge = t(`accountBadge.${user.accountType}`)
  const label =
    audienceOf(user.accountType) === 'client' ? `${initialOf(user.displayName)} ${badge}` : badge

  const items: MenuItem[] = [
    { id: 'user', kind: 'label', label: user.displayName },
    { id: 'language', kind: 'label', label: t('shell.language') },
    ...LANGUAGES.map((language) => ({
      id: `language-${language}`,
      label: LANGUAGE_NAMES[language],
      icon: Languages,
      checked: i18n.resolvedLanguage === language,
      onSelect: () => void i18n.changeLanguage(language),
    })),
  ]
  if (env.useMocks) {
    items.push(
      { id: 'prototype-separator', kind: 'separator', label: '' },
      { id: 'prototype', kind: 'label', label: t('shell.prototypeAccount') },
      ...ACCOUNT_TYPES.map((accountType) => ({
        id: `account-${accountType}`,
        label: t(`accountTypes.${accountType}`),
        icon: UserRound,
        checked: user.accountType === accountType,
        onSelect: () => switchAccount.mutate(accountType),
      })),
    )
  }

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
