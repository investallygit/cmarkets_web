import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { NEWS_CHANNELS } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  IngestClientsPanel,
  NewsSettingsPanel,
  NewsSourcePanel,
  NewsSourcesPanel,
} from '@/widgets/news-sources-panels'

/** SRC has no mockup: the newspapers and the one open above, CMarket AI and its clients below. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'sources', name: 'newsSources', x: 0, y: 0, w: 7, h: 15, minW: 4, minH: 6 },
  { i: 'source', name: 'newsSource', x: 7, y: 0, w: 5, h: 26, minW: 4, minH: 10 },
  { i: 'settings', name: 'newsSettings', x: 0, y: 15, w: 3, h: 11, minW: 3, minH: 8 },
  { i: 'clients', name: 'ingestClients', x: 3, y: 15, w: 4, h: 11, minW: 3, minH: 6 },
]

/**
 * SRC, the Admin's news sources (ROADMAP decision 6, without a mockup): the newspapers of the four
 * channels, a partner newspaper's contract (rate per unique click, monthly cap, FLASH quota), its
 * review mode, its logo and its News providers; CMarket AI's review mode and confidence threshold,
 * the views an hour of the unique clicks; the ingestion clients. In the URL: ?channel=partner&id=.
 */
export function NewsSourcesPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const channel = NEWS_CHANNELS.find((value) => value === params.get('channel')) ?? null
  const sourceId = params.get('id')
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    sources: (
      <NewsSourcesPanel
        channel={channel}
        onChannelChange={(value) => set({ channel: value ?? '' })}
        selectedId={sourceId}
        onSelect={(id) => set({ id })}
      />
    ),
    source: <NewsSourcePanel sourceId={sourceId} />,
    settings: <NewsSettingsPanel />,
    clients: <IngestClientsPanel />,
  }
  return <ScreenWorkspace screenId="SRC" defaultLayout={LAYOUT} panels={panels} />
}
