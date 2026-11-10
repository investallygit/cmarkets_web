import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NewsRow, useNews } from '@/entities/news'
import type { NewsCategory } from '@/shared/api/contracts'
import { newsPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

/** The mockup's ALL · ISSUERS · REGULATOR: the categories of those names (ROADMAP decision 4). */
type NewsFilter = 'all' | Extract<NewsCategory, 'issuers' | 'regulation'>

const FILTERS: readonly NewsFilter[] = ['all', 'issuers', 'regulation']

/**
 * Screen 1, News: time, the type and newspaper tags, the subject in amber, the headline; each a
 * link to its content on the N screen, where its display counts the unique click. API /news.
 */
export function NewsPanel() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<NewsFilter>('all')
  const news = useNews({ category: filter === 'all' ? undefined : filter })

  const tabs = useMemo(
    () => FILTERS.map((value) => ({ value, label: t(`market.newsFilters.${value}`) })),
    [t],
  )

  return (
    <Panel
      title={t('panels.news')}
      code="N"
      options={<PanelTabs value={filter} options={tabs} onChange={setFilter} />}
    >
      <QueryView query={news} isEmpty={(page) => page.items.length === 0}>
        {(page) => (
          <ul className="divide-y">
            {page.items.map((item) => (
              <li key={item.id}>
                <NewsRow item={item} to={newsPath(item.id)} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}
