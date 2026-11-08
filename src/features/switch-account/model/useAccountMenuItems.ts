import { UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/entities/session'
import { ACCOUNT_TYPES } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import type { MenuItem } from '@/shared/ui/menu'
import { useSwitchPrototypeAccount } from '../api/useSwitchPrototypeAccount'

/** User menu entries of the eight account types; only with the prototype helpers (env.devTools). */
export function useAccountMenuItems(): MenuItem[] {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const switchAccount = useSwitchPrototypeAccount()
  if (!env.devTools) return []

  return [
    { id: 'prototype-separator', kind: 'separator', label: '' },
    { id: 'prototype', kind: 'label', label: t('shell.prototypeAccount') },
    ...ACCOUNT_TYPES.map((accountType) => ({
      id: `account-${accountType}`,
      label: t(`accountTypes.${accountType}`),
      icon: UserRound,
      checked: user.accountType === accountType,
      onSelect: () => switchAccount.mutate(accountType),
    })),
  ]
}
