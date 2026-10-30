import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { DocumentBadge, useDocuments } from '@/entities/document'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface DocumentListPanelProps {
  securityId: string
  selectedId: string | null
  onSelect: (documentId: string) => void
}

/** Screen 2, DOC tab: the issuer's documents, newest first. API /documents?securityId=. */
export function DocumentListPanel({ securityId, selectedId, onSelect }: DocumentListPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const documents = useDocuments({ securityId })

  return (
    <Panel title={t('panels.documents')} code="DOC">
      <QueryView query={documents} isEmpty={(page) => page.items.length === 0}>
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
                      {document.source} · {t('documents.pages', { count: document.pages })} ·{' '}
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
    </Panel>
  )
}
