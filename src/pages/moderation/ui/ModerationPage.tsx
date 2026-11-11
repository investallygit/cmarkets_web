import { useDirectoryReports, useModerationQueue } from '@/entities/moderation'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { NEWS_CHANNELS, type NewsChannel } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  NewsQueuePanel,
  NewsReaderPanel,
  type NewsQueueFilter,
} from '@/widgets/news-moderation-panels'
import {
  DirectoryReportsPanel,
  ModerationQueuePanel,
  ModerationReaderPanel,
  ReportReaderPanel,
  reportKey,
} from '@/widgets/moderation-queue-panel'

/**
 * MOD is the moderation queue of screen 9 in full, the news to moderate and the reports of the
 * directory and the messaging below it, and what is opened beside them.
 */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'queue', name: 'moderationQueue', x: 0, y: 0, w: 5, h: 9, minW: 4, minH: 6 },
  { i: 'news', name: 'newsQueue', x: 0, y: 9, w: 5, h: 9, minW: 4, minH: 6 },
  { i: 'reports', name: 'directoryReports', x: 0, y: 18, w: 5, h: 8, minW: 4, minH: 6 },
  { i: 'reader', name: 'moderationReader', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
]

const FILTERS = ['all', 'reported', 'pending'] as const

/**
 * MOD: the reported publications and those waiting, one opened in the PUB reader with its
 * reports, Approve and Take down; the news items reported or waiting (ROADMAP step 27), one
 * opened with its reports, Approve or Keep, Take down and Retype; the reported profiles and
 * conversations (spec section 15), one opened with its reports, Dismiss and the account's
 * actions. In the URL: /admin/moderation?id=pub-gabon-oil&filter=reported, ?news={id}&newsFilter=
 * pending&channel=ai, or ?report=profile:user-abessolo.
 */
export function ModerationPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const filter = FILTERS.find((value) => value === params.get('filter')) ?? 'all'
  const newsFilter: NewsQueueFilter =
    FILTERS.find((value) => value === params.get('newsFilter')) ?? 'all'
  const channel = NEWS_CHANNELS.find((value) => value === params.get('channel')) ?? null
  const selectedId = params.get('id')
  const selectedNews = params.get('news')
  const selectedReport = params.get('report')
  const queue = useModerationQueue()
  const reports = useDirectoryReports()
  const item = queue.data?.find((candidate) => candidate.publicationId === selectedId) ?? null
  const report = reports.data?.find((candidate) => reportKey(candidate) === selectedReport) ?? null
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    queue: (
      <ModerationQueuePanel
        variant="full"
        filter={filter}
        onFilterChange={(value) => set({ filter: value === 'all' ? '' : value })}
        selectedId={selectedReport || selectedNews ? null : selectedId}
        onOpen={(opened) => set({ id: opened.publicationId, report: '', news: '' })}
      />
    ),
    news: (
      <NewsQueuePanel
        code="MOD"
        filter={newsFilter}
        onFilterChange={(value) => set({ newsFilter: value === 'all' ? '' : value })}
        channel={channel}
        onChannelChange={(value: NewsChannel | null) => set({ channel: value ?? '' })}
        selectedId={selectedNews}
        onOpen={(opened) => set({ news: opened.id, id: '', report: '' })}
      />
    ),
    reports: (
      <DirectoryReportsPanel
        selectedKey={selectedReport}
        onOpen={(opened) => set({ report: reportKey(opened), id: '', news: '' })}
      />
    ),
    reader: selectedNews ? (
      <NewsReaderPanel newsId={selectedNews} code="MOD" />
    ) : selectedReport ? (
      <ReportReaderPanel item={report} />
    ) : (
      <ModerationReaderPanel item={item} />
    ),
  }
  return <ScreenWorkspace screenId="MOD" defaultLayout={LAYOUT} panels={panels} />
}
