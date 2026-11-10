import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router'
import { isDocumentType, type DocumentQuery } from '@/entities/document'
import type { NewsQuery } from '@/entities/news'
import { NEWS_CATEGORIES, NEWS_TYPES } from '@/shared/api/contracts'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { NEWS_TABS, newsTabPath, routes, type NewsTab } from '@/shared/routes/paths'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { ScreenTabs } from '@/shared/ui/ScreenTabs'
import { DocumentListPanel } from '@/widgets/document-list-panel'
import { DocumentViewerPanel } from '@/widgets/document-viewer-panel'
import { NewsArticlePanel } from '@/widgets/news-article-panel'
import { NewsListPanel } from '@/widgets/news-list-panel'
import { layoutKey, NEWS_LAYOUTS } from '../config/layouts'
import { DocumentFilters, type DocumentFilterValues } from './DocumentFilters'
import { NewsFilters, type NewsFilterValues } from './NewsFilters'

const TAB_CODES: Record<NewsTab, string> = { news: 'N', documents: 'DOC' }

const isNewsTab = (value: string): value is NewsTab => NEWS_TABS.some((tab) => tab === value)

/**
 * N screen (spec sections 5 and 16): the news feed filtered by security, country, category, type
 * and newspaper with the content next to it, and the document library with its full-text search
 * and PDF viewer. /n and /n/documents; the filters and the open item live in the URL,
 * /n?article={id} being the address of a news item that members share, /n?type=flash and
 * /n?source={id} the feed a tag filters.
 */
export function NewsPage() {
  const { t } = useTranslation()
  const { tab = 'news' } = useParams()
  if (!isNewsTab(tab)) return <Navigate to={routes.news} replace />

  const tabs = NEWS_TABS.map((value) => ({
    to: newsTabPath(value),
    code: TAB_CODES[value],
    label: t(`news.tabs.${value}`),
  }))

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-2 pt-2">
        <ScreenTabs tabs={tabs} label={t('news.tabsLabel')} />
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'news' ? <NewsTabPanels /> : <DocumentsTabPanels />}
      </div>
    </div>
  )
}

/** The filters and the open item live in the URL; empty values leave it. */
function useParamsPatch() {
  const [params, update] = useSearchParamsUpdate()
  const patch = (values: Partial<Record<string, string>>) =>
    update((current) => withParams(current, values))
  return [params, patch] as const
}

function NewsTabPanels() {
  const { t } = useTranslation()
  const [params, patch] = useParamsPatch()
  const filters: NewsFilterValues = {
    security: params.get('security') ?? '',
    country: params.get('country') ?? '',
    category: NEWS_CATEGORIES.find((category) => category === params.get('category')) ?? '',
    type: NEWS_TYPES.find((type) => type === params.get('type')) ?? '',
    source: params.get('source') ?? '',
  }
  const query: NewsQuery = {
    securityId: filters.security || undefined,
    country: filters.country || undefined,
    category: filters.category || undefined,
    type: filters.type || undefined,
    sourceId: filters.source || undefined,
    pageSize: 50,
  }
  const articleId = params.get('article')

  const panels = {
    list: (
      <NewsListPanel
        query={query}
        selectedId={articleId}
        itemLink={(article) => ({ search: `?${withParams(params, { article }).toString()}` })}
        filters={<NewsFilters values={filters} onChange={patch} />}
        emptyMessage={t('news.empty')}
      />
    ),
    article: <NewsArticlePanel articleId={articleId} />,
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey('news')}
      defaultLayout={NEWS_LAYOUTS.news}
      panels={panels}
    />
  )
}

function DocumentsTabPanels() {
  const { t } = useTranslation()
  const [params, patch] = useParamsPatch()
  const type = params.get('type') ?? ''
  const filters: DocumentFilterValues = {
    q: params.get('q') ?? '',
    type: isDocumentType(type) ? type : '',
  }
  const query: DocumentQuery = { q: filters.q || undefined, type: filters.type || undefined }
  const documentId = params.get('doc')

  const panels = {
    list: (
      <DocumentListPanel
        query={query}
        selectedId={documentId}
        onSelect={(doc) => patch({ doc })}
        filters={<DocumentFilters values={filters} onChange={patch} />}
        emptyMessage={t('documents.noMatch')}
      />
    ),
    viewer: <DocumentViewerPanel query={query} documentId={documentId} />,
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey('documents')}
      defaultLayout={NEWS_LAYOUTS.documents}
      panels={panels}
    />
  )
}
