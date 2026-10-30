import { useTranslation } from 'react-i18next'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import { SECURITY_FUNCTIONS, securityFunctionTypes, securityPath } from '@/shared/routes/paths'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'
import { TAB_CODES } from '../config/tabs'

/** DES, GP, FA, DVD, N, DOC, HDS, ANA: the tabs that apply to the security (spec section 9). */
export function SecurityTabs({ security }: { security: SecurityProfileDto }) {
  const { t } = useTranslation()
  const tabs = SECURITY_FUNCTIONS.filter(
    (fn) => securityFunctionTypes(fn)?.includes(security.type) ?? true,
  ).map((fn) => ({
    to: securityPath(security.id, fn),
    code: TAB_CODES[fn],
    label: t(`security.tabs.${fn}`),
  }))
  return <ScreenTabs tabs={tabs} label={t('security.tabsLabel')} />
}
