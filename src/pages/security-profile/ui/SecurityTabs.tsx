import { useTranslation } from 'react-i18next'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { securityPath } from '@/shared/routes/paths'
import { profileTabLabelKey, SECURITY_PROFILES } from '@/shared/routes/profiles'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'
import { TAB_CODES } from '../config/tabs'

/**
 * The tabs of the security's profile (spec section 9): DES, GP, FA, DVD, N, DOC, HDS, ANA for an
 * equity; DES, GP, BP, CF, RAT, DOC, N, ANA for a bond; DES, GP, HLD, PERF, DIST, DOC, N, ANA for
 * an ETF.
 */
export function SecurityTabs({ security }: { security: SecurityProfileDto }) {
  const { t } = useTranslation()
  const tabs = SECURITY_PROFILES[security.type].tabs.map((fn) => ({
    to: securityPath(security.id, fn),
    code: TAB_CODES[fn],
    label: t(profileTabLabelKey(security.type, fn)),
  }))
  return <ScreenTabs tabs={tabs} label={t('security.tabsLabel')} />
}
