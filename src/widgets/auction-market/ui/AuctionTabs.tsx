import { useTranslation } from 'react-i18next'
import { canAccessScreen, useCurrentUser } from '@/entities/session'
import type { TranslationKey } from '@/shared/i18n'
import { SCREENS } from '@/shared/routes/screens'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'

const TABS: readonly (readonly [code: string, label: TranslationKey])[] = [
  ['AUC', 'auctionMarket.tabs.results'],
  ['AUC NEXT', 'auctionMarket.tabs.next'],
  ['APE', 'auctionMarket.tabs.offers'],
]

/** AUC's three tabs (screen 33, sixth version): the results, the coming auctions, APE. */
export function AuctionTabs() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const tabs = TABS.flatMap(([code, label]) => {
    const screen = SCREENS.find(
      (candidate) => candidate.code === code && canAccessScreen(user, candidate),
    )
    return screen ? [{ to: screen.path, code, label: t(label) }] : []
  })
  return <ScreenTabs tabs={tabs} label={t('auctionMarket.tabs.label')} />
}
