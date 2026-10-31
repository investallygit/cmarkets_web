import { useTranslation } from 'react-i18next'
import type { AccountType } from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '../config/accountTypes'

/** The type in its colour: "Manager" in a list, "Portfolio manager" in full. */
export function AccountTypeText({ type, short = false }: { type: AccountType; short?: boolean }) {
  const { t } = useTranslation()
  return (
    <span style={{ color: ACCOUNT_TYPE_COLORS[type] }}>
      {short ? t(`accountBadge.${type}`) : t(`accountTypes.${type}`)}
    </span>
  )
}
