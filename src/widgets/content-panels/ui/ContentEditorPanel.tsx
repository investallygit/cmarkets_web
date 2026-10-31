import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDocuments } from '@/entities/document'
import { DocumentForm, NewsForm } from '@/features/publish-content'
import type { NewsTab } from '@/shared/routes/paths'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'

interface ContentEditorPanelProps {
  kind: NewsTab
  /** The item edited; null for a new one. */
  itemId: string | null
  /** After a publication: the item stays open for more changes. */
  onSaved: (id: string) => void
  onNew: () => void
}

/** NEWS: publish news or a document, or edit the one picked in the list. */
export function ContentEditorPanel({ kind, itemId, onSaved, onNew }: ContentEditorPanelProps) {
  const { t } = useTranslation()
  const documents = useDocuments({ pageSize: 100 })
  const document =
    kind === 'documents' && itemId
      ? (documents.data?.items.find((item) => item.id === itemId) ?? null)
      : null
  const editing = itemId !== null
  const title = editing
    ? kind === 'news'
      ? t('content.editNews')
      : t('content.editDocument')
    : kind === 'news'
      ? t('content.newNews')
      : t('content.newDocument')

  return (
    <Panel
      title={title}
      code="NEWS"
      options={
        editing && (
          <Button size="sm" variant="link" icon={Plus} onClick={onNew} className="panel-no-drag">
            {kind === 'news' ? t('content.newNews') : t('content.newDocument')}
          </Button>
        )
      }
    >
      {kind === 'news' ? (
        <NewsForm key={itemId ?? 'new'} articleId={itemId} onSaved={(item) => onSaved(item.id)} />
      ) : (
        <DocumentForm
          key={`${itemId ?? 'new'}|${document ? 'loaded' : ''}`}
          document={document}
          onSaved={(item) => onSaved(item.id)}
        />
      )}
    </Panel>
  )
}
