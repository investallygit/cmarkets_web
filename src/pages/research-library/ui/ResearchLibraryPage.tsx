import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAnalyst } from '@/entities/analyst'
import {
  LIBRARY_PAGE_SIZE,
  LIBRARY_SORTS,
  LIBRARY_TABS,
  useLibrary,
  useLibraryPublication,
  type LibraryQuery,
} from '@/entities/publication'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { PublicationAccess, PublicationRating, SubjectType } from '@/shared/api/contracts'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { Button } from '@/shared/ui/form/Button'
import { AnalystPanel } from '@/widgets/analyst-panel'
import { PublicationListPanel } from '@/widgets/publication-list-panel'
import { PublicationPreviewPanel } from '@/widgets/publication-preview-panel'
import { LIBRARY_LAYOUT } from '../config/layout'
import { LibraryFilters, type LibraryFilterValues } from './LibraryFilters'

const SUBJECTS: readonly SubjectType[] = ['company', 'country']
const ACCESSES: readonly PublicationAccess[] = ['free', 'paid']
const RATINGS: readonly PublicationRating[] = [
  'buy',
  'hold',
  'sell',
  'positive',
  'stable',
  'negative',
]

const pick = <T extends string>(values: readonly T[], value: string | null): T | undefined =>
  values.find((candidate) => candidate === value)

/**
 * PUB, the research library (screen 8): filters, the list with its tabs and pages, the preview
 * or the full content once bought, and the analyst. The filters, the tab, the page and the open
 * publication live in the URL; the first publication opens when none is chosen. A profile of the
 * directory opens one analyst's publications: /pub?analyst=analyst-atangana.
 */
export function ResearchLibraryPage() {
  const { t } = useTranslation()
  const [params, update] = useSearchParamsUpdate()
  const patch = (values: Partial<Record<string, string>>) =>
    update((current) => withParams(current, values))

  const filters: LibraryFilterValues = {
    subject: pick(SUBJECTS, params.get('subject')) ?? '',
    country: params.get('country') ?? '',
    sector: params.get('sector') ?? '',
    access: pick(ACCESSES, params.get('access')) ?? '',
    rating: pick(RATINGS, params.get('rating')) ?? '',
    sort: pick(LIBRARY_SORTS, params.get('sort')) ?? 'recent',
    q: params.get('q') ?? '',
  }
  const query: LibraryQuery = {
    tab: pick(LIBRARY_TABS, params.get('tab')) ?? 'all',
    subjectType: filters.subject || undefined,
    country: filters.country || undefined,
    sector: filters.sector || undefined,
    access: filters.access || undefined,
    rating: filters.rating || undefined,
    sort: filters.sort,
    q: filters.q || undefined,
    analystId: params.get('analyst') || undefined,
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: LIBRARY_PAGE_SIZE,
  }
  const list = useLibrary(query)
  const selectedId = params.get('id') ?? list.data?.items.at(0)?.id ?? null
  const analystId = useLibraryPublication(selectedId).data?.analyst.id ?? null
  const byAnalyst = useAnalyst(query.analystId).data

  // A new filter, tab or page starts from its first publication.
  const restart = { page: '', id: '' }
  const panels = {
    list: (
      <PublicationListPanel
        query={query}
        selectedId={selectedId}
        onSelect={(id) => patch({ id })}
        onTabChange={(tab) => patch({ ...restart, tab: tab === 'all' ? '' : tab })}
        onPageChange={(page) => patch({ id: '', page: page > 1 ? String(page) : '' })}
      />
    ),
    preview: <PublicationPreviewPanel publicationId={selectedId} />,
    analyst: <AnalystPanel analystId={analystId} />,
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-col gap-2 px-2 pt-2">
        {query.analystId && (
          <div className="flex items-center justify-between gap-3 border border-accent-amber/60 bg-panel px-3 py-1.5">
            <span className="truncate font-sans text-label">
              {t('library.byAnalyst', { name: byAnalyst?.displayName ?? '…' })}
            </span>
            <Button size="sm" icon={X} onClick={() => patch({ ...restart, analyst: '' })}>
              {t('library.allAnalysts')}
            </Button>
          </div>
        )}
        <LibraryFilters
          values={filters}
          onChange={(values) =>
            patch({
              ...restart,
              ...values,
              sort: values.sort === 'recent' ? '' : values.sort,
            })
          }
        />
      </div>
      <div className="min-h-0 flex-1">
        <ScreenWorkspace screenId="PUB" defaultLayout={LIBRARY_LAYOUT} panels={panels} />
      </div>
    </div>
  )
}
