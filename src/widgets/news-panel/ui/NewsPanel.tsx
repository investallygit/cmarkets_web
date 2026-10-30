import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NewsTime, useNews } from '@/entities/news'
import type { NewsTopic } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

type NewsFilter = 'all' | Extract<NewsTopic, 'issuer' | 'regulator'>

const FILTERS: readonly NewsFilter[] = ['all', 'issuer', 'regulator']

/** Screen 1, News: time, source in amber, headline; click = article. API /news. */
export function NewsPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<NewsFilter>('all')
  const news = useNews({ topic: filter === 'all' ? undefined : filter })

  const tabs = useMemo(
    () => FILTERS.map((value) => ({ value, label: t(`market.newsTopics.${value}`) })),
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
                <button
                  type="button"
                  onClick={() => void navigate(routes.news)}
                  className="grid w-full grid-cols-[48px_minmax(0,1fr)] gap-x-2 px-2 py-1.5 text-left hover:bg-panel-header"
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
    </Panel>
  )
}
