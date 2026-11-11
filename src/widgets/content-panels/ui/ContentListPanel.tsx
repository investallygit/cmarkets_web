import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DocumentBadge, useDocuments } from '@/entities/document'
import { NewsTime, NewsTypeTag, useNews } from '@/entities/news'
import type { DocumentDto, NewsItemDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import type { NewsTab } from '@/shared/routes/paths'
import { createDataColumnHelper } from '@/shared/ui/dataColumns'
import { DataTable } from '@/shared/ui/DataTable'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const newsHelper = createDataColumnHelper<NewsItemDto>()
const documentHelper = createDataColumnHelper<DocumentDto>()
const getId = (item: { id: string }) => item.id

/** The latest items, enough for a working day of the Data admin. */
const PAGE_SIZE = 100

interface ContentListPanelProps {
  tab: NewsTab
  /** NEWS's tabs, in the title bar: news, documents, moderation, publishers. */
  tabs: ReactNode
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * NEWS: the CMARKET channel's news and the documents published (GET /news?channel=cmarket, GET
 * /documents), newest first; a click opens one in the editor. The newspapers' items are theirs:
 * the Moderation tab reviews them (ROADMAP step 27).
 */
export function ContentListPanel({ tab, tabs, selectedId, onSelect }: ContentListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const news = useNews({ channel: 'cmarket', pageSize: PAGE_SIZE })
  const documents = useDocuments({ pageSize: PAGE_SIZE })

  const newsColumns = useMemo(
    () =>
      newsHelper.columns([
        newsHelper.accessor('publishedAt', {
          header: t('columns.time'),
          meta: { width: '64px' },
          cell: ({ getValue }) => <NewsTime publishedAt={getValue()} />,
        }),
        newsHelper.accessor((item) => t(`news.types.${item.type}`), {
          id: 'type',
          header: t('content.type'),
          meta: { width: '80px' },
          cell: ({ row }) => <NewsTypeTag type={row.original.type} mode="none" />,
        }),
        newsHelper.accessor((item) => item.subject ?? '', {
          id: 'subject',
          header: t('content.subject'),
          meta: { width: '96px' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        newsHelper.accessor('headline', {
          header: t('content.headline'),
          meta: { width: '3fr' },
          cell: ({ getValue }) => (
            <span className="font-sans" title={getValue()}>
              {getValue()}
            </span>
          ),
        }),
        newsHelper.accessor((item) => t(`news.categories.${item.category}`), {
          id: 'category',
          header: t('content.category'),
          meta: { width: '1fr' },
        }),
        newsHelper.accessor((item) => item.countries.join(', '), {
          id: 'countries',
          header: t('content.countries'),
          meta: { width: '1fr' },
        }),
        newsHelper.accessor((item) => item.securityIds.join(', '), {
          id: 'securities',
          header: t('content.securities'),
          meta: { width: '1fr' },
        }),
      ]),
    [t],
  )

  const documentColumns = useMemo(
    () =>
      documentHelper.columns([
        documentHelper.accessor('publishedAt', {
          header: t('columns.date'),
          meta: { width: '88px' },
          cell: ({ getValue }) => format.date(getValue()),
        }),
        documentHelper.accessor('type', {
          header: t('columns.type'),
          meta: { width: '72px', exportable: false },
          cell: ({ getValue }) => <DocumentBadge type={getValue()} />,
        }),
        documentHelper.accessor('source', {
          header: t('columns.source'),
          meta: { width: '96px' },
          cell: ({ getValue }) => <span className="text-accent-amber">{getValue()}</span>,
        }),
        documentHelper.accessor('title', {
          header: t('content.title'),
          meta: { width: '3fr' },
          cell: ({ getValue }) => (
            <span className="font-sans" title={getValue()}>
              {getValue()}
            </span>
          ),
        }),
        documentHelper.accessor('pages', {
          header: t('content.pages'),
          meta: { align: 'right', width: '56px' },
        }),
        documentHelper.accessor('sizeBytes', {
          header: t('content.size'),
          meta: { align: 'right', width: '80px' },
          cell: ({ getValue }) => format.fileSize(getValue()),
        }),
      ]),
    [t, format],
  )

  return (
    <Panel title={t('panels.contentList')} code="NEWS" options={tabs}>
      {tab === 'news' ? (
        <QueryView query={news}>
          {(page) => (
            <DataTable
              data={page.items}
              columns={newsColumns}
              getRowId={getId}
              selectedRowId={selectedId}
              onRowClick={(item) => onSelect(item.id)}
              exportName="cmarket-news"
              emptyMessage={t('content.noNews')}
            />
          )}
        </QueryView>
      ) : (
        <QueryView query={documents}>
          {(page) => (
            <DataTable
              data={page.items}
              columns={documentColumns}
              getRowId={getId}
              selectedRowId={selectedId}
              onRowClick={(item) => onSelect(item.id)}
              exportName="cmarket-documents"
              emptyMessage={t('content.noDocuments')}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}
