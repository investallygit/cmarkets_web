import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import {
  AccessBadge,
  LIBRARY_TABS,
  RatingText,
  ScoreText,
  SubjectText,
  useLibrary,
  type LibraryQuery,
  type LibraryTab,
} from '@/entities/publication'
import { useFormat } from '@/shared/i18n'
import { Pager } from '@/shared/ui/Pager'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

interface PublicationListPanelProps {
  query: LibraryQuery
  selectedId: string | null
  onSelect: (publicationId: string) => void
  onPageChange: (page: number) => void
  /** All / Purchased / Followed analysts of screen 8; the ANA tab of a security has none. */
  onTabChange?: (tab: LibraryTab) => void
}

/**
 * Publications of the research library (screen 8) and of the ANA tab of a security: price or FREE,
 * title, subject, analyst, rating, date and readers' score, a page at a time. API GET /library.
 */
export function PublicationListPanel({
  query,
  selectedId,
  onSelect,
  onPageChange,
  onTabChange,
}: PublicationListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const library = useLibrary(query)
  const total = library.data?.totalCount

  return (
    <Panel
      title={
        total === undefined ? t('panels.publications') : t('library.results', { count: total })
      }
      code="PUB"
      bodyClassName="flex flex-col"
      options={
        onTabChange && (
          <PanelTabs
            value={query.tab}
            options={LIBRARY_TABS.map((tab) => ({ value: tab, label: t(`library.tabs.${tab}`) }))}
            onChange={onTabChange}
          />
        )
      }
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <QueryView
          query={library}
          isEmpty={(page) => page.items.length === 0}
          emptyMessage={t(`library.empty.${query.tab}`)}
        >
          {(page) => (
            <ul className="divide-y">
              {page.items.map((item) => {
                const selected = item.id === selectedId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-current={selected || undefined}
                      onClick={() => onSelect(item.id)}
                      className={clsx(
                        'grid w-full grid-cols-[104px_minmax(0,1fr)_auto] gap-x-3 border-l-2 px-2 py-2 text-left',
                        selected
                          ? 'border-accent-amber bg-selected'
                          : 'border-transparent hover:bg-panel-header',
                      )}
                    >
                      <span className="row-span-3 pt-0.5 [&>span]:w-full">
                        <AccessBadge access={item.access} price={item.price} />
                      </span>
                      <span className="truncate font-sans text-label font-semibold">
                        {item.title}
                      </span>
                      <span className="text-right font-mono text-data text-secondary">
                        {format.date(item.updatedAt ?? item.publishedAt)}
                      </span>
                      <span className="flex min-w-0 gap-4 font-mono text-data">
                        <SubjectText subject={item.subject} />
                        <span className="truncate font-sans text-secondary">
                          {t('library.by', { name: item.analyst.displayName })}
                        </span>
                      </span>
                      <span className="text-right font-sans text-data text-secondary">
                        {item.purchasedAt
                          ? t('library.bought')
                          : item.updatedAt
                            ? t('library.updated')
                            : item.isRead
                              ? t('library.read')
                              : ''}
                      </span>
                      <RatingText
                        rating={item.rating}
                        targetPrice={item.targetPrice}
                        currency={item.subject.currency}
                        className="text-data"
                      />
                      <span className="text-right">
                        <ScoreText score={item.score} count={item.scoreCount} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </QueryView>
      </div>
      {library.data && (
        <Pager
          page={library.data.page}
          pageSize={library.data.pageSize}
          totalCount={library.data.totalCount}
          onChange={onPageChange}
        />
      )}
    </Panel>
  )
}
