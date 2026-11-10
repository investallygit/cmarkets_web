import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { To } from 'react-router'
import { NewsRow, useNews, type NewsQuery } from '@/entities/news'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface NewsListPanelProps {
  query: NewsQuery
  selectedId: string | null
  /**
   * The address of an item, the screen with its content open: a link, so that a news item opens
   * in a new tab and its address is copied as any other. It replaces the current entry of the
   * history, as the filters do.
   */
  itemLink: (newsId: string) => To
  /** Shown above the list, e.g. the filters of the N screen. */
  filters?: ReactNode
  emptyMessage?: string
}

/**
 * News, newest first, each with its two tags: the N screen (filtered by type, newspaper,
 * category, security and country) and the N tab of a security profile. API /news, refreshed by
 * NewsPublished.
 */
export function NewsListPanel({
  query,
  selectedId,
  itemLink,
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
                  <NewsRow
                    item={item}
                    to={itemLink(item.id)}
                    replace
                    selected={item.id === selectedId}
                  />
                </li>
              ))}
            </ul>
          )}
        </QueryView>
      </div>
    </Panel>
  )
}
