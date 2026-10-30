import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsTime, useNews, type NewsQuery } from '@/entities/news'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface NewsListPanelProps {
  query: NewsQuery
  selectedId: string | null
  onSelect: (newsId: string) => void
  /** Shown above the list, e.g. the filters of the N screen. */
  filters?: ReactNode
  emptyMessage?: string
}

/**
 * News, newest first: the N screen (filtered by security, country and topic) and the N tab of a
 * security profile. API /news?securityId=&country=&topic=, refreshed by NewsPublished.
 */
export function NewsListPanel({
  query,
  selectedId,
  onSelect,
  filters,
  emptyMessage,
}: NewsListPanelProps) {
  const { t } = useTranslation()
  const news = useNews(query)

  return (
    <Panel title={t('panels.securityNews')} code="N" bodyClassName="flex flex-col">
      {filters}
      <div className="min-h-0 flex-1 overflow-auto">
        <QueryView
          query={news}
          isEmpty={(page) => page.items.length === 0}
          emptyMessage={emptyMessage}
        >
          {(page) => (
            <ul className="divide-y">
              {page.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === selectedId || undefined}
                    onClick={() => onSelect(item.id)}
                    className={clsx(
                      'grid w-full grid-cols-[48px_minmax(0,1fr)] gap-x-2 px-2 py-1.5 text-left',
                      item.id === selectedId ? 'bg-selected' : 'hover:bg-panel-header',
                    )}
                  >
                    <span className="font-mono text-data text-secondary">
                      <NewsTime publishedAt={item.publishedAt} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-mono text-title font-semibold text-accent-amber">
                        {item.source}
                      </span>
                      <span className="block truncate font-sans text-label">{item.headline}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </div>
    </Panel>
  )
}
