import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNewsQueue } from '@/entities/moderation'
import { NewsTags } from '@/entities/news'
import {
  NEWS_CHANNELS,
  type NewsChannel,
  type NewsQueueItemDto,
  type NewsQueueKind,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PanelSelect } from '@/shared/ui/PanelSelect'
import { PanelTabs } from '@/shared/ui/PanelTabs'
import { QueryView } from '@/shared/ui/QueryView'

export type NewsQueueFilter = NewsQueueKind | 'all'
const FILTERS: readonly NewsQueueFilter[] = ['all', 'reported', 'pending']

interface NewsQueuePanelProps {
  filter: NewsQueueFilter
  onFilterChange: (filter: NewsQueueFilter) => void
  channel: NewsChannel | null
  onChannelChange: (channel: NewsChannel | null) => void
  selectedId: string | null
  onOpen: (item: NewsQueueItemDto) => void
  /** The screen's code in the title bar: NEWS for the Data admin, MOD for the Admin. */
  code: string
  /** The screen's own tabs (NEWS): they take the title bar, the queue's filters a bar under it. */
  tabs?: ReactNode
}

/**
 * The news moderation queue (NEWS and MOD, spec section 10 GET /admin/news): the items readers
 * reported, then those waiting for a moderator, by channel; each its tags, subject, headline and
 * why it is there. A click opens it beside.
 */
export function NewsQueuePanel({
  filter,
  onFilterChange,
  channel,
  onChannelChange,
  selectedId,
  onOpen,
  code,
  tabs,
}: NewsQueuePanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const queue = useNewsQueue({ channel })
  const all = queue.data ?? []
  const items = all.filter((item) => filter === 'all' || item.kind === filter)
  const count = (kind: NewsQueueKind) => all.filter((item) => item.kind === kind).length

  const line = (item: NewsQueueItemDto) =>
    [
      t('newsModeration.since', { time: `${format.date(item.since)} ${format.time(item.since)}` }),
      item.kind === 'reported'
        ? t('newsModeration.reportsCount', { count: item.reports })
        : item.holdReason && t(`newsModeration.holdReasons.${item.holdReason}`),
      item.confidence !== null &&
        t('newsModeration.confidence', { value: format.number(item.confidence, 2) }),
    ]
      .filter(Boolean)
      .join(' · ')

  const filters = (
    <span className="flex flex-wrap items-center gap-2">
      <PanelTabs
        value={filter}
        options={FILTERS.map((value) => ({
          value,
          label:
            value === 'all'
              ? t('newsModeration.all')
              : value === 'reported'
                ? t('newsModeration.reportedCount', { count: count('reported') })
                : t('newsModeration.pendingCount', { count: count('pending') }),
        }))}
        onChange={onFilterChange}
      />
      <PanelSelect
        value={channel ?? ''}
        options={[
          { value: '', label: t('newsModeration.allChannels') },
          ...NEWS_CHANNELS.map((value) => ({ value, label: t(`news.channels.${value}`) })),
        ]}
        onChange={(value) => onChannelChange((value || null) as NewsChannel | null)}
        aria-label={t('newsModeration.channel')}
      />
    </span>
  )

  return (
    <Panel title={t('panels.newsQueue')} code={code} options={tabs ?? filters}>
      {tabs && <div className="border-b px-3 py-1.5">{filters}</div>}
      <QueryView
        query={queue}
        isEmpty={() => items.length === 0}
        emptyMessage={t('newsModeration.none')}
      >
        {() => (
          <ul className="flex flex-col">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={clsx(
                  'border-b',
                  item.id === selectedId ? 'bg-selected' : index % 2 === 1 && 'bg-row-alt',
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  aria-current={item.id === selectedId}
                  className="flex w-full min-w-0 flex-col items-start gap-1 px-3 py-2 text-left font-sans text-data"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono">
                    <span
                      className={clsx(
                        'font-sans font-semibold',
                        item.kind === 'reported' ? 'text-down' : 'text-accent-amber',
                      )}
                    >
                      {t(`newsModeration.kinds.${item.kind}`)}
                    </span>
                    <NewsTags type={item.type} source={item.source} mode="none" />
                    {item.subject && (
                      <span className="font-semibold text-accent-amber">{item.subject}</span>
                    )}
                  </span>
                  <span className="w-full truncate text-label font-semibold">{item.headline}</span>
                  <span className="w-full truncate text-secondary">{line(item)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Panel>
  )
}
