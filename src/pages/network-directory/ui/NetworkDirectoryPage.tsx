import { useDirectory } from '@/entities/profile'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import {
  DirectoryFiltersPanel,
  DirectoryProfilePanel,
  DirectoryResultsPanel,
} from '@/widgets/network-directory-panels'
import { NETWORK_DIRECTORY_LAYOUT } from '../config/layout'
import { directoryParamsOf, readDirectoryParams } from '../model/directoryParams'

/**
 * NET, the professional directory (spec sections 9 and 15, screen 10): filters, the results as
 * cards, and the profile chosen, the first result when none is. The search and the profile live
 * in the URL, so a link or a reload finds them again.
 */
export function NetworkDirectoryPage() {
  const [params, update] = useSearchParamsUpdate()
  const { query, profileId } = readDirectoryParams(params)
  const patch = (values: Record<string, string>) => update((current) => withParams(current, values))
  const results = useDirectory(query)
  const selectedId = profileId ?? results.data?.items.at(0)?.userId ?? null

  const panels = {
    filters: (
      <DirectoryFiltersPanel
        query={query}
        // A new search starts from its first page.
        onChange={(change) => patch({ ...directoryParamsOf(change), page: '' })}
      />
    ),
    results: (
      <DirectoryResultsPanel
        query={query}
        selectedId={selectedId}
        onSelect={(userId) => patch({ profile: userId })}
        onSortChange={(sort) => patch({ ...directoryParamsOf({ sort }), page: '' })}
        onPageChange={(page) => patch(directoryParamsOf({ page }))}
      />
    ),
    profile: <DirectoryProfilePanel userId={selectedId} />,
  }

  return <ScreenWorkspace screenId="NET" defaultLayout={NETWORK_DIRECTORY_LAYOUT} panels={panels} />
}
