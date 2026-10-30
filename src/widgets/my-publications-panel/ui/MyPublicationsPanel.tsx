import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useMyPublications } from '@/entities/publication'
import type { MyPublicationDto, PublicationStatus } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

const STATUS_TONES: Record<PublicationStatus, 'neutral' | 'amber' | 'up'> = {
  draft: 'neutral',
  pending: 'amber',
  published: 'up',
  archived: 'neutral',
}

interface MyPublicationsPanelProps {
  selectedId: string | null
  onSelect: (publicationId: string) => void
  onCreate: () => void
}

/**
 * Screen 7, left: the analyst's publications with their status (Draft, In moderation, Published,
 * Archived) and access. API GET /me/publications.
 */
export function MyPublicationsPanel({ selectedId, onSelect, onCreate }: MyPublicationsPanelProps) {
  const { t } = useTranslation()
  const publications = useMyPublications()
  return (
    <Panel
      title={t('panels.myPublications')}
      code="PUB"
      options={
        <button
          type="button"
          onClick={onCreate}
          className="panel-no-drag uppercase hover:text-primary"
        >
          {t('studio.new.action')}
        </button>
      }
    >
      <QueryView
        query={publications}
        isEmpty={(items) => items.length === 0}
        emptyMessage={t('studio.mine.empty')}
      >
        {(items) => (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.id}>
                <PublicationRow
                  item={item}
                  selected={item.id === selectedId}
                  onSelect={() => onSelect(item.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}

function PublicationRow({
  item,
  selected,
  onSelect,
}: {
  item: MyPublicationDto
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const { pricing } = item
  return (
    <button
      type="button"
      aria-current={selected || undefined}
      onClick={onSelect}
      className={clsx(
        'flex w-full flex-col gap-1.5 border-l-2 px-3 py-2 text-left',
        selected ? 'border-accent-amber bg-selected' : 'border-transparent hover:bg-panel-header',
      )}
    >
      <span className="line-clamp-2 font-sans text-label">
        {item.title || t('studio.mine.untitled')}
      </span>
      <span className="flex items-center gap-1.5">
        <Badge tone={STATUS_TONES[item.status]}>{t(`studio.statuses.${item.status}`)}</Badge>
        {item.hasChanges && <Badge tone="info">{t('studio.mine.changes')}</Badge>}
        <span
          className={clsx(
            'ml-auto font-mono text-data',
            pricing.access === 'paid' ? 'text-accent-amber' : 'text-secondary',
          )}
        >
          {pricing.access === 'paid' && pricing.price !== null
            ? t('studio.mine.paid', { price: format.number(pricing.price, 0) })
            : t('studio.settings.free')}
        </span>
      </span>
    </button>
  )
}
