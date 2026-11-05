import { useTranslation } from 'react-i18next'
import type { AccountType } from '@/shared/api/contracts'
import { ACCOUNT_TYPE_COLORS } from '@/shared/config/accountTypes'

/**
 * The type of a profile, upper case in its colour and framed by it: "ANALYST" in amber (spec
 * section 9, screens 10 to 12). CMarket assigns it; the user does not change it.
 */
export function AccountTypeBadge({ type }: { type: AccountType }) {
  const { t } = useTranslation()
  const color = ACCOUNT_TYPE_COLORS[type]
  return (
    <span
      className="inline-block border px-1 font-sans text-title font-semibold tracking-title uppercase"
      style={{ color, borderColor: color }}
    >
      {t(`accountBadge.${type}`)}
    </span>
  )
}
