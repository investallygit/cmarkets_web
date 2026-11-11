import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  LIBRARY_PAGE_SIZE,
  useLibrary,
  useLibraryPublication,
  type LibraryQuery,
} from '@/entities/publication'
import { ScreenWorkspace } from '@/features/workspace-layout'
import type { SecurityProfileDto } from '@/shared/api/contracts'
import type { SecurityFunction } from '@/shared/routes/paths'
import { AnalystPanel } from '@/widgets/analyst-panel'
import { DocumentListPanel } from '@/widgets/document-list-panel'
import { DocumentViewerPanel } from '@/widgets/document-viewer-panel'
import { NewsArticlePanel } from '@/widgets/news-article-panel'
import { NewsListPanel } from '@/widgets/news-list-panel'
import { PublicationListPanel } from '@/widgets/publication-list-panel'
import { PublicationPreviewPanel } from '@/widgets/publication-preview-panel'
import { defaultLayout, layoutKey } from '../config/layouts'

export type SharedFunction = Extract<SecurityFunction, 'n' | 'doc' | 'ana'>

/** The tabs every profile shows alike: the security's news, its documents and the research on it. */
export function SharedTab({ fn, security }: { fn: SharedFunction; security: SecurityProfileDto }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { id } = security
  const panels: Record<SharedFunction, Record<string, ReactNode>> = {
    n: {
      list: (
        <NewsListPanel
          query={{ securityId: id, pageSize: 50 }}
          selectedId={searchParams.get('article')}
          itemLink={(article) => ({ search: `?${new URLSearchParams({ article }).toString()}` })}
        />
      ),
      article: <NewsArticlePanel articleId={searchParams.get('article')} />,
    },
    doc: {
      list: (
        <DocumentListPanel
          query={{ securityId: id }}
          selectedId={searchParams.get('doc')}
          onSelect={(doc) => setSearchParams({ doc }, { replace: true })}
        />
      ),
      viewer: (
        <DocumentViewerPanel query={{ securityId: id }} documentId={searchParams.get('doc')} />
      ),
    },
    ana: {
      list: <ResearchList security={security} />,
      preview: <ResearchPreview security={security} />,
      analyst: <ResearchAnalyst security={security} />,
    },
  }
  return (
    <ScreenWorkspace
      screenId={layoutKey(fn, security.type)}
      defaultLayout={defaultLayout(fn, security.type)}
      panels={panels[fn]}
    />
  )
}

/**
 * ANA: the research library's list for one security (spec section 9, screen 2); a bond shows the
 * research on its issuing country. The open publication and the page live in the URL; the first
 * publication opens when none is chosen.
 */
function useResearchSelection(security: SecurityProfileDto) {
  const [searchParams] = useSearchParams()
  const query: LibraryQuery = {
    tab: 'all',
    ...(security.type === 'bond'
      ? ({ subjectType: 'country', subjectId: security.country } as const)
      : ({ subjectType: 'company', subjectId: security.id } as const)),
    page: Math.max(1, Number(searchParams.get('page')) || 1),
    pageSize: LIBRARY_PAGE_SIZE,
  }
  const list = useLibrary(query)
  const selectedId = searchParams.get('publication') ?? list.data?.items.at(0)?.id ?? null
  return { query, selectedId }
}

function ResearchList({ security }: { security: SecurityProfileDto }) {
  const [, setSearchParams] = useSearchParams()
  const { query, selectedId } = useResearchSelection(security)
  const page: Record<string, string> = query.page > 1 ? { page: String(query.page) } : {}
  return (
    <PublicationListPanel
      query={query}
      selectedId={selectedId}
      onSelect={(publication) => setSearchParams({ ...page, publication }, { replace: true })}
      onPageChange={(next) =>
        setSearchParams(next > 1 ? { page: String(next) } : {}, { replace: true })
      }
    />
  )
}

function ResearchPreview({ security }: { security: SecurityProfileDto }) {
  return <PublicationPreviewPanel publicationId={useResearchSelection(security).selectedId} />
}

function ResearchAnalyst({ security }: { security: SecurityProfileDto }) {
  const { selectedId } = useResearchSelection(security)
  return <AnalystPanel analystId={useLibraryPublication(selectedId).data?.analyst.id ?? null} />
}
