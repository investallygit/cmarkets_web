import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { tenorOf } from '@/entities/auction'
import type { AuctionDto } from '@/shared/api/contracts'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import type { TableExporter } from '@/shared/ui/DataTable'
import {
  AuctionDetailPanel,
  AuctionFilterBar,
  AuctionIndicators,
  AuctionRatesPanel,
  AuctionResultsPanel,
  AuctionTabs,
  UpcomingAuctionsPanel,
  type AuctionFilters,
} from '@/widgets/auction-market'
import { AUCTIONS_LAYOUT } from '../config/layout'

/**
 * AUC, the BTA and OTA auctions of the BEAC's primary market (screen 33, sixth version; ROADMAP
 * step 64): its tabs and filters, the indicators, the latest results, the average rate by country,
 * the detail of the result picked and the coming auctions. A row picks the auction: its bids, and
 * its security's tenor on the chart.
 */
export function AuctionsPage() {
  const today = useMarketDay()
  const currentYear = Number(today.slice(0, 4))
  // A state from YCRV's auctions or a bond profile: /auc?country=CM.
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<AuctionFilters>({
    country: params.get('country')?.toUpperCase() ?? '',
    type: '',
    year: currentYear,
  })
  const [picked, setPicked] = useState<AuctionDto | null>(null)
  const [tenor, setTenor] = useState('52W')
  const exportRef = useRef<TableExporter | null>(null)
  const pick = (auction: AuctionDto) => {
    setPicked(auction)
    setTenor(tenorOf(auction.instrument, auction.term))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-2 pt-2">
        <AuctionTabs />
        <AuctionFilterBar
          filters={filters}
          onChange={setFilters}
          currentYear={currentYear}
          onDownload={() => exportRef.current?.('xlsx')}
        />
      </div>
      <div className="shrink-0 px-2 pt-2">
        <AuctionIndicators filters={filters} />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace
          screenId="AUC"
          defaultLayout={AUCTIONS_LAYOUT}
          panels={{
            results: (
              <AuctionResultsPanel
                filters={filters}
                selectedId={picked?.id ?? null}
                onSelect={pick}
                exportRef={exportRef}
              />
            ),
            rates: (
              <AuctionRatesPanel
                tenor={tenor}
                onTenorChange={setTenor}
                country={picked?.country ?? null}
              />
            ),
            detail: <AuctionDetailPanel auctionId={picked?.id ?? null} />,
            upcoming: <UpcomingAuctionsPanel today={today} />,
          }}
        />
      </div>
    </div>
  )
}
