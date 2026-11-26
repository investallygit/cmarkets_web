import { ScreenWorkspace } from '@/features/workspace-layout'
import { AuctionTabs, PublicOffersPanel } from '@/widgets/auction-market'
import { PUBLIC_OFFERS_LAYOUT } from '../config/layout'

/** APE, the public bond issues (screen 33's third tab, sixth version). */
export function PublicOffersPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <AuctionTabs />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="APE"
          defaultLayout={PUBLIC_OFFERS_LAYOUT}
          panels={{ offers: <PublicOffersPanel /> }}
        />
      </div>
    </div>
  )
}
