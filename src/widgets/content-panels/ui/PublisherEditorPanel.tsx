import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePublishers } from '@/entities/news-source'
import { PublisherForm } from '@/features/edit-publisher'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'

interface PublisherEditorPanelProps {
  /** The row edited; null for a new domain. */
  publisherId: string | null
  onSaved: (id: string) => void
  onNew: () => void
}

/** NEWS, a publisher: name a domain, or rename or remove the one picked in the list. */
export function PublisherEditorPanel({ publisherId, onSaved, onNew }: PublisherEditorPanelProps) {
  const { t } = useTranslation()
  const publishers = usePublishers()
  const publisher = publisherId
    ? (publishers.data?.find((candidate) => candidate.id === publisherId) ?? null)
    : null
  return (
    <Panel
      title={
        publisher
          ? t('publishers.editTitle', { domain: publisher.domain })
          : t('publishers.newTitle')
      }
      code="NEWS"
      options={
        publisherId && (
          <Button size="sm" variant="link" icon={Plus} onClick={onNew} className="panel-no-drag">
            {t('publishers.new')}
          </Button>
        )
      }
    >
      <PublisherForm
        key={publisher ? `${publisher.id}|${publisher.updatedAt}` : 'new'}
        publisher={publisher}
        onSaved={(saved) => onSaved(saved.id)}
        onRemoved={onNew}
      />
    </Panel>
  )
}
