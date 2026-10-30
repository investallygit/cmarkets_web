import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DocumentBadge, useDocuments, type DocumentQuery } from '@/entities/document'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface DocumentListPanelProps {
  query: DocumentQuery
  selectedId: string | null
  onSelect: (documentId: string) => void
  /** Shown above the list, e.g. the full-text search of the N screen. */
  filters?: ReactNode
  emptyMessage?: string
}

/**
 * Documents, newest first: the issuer's (DOC tab of a security profile) or the whole library with
 * a full-text search (N screen). API /documents?securityId=&type=&q=.
 */
export function DocumentListPanel({
  query,
  selectedId,
  onSelect,
  filters,
  emptyMessage,
}: DocumentListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const documents = useDocuments(query)

  return (
    <Panel title={t('panels.documents')} code="DOC" bodyClassName="flex flex-col">
      {filters}
      <div className="min-h-0 flex-1 overflow-auto">
        <QueryView
          query={documents}
          isEmpty={(page) => page.items.length === 0}
          emptyMessage={emptyMessage}
        >
          {(page) => (
            <ul className="divide-y">
              {page.items.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    aria-current={document.id === selectedId || undefined}
                    onClick={() => onSelect(document.id)}
                    className={clsx(
                      'grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-2 px-2 py-1.5 text-left',
                      document.id === selectedId ? 'bg-selected' : 'hover:bg-panel-header',
                    )}
                  >
                    <DocumentBadge type={document.type} />
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-label">{document.title}</span>
                      <span className="block font-sans text-title text-secondary">
                        <span className="font-mono text-accent-amber">{document.source}</span> ·{' '}
                        {t('documents.pages', { count: document.pages })} ·{' '}
                        {format.fileSize(document.sizeBytes)}
                      </span>
                    </span>
                    <span className="font-mono text-data text-secondary">
                      {format.date(document.publishedAt)}
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
