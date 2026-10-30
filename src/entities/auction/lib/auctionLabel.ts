import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { AuctionDto } from '@/shared/api/contracts'

/** "BTA 26 wk", "OTA 3 yr" ("BTA 26 sem.", "OTA 3 ans" in French), as in the screen 4 mockup. */
export function useAuctionLabel(): (auction: Pick<AuctionDto, 'instrument' | 'term'>) => string {
  const { t } = useTranslation()
  return useCallback(
    ({ instrument, term }) =>
      instrument === 'BTA'
        ? t('auctions.bta', { count: term })
        : t('auctions.ota', { count: term }),
    [t],
  )
}
