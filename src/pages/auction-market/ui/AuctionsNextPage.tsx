import { ScreenWorkspace } from '@/features/workspace-layout'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { AuctionTabs, UpcomingAuctionsPanel } from '@/widgets/auction-market'
import { AUCTIONS_NEXT_LAYOUT } from '../config/layout'

/** AUC NEXT, the coming BTA and OTA auctions (screen 33's second tab, sixth version). */
export function AuctionsNextPage() {
  const today = useMarketDay()
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <AuctionTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="AUCNEXT"
          defaultLayout={AUCTIONS_NEXT_LAYOUT}
          panels={{ upcoming: <UpcomingAuctionsPanel today={today} full /> }}
        />
      </div>
    </div>
  )
}
