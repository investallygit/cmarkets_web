import { useDirectoryReports, useModerationQueue } from '@/entities/moderation'
import { ScreenWorkspace, type ScreenPanel } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  DirectoryReportsPanel,
  ModerationQueuePanel,
  ModerationReaderPanel,
  ReportReaderPanel,
  reportKey,
} from '@/widgets/moderation-queue-panel'

/**
 * MOD is the moderation queue of screen 9 in full, the reports of the directory and the
 * messaging below it, and what is opened beside them.
 */
const LAYOUT: readonly ScreenPanel[] = [
  { i: 'queue', name: 'moderationQueue', x: 0, y: 0, w: 5, h: 14, minW: 4, minH: 6 },
  { i: 'reports', name: 'directoryReports', x: 0, y: 14, w: 5, h: 12, minW: 4, minH: 6 },
  { i: 'reader', name: 'moderationReader', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
]

const FILTERS = ['all', 'reported', 'pending'] as const

/**
 * MOD: the reported publications and those waiting, one opened in the PUB reader with its
 * reports, Approve and Take down; the reported profiles and conversations (spec section 15),
 * one opened with its reports, Dismiss and the account's actions. In the URL:
 * /admin/moderation?id=pub-gabon-oil&filter=reported, or ?report=profile:user-abessolo.
 */
export function ModerationPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const filter = FILTERS.find((value) => value === params.get('filter')) ?? 'all'
  const selectedId = params.get('id')
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
        selectedId={selectedReport ? null : selectedId}
        onOpen={(opened) => set({ id: opened.publicationId, report: '' })}
      />
    ),
    reports: (
      <DirectoryReportsPanel
        selectedKey={selectedReport}
        onOpen={(opened) => set({ report: reportKey(opened), id: '' })}
      />
    ),
    reader: selectedReport ? (
      <ReportReaderPanel item={report} />
    ) : (
      <ModerationReaderPanel item={item} />
    ),
  }
  return <ScreenWorkspace screenId="MOD" defaultLayout={LAYOUT} panels={panels} />
}
