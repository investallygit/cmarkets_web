import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useNow } from '@/shared/hooks/useNow'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { routes } from '@/shared/navigation/paths'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { useNews, type NewsFilter } from './api'

const FILTERS: readonly NewsFilter[] = ['all', 'issuer', 'regulator']
const DAY_MS = 86_400_000

/** Screen 1, News: time, source in amber, headline; click = article. API /news. */
export function NewsPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const navigate = useNavigate()
  const now = useNow(60_000)
  const [filter, setFilter] = useState<NewsFilter>('all')
  const news = useNews(filter)

  const tabs = useMemo(
    () => FILTERS.map((value) => ({ value, label: t(`market.newsTopics.${value}`) })),
    [t],
  )
  const today = toMarketDay(now)
  const yesterday = toMarketDay(now - DAY_MS)
  const when = (publishedAt: string) => {
    const day = toMarketDay(publishedAt)
    if (day === today) return format.time(publishedAt)
    if (day === yesterday) return t('common.yesterdayShort')
    return format.dayMonth(publishedAt)
  }

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
                    {when(item.publishedAt)}
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
