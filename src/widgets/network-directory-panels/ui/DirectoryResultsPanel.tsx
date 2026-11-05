import { useTranslation } from 'react-i18next'
import { DIRECTORY_SORTS, useDirectory, useSpecialties } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import type { DirectoryQuery, DirectorySort } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { QueryView } from '@/shared/ui/QueryView'
import { DirectoryCard } from './DirectoryCard'

interface DirectoryResultsPanelProps {
  query: DirectoryQuery
  selectedId: string | null
  onSelect: (userId: string) => void
  onSortChange: (sort: DirectorySort) => void
  onPageChange: (page: number) => void
}

/**
 * NET, centre (spec section 9, screen 10): "PROFESSIONALS: 64 RESULTS", the cards a page at a
 * time, in the order chosen in the title bar. API GET /directory.
 */
export function DirectoryResultsPanel({
  query,
  selectedId,
  onSelect,
  onSortChange,
  onPageChange,
}: DirectoryResultsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const user = useCurrentUser()
  const directory = useDirectory(query)
  const specialties = useSpecialties().data ?? []
  const total = directory.data?.totalCount
  const awaitingApproval =
    user.verificationStatus === 'pending' || user.verificationStatus === 'rejected'
  const specialtyNames = (ids: readonly string[]) =>
    ids.map((id) => specialties.find((specialty) => specialty.id === id)?.name[locale] ?? id)

  return (
    <Panel
      title={
        total === undefined
          ? t('panels.professionals')
          : t('network.directory.results', { count: total, total: format.number(total, 0) })
      }
      code="NET"
      bodyClassName="flex flex-col"
      options={
        <PanelSelect
          value={query.sort ?? 'relevance'}
          options={DIRECTORY_SORTS.map((sort) => ({
            value: sort,
            label: t(`network.directory.sorts.${sort}`),
          }))}
          onChange={onSortChange}
          aria-label={t('network.directory.sort')}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-auto">
        {awaitingApproval && (
          <p className="mx-2 mt-2 border border-warning/50 bg-warning/10 px-3 py-2 font-sans text-label text-warning">
            {t('network.directory.awaitingApproval')}
          </p>
        )}
        <QueryView
          query={directory}
          isEmpty={(page) => page.items.length === 0}
          emptyMessage={t('network.directory.empty')}
        >
          {(page) => (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-2 p-2">
              {page.items.map((entry) => (
                <li key={entry.userId}>
                  <DirectoryCard
                    entry={entry}
                    specialties={specialtyNames(entry.specialties)}
                    selected={entry.userId === selectedId}
                    own={entry.userId === user.id}
                    onSelect={() => onSelect(entry.userId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </div>
      {directory.data && (
        <Pager
          page={directory.data.page}
          pageSize={directory.data.pageSize}
          totalCount={directory.data.totalCount}
          onChange={onPageChange}
        />
      )}
    </Panel>
  )
}
