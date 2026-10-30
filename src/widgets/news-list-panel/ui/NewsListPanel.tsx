import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { NewsTime, useNews } from '@/entities/news'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface NewsListPanelProps {
  securityId: string
  selectedId: string | null
  onSelect: (newsId: string) => void
}

/** Screen 2, N tab: news of the security, newest first. API /news?securityId=. */
export function NewsListPanel({ securityId, selectedId, onSelect }: NewsListPanelProps) {
  const { t } = useTranslation()
  const news = useNews({ securityId, pageSize: 50 })

  return (
    <Panel title={t('panels.securityNews')} code="N">
      <QueryView query={news} isEmpty={(page) => page.items.length === 0}>
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
    </Panel>
  )
}
