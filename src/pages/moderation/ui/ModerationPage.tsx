import { useModerationQueue } from '@/entities/moderation'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import type { WorkspaceItem } from '@/shared/ui/Workspace'
import { ModerationQueuePanel, ModerationReaderPanel } from '@/widgets/moderation-queue-panel'

/** MOD is the moderation queue of screen 9 in full, with the publication opened beside it. */
const LAYOUT: readonly WorkspaceItem[] = [
  { i: 'queue', x: 0, y: 0, w: 5, h: 26, minW: 4, minH: 8 },
  { i: 'reader', x: 5, y: 0, w: 7, h: 26, minW: 4, minH: 8 },
]

const FILTERS = ['all', 'reported', 'pending'] as const

/**
 * MOD: the reported publications and those waiting; one opens in the PUB reader with its reports,
 * Approve and Take down. In the URL: /admin/moderation?id=pub-gabon-oil&filter=reported.
 */
export function ModerationPage() {
  const [params, updateParams] = useSearchParamsUpdate()
  const filter = FILTERS.find((value) => value === params.get('filter')) ?? 'all'
  const selectedId = params.get('id')
  const queue = useModerationQueue()
  const item = queue.data?.find((candidate) => candidate.publicationId === selectedId) ?? null
  const set = (values: Record<string, string>) =>
    updateParams((current) => withParams(current, values))

  const panels = {
    queue: (
      <ModerationQueuePanel
        variant="full"
        filter={filter}
        onFilterChange={(value) => set({ filter: value === 'all' ? '' : value })}
        selectedId={selectedId}
        onOpen={(opened) => set({ id: opened.publicationId })}
      />
    ),
    reader: <ModerationReaderPanel item={item} />,
  }
  return <ScreenWorkspace screenId="MOD" defaultLayout={LAYOUT} panels={panels} />
}
