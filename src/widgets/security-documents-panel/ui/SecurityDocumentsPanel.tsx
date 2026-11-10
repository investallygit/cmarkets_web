import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { DocumentBadge, useDocuments } from '@/entities/document'
import { NewsSourceTag, NewsTypeTag, useNews } from '@/entities/news'
import { useFormat } from '@/shared/i18n'
import { securityPath } from '@/shared/routes/paths'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'

interface Entry {
  key: string
  badge: ReactNode
  /** A news item's newspaper tag, before its headline. */
  source?: ReactNode
  title: string
  publishedAt: string
  /** The DOC or N tab with this item open. */
  to: string
}

const SHOWN = 12

/**
 * Screen 2, documents and news of the security, newest first, the news with their two tags (spec
 * section 16). A document opens in the embedded PDF viewer of the DOC tab, a news item in the N
 * tab. API /documents, /news.
 */
export function SecurityDocumentsPanel({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const documents = useDocuments({ securityId, pageSize: SHOWN })
  const news = useNews({ securityId, pageSize: SHOWN })

  let body: ReactNode
  if (documents.isPending || news.isPending) body = <PanelLoading />
  else if (documents.isError) {
    body = <PanelError error={documents.error} onRetry={() => void documents.refetch()} />
  } else {
    const entries: Entry[] = [
      ...documents.data.items.map((document) => ({
        key: `document-${document.id}`,
        badge: <DocumentBadge type={document.type} />,
        title: document.title,
        publishedAt: document.publishedAt,
        to: `${securityPath(securityId, 'doc')}?doc=${encodeURIComponent(document.id)}`,
      })),
      ...(news.data?.items ?? []).map((item) => ({
        key: `news-${item.id}`,
        badge: <NewsTypeTag type={item.type} mode="none" />,
        source: <NewsSourceTag source={item.source} mode="none" />,
        title: item.headline,
        publishedAt: item.publishedAt,
        to: `${securityPath(securityId, 'n')}?article=${encodeURIComponent(item.id)}`,
      })),
    ]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, SHOWN)
    body =
      entries.length === 0 ? (
        <PanelEmpty />
      ) : (
        <ul className="divide-y">
          {entries.map((entry) => (
            <li key={entry.key}>
              <Link
                to={entry.to}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1.5 hover:bg-panel-header"
              >
                {entry.badge}
                <span className="flex min-w-0 items-center gap-1.5">
                  {entry.source}
                  <span className="truncate font-sans text-label">{entry.title}</span>
                </span>
                <span className="font-mono text-data text-secondary">
                  {format.date(entry.publishedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )
  }

  return (
    <Panel title={t('panels.documentsNews')} code="DOC · N">
      {body}
    </Panel>
  )
}
