import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { DocumentBadge } from '@/entities/document'
import { useIndexDocuments } from '@/entities/market'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { ConstituentHistoryButton } from './ConstituentHistoryButton'

interface IndexDocumentsPanelProps {
  code: string
  screen: 'DES' | 'DOC'
  /** The document open beside the list (DOC), or opened in DOC from DES. */
  selectedId?: string | null
  onOpen: (documentId: string) => void
}

/**
 * Screen 31, "Methodology and notices" (spec section 9, fifth version): the index's methodology,
 * review notices, adjustments after corporate actions and factsheets the Data admin published with
 * the index as their subject, newest first (ROADMAP decision 44), each opened in the PDF viewer;
 * then the constituents' history as XLSX. API /indices/{code}/documents.
 */
export function IndexDocumentsPanel({
  code,
  screen,
  selectedId = null,
  onOpen,
}: IndexDocumentsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const documents = useIndexDocuments(code)

  return (
    <Panel title={t('panels.methodologyNotices')} code={screen === 'DES' ? 'DOC' : screen}>
      <QueryView query={documents}>
        {(items) => (
          <ScrollArea className="h-full">
            <ul>
              {items.map((document) => (
                <li key={document.id}>
                  <button
                    type="button"
                    aria-current={document.id === selectedId || undefined}
                    onClick={() => onOpen(document.id)}
                    className={clsx(
                      'flex min-h-8 w-full items-center gap-3 px-2 py-1 text-left font-sans text-data hover:bg-panel-header',
                      document.id === selectedId && 'bg-selected',
                    )}
                  >
                    <DocumentBadge type={document.type} />
                    <span className="min-w-0 flex-1 truncate">{document.title}</span>
                    <span className="shrink-0 font-mono text-secondary">
                      {format.date(document.publishedAt)}
                    </span>
                  </button>
                </li>
              ))}
              <li className="flex min-h-8 items-center gap-3 px-2 py-1 font-sans text-data">
                <Badge tone="info">XLSX</Badge>
                <span className="min-w-0 flex-1 truncate">{t('indexProfile.history.title')}</span>
                <ConstituentHistoryButton code={code} label={t('indexProfile.history.short')} />
              </li>
            </ul>
            {items.length === 0 && (
              <p className="px-2 py-1.5 font-sans text-caption text-secondary">
                {t('indexProfile.documents.none')}
              </p>
            )}
            <p className="px-2 py-1.5 font-sans text-caption text-secondary">
              {t('indexProfile.documents.note')}
            </p>
          </ScrollArea>
        )}
      </QueryView>
    </Panel>
  )
}
