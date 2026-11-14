import { useTranslation } from 'react-i18next'
import { canAccessScreen, useCurrentUser } from '@/entities/session'
import type { TranslationKey } from '@/shared/i18n'
import { SCREENS } from '@/shared/routes/screens'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'

/** The RFQ module's screens by code, with their tab's label. */
const TABS: readonly (readonly [code: string, label: TranslationKey])[] = [
  ['RFQ', 'rfqTrading.tabs.trading'],
  ['RFQ AGR', 'rfqTrading.tabs.agreements'],
  ['RFQ REP', 'rfqTrading.tabs.reporting'],
]

/**
 * The RFQ module's screens under one tab bar (spec section 9: "Trading (screen 22), Agreements
 * (screen 23) and BEAC reporting (screen 24)"), by their codes: each shows once its screen exists
 * (ROADMAP steps 46 and 47 add theirs) and the user may open it.
 */
export function RfqTabs() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const tabs = TABS.flatMap(([code, label]) => {
    const screen = SCREENS.find((candidate) => candidate.code === code)
    return screen && canAccessScreen(user, screen)
      ? [{ to: screen.path, code, label: t(label) }]
      : []
  })
  return <ScreenTabs tabs={tabs} label={t('rfqTrading.tabs.label')} />
}
