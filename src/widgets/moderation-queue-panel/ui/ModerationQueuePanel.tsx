import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { ModerationTag, useModerationQueue, type ModerationKind } from '@/entities/moderation'
import { ModerationDecision } from '@/features/moderate-publication'
import type { ModerationItemDto } from '@/shared/api/contracts'
import { Panel } from '@/shared/ui/Panel'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'
import { useItemLine } from '../model/useItemLine'

type Filter = ModerationKind | 'all'
const FILTERS: readonly Filter[] = ['all', 'reported', 'pending']

interface ModerationQueuePanelProps {
  /** compact: screen 9 with its links; full: MOD, a click opens the publication. */
  variant: 'compact' | 'full'
  filter?: Filter
  onFilterChange?: (filter: Filter) => void
  selectedId?: string | null
  onOpen: (item: ModerationItemDto) => void
}

/**
 * Screen 9, moderation queue: the publications readers reported, then those waiting for a
 * moderator; Open, Approve, Take down (GET /admin/publications?status=pending|reported).
 */
export function ModerationQueuePanel({
  variant,
  filter = 'all',
  onFilterChange,
  selectedId = null,
  onOpen,
}: ModerationQueuePanelProps) {
  const { t } = useTranslation()
  const queue = useModerationQueue()
  const line = useItemLine()
  const items = (queue.data ?? []).filter((item) => filter === 'all' || item.kind === filter)
  const reported = queue.data?.filter((item) => item.kind === 'reported').length ?? 0
  const pending = queue.data?.filter((item) => item.kind === 'pending').length ?? 0
  const full = variant === 'full'

  return (
    <Panel
      title={t('panels.moderationQueue')}
      code="MOD"
      options={
        full && onFilterChange ? (
          <PanelTabs
            value={filter}
            options={FILTERS.map((value) => ({
              value,
              label:
                value === 'all'
                  ? t('moderation.all')
                  : value === 'reported'
                    ? t('moderation.reportsCount', { count: reported })
                    : t('moderation.pendingCount', { count: pending }),
            }))}
            onChange={onFilterChange}
          />
        ) : (
          queue.data && (
            <span>
              {t('moderation.reportsCount', { count: reported })} ·{' '}
              {t('moderation.pendingCount', { count: pending })}
            </span>
          )
        )
      }
    >
      <QueryView
        query={queue}
        isEmpty={() => items.length === 0}
        emptyMessage={t('moderation.none')}
      >
        {() => (
          <ul className="flex flex-col">
            {items.map((item, index) => {
              const content = (
                <>
                  <ModerationTag item={item} />
                  <p className="truncate text-label font-semibold">{item.title}</p>
                  <p className="truncate text-secondary">{line(item)}</p>
                </>
              )
              return (
                <li
                  key={item.publicationId}
                  className={clsx(
                    'flex items-start gap-3 border-b px-3 py-2',
                    item.publicationId === selectedId
                      ? 'bg-selected'
                      : index % 2 === 1 && 'bg-row-alt',
                  )}
                >
                  {full ? (
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      aria-current={item.publicationId === selectedId}
                      className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left font-sans text-data"
                    >
                      {content}
                    </button>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-1 font-sans text-data">
                        {content}
                      </div>
                      <ModerationDecision item={item} onOpen={() => onOpen(item)} />
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}
