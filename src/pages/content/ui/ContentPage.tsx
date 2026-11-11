import { useTranslation } from 'react-i18next'
import { useNewsQueue } from '@/entities/moderation'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { NEWS_CHANNELS, type NewsChannel } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import {
  ContentEditorPanel,
  ContentListPanel,
  PublisherEditorPanel,
  PublishersPanel,
} from '@/widgets/content-panels'
import {
  NewsQueuePanel,
  NewsReaderPanel,
  type NewsQueueFilter,
} from '@/widgets/news-moderation-panels'

/** NEWS has no mockup: what was published, the queue or the publishers on the left, the item on the right. */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'list', name: 'contentList', x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
  { i: 'editor', name: 'contentEditor', x: 7, y: 0, w: 5, h: 26, minW: 4, minH: 12 },
]

const TABS = ['news', 'documents', 'moderation', 'publishers'] as const
type ContentTab = (typeof TABS)[number]
const FILTERS: readonly NewsQueueFilter[] = ['all', 'reported', 'pending']

/**
 * NEWS (spec section 5): the Data admin publishes the news and documents of African issuers and
 * institutions and edits them; moderates the items waiting or reported, approves, takes down or
 * retypes them; names the publishers' domains (ROADMAP step 27). The tab, the item open and the
 * queue's filters are in the URL (?tab=moderation&id=&filter=pending&channel=ai).
 */
export function ContentPage() {
  const { t } = useTranslation()
  const [params, updateParams] = useSearchParamsUpdate()
  const tab: ContentTab = TABS.find((value) => value === params.get('tab')) ?? 'news'
  const itemId = params.get('id')
  const filter = FILTERS.find((value) => value === params.get('filter')) ?? 'all'
  const channel = NEWS_CHANNELS.find((value) => value === params.get('channel')) ?? null
  const queue = useNewsQueue()
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const tabs = (
    <PanelTabs
      value={tab}
      options={TABS.map((value) => ({
        value,
        label:
          value === 'moderation' && queue.data
            ? `${t('news.tabs.moderation')} (${queue.data.length})`
            : t(`news.tabs.${value}`),
      }))}
      onChange={(value) =>
        set({ tab: value === 'news' ? '' : value, id: '', filter: '', channel: '' })
      }
    />
  )

  const list =
    tab === 'moderation' ? (
      <NewsQueuePanel
        code="NEWS"
        tabs={tabs}
        filter={filter}
        onFilterChange={(value) => set({ filter: value === 'all' ? '' : value })}
        channel={channel}
        onChannelChange={(value: NewsChannel | null) => set({ channel: value ?? '' })}
        selectedId={itemId}
        onOpen={(item) => set({ id: item.id })}
      />
    ) : tab === 'publishers' ? (
      <PublishersPanel tabs={tabs} selectedId={itemId} onSelect={(id) => set({ id })} />
    ) : (
      <ContentListPanel tab={tab} tabs={tabs} selectedId={itemId} onSelect={(id) => set({ id })} />
    )
  const editor =
    tab === 'moderation' ? (
      <NewsReaderPanel newsId={itemId} code="NEWS" />
    ) : tab === 'publishers' ? (
      <PublisherEditorPanel
        publisherId={itemId}
        onSaved={(id) => set({ id })}
        onNew={() => set({ id: '' })}
      />
    ) : (
      <ContentEditorPanel
        kind={tab}
        itemId={itemId}
        onSaved={(id) => set({ id })}
        onNew={() => set({ id: '' })}
      />
    )
  return <ScreenWorkspace screenId="NEWS" defaultLayout={LAYOUT} panels={{ list, editor }} />
}
