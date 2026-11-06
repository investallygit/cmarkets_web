import { clsx } from 'clsx'
import { BellOff, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CONVERSATION_FILTERS,
  relativeDay,
  useConversations,
  useMessageSearch,
  useOnline,
} from '@/entities/conversation'
import { AccountTypeBadge, initialsOf, ProfileAvatar } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import { NewConversation, type NewConversationTarget } from '@/features/start-conversation'
import type { ConversationFilter, ConversationSummaryDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

interface ConversationListPanelProps {
  filter: ConversationFilter
  onFilter: (filter: ConversationFilter) => void
  selectedId: string | null
  /** A conversation, and the message of it a search found. */
  onSelect: (conversationId: string, messageId?: string) => void
  onNew: (target: NewConversationTarget) => void
}

/** "10:41" today, "Yesterday", then the day and month. */
function useWhen() {
  const { t } = useTranslation()
  const format = useFormat()
  const today = format.day(useNow(60_000))
  return (time: string) => {
    const relative = relativeDay(format.day(time), today)
    return relative === 'today'
      ? format.time(time)
      : relative === 'yesterday'
        ? t('messaging.thread.yesterday')
        : format.dayMonth(time)
  }
}

/** What a row says of the last message: a request in yellow, "You: ...", "T. Bekale: ...". */
function Excerpt({ row }: { row: ConversationSummaryDto }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const last = row.lastMessage
  if (!last) return null
  const text =
    last.kind === 'text'
      ? last.text
      : last.kind === 'file'
        ? t('messaging.conversations.file')
        : last.kind === 'shared'
          ? t('messaging.conversations.shared')
          : t('messaging.conversations.deleted')
  const said =
    row.state === 'requestReceived'
      ? t('messaging.conversations.request', { text })
      : row.state === 'requestSent'
        ? t('messaging.conversations.requestSent', { text })
        : last.authorId === user.id
          ? t('messaging.conversations.you', { text })
          : row.kind === 'group'
            ? t('messaging.conversations.byAuthor', { name: last.authorName, text })
            : text
  return (
    <span
      className={clsx(
        'truncate font-sans text-data',
        row.state === 'requestReceived' ? 'text-warning' : 'text-secondary',
      )}
    >
      {said}
    </span>
  )
}

function Row({
  row,
  selected,
  onSelect,
}: {
  row: ConversationSummaryDto
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const when = useWhen()
  const unread = row.unreadCount > 0
  const online = useOnline(row.counterpart?.userId, row.counterpart?.online)
  return (
    <li>
      <button
        type="button"
        aria-current={selected || undefined}
        onClick={onSelect}
        className={clsx(
          'flex w-full items-center gap-3 border-l-[3px] px-3 py-2.5 text-left',
          selected ? 'border-accent-amber bg-selected' : 'border-transparent hover:bg-panel-header',
        )}
      >
        {row.counterpart ? (
          <ProfileAvatar
            name={row.counterpart.displayName}
            type={row.counterpart.accountType}
            photoUrl={row.counterpart.photoUrl}
            size="sm"
            online={online}
          />
        ) : (
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-info bg-app font-sans text-label font-semibold text-info"
          >
            {initialsOf(row.title)}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {/* In a narrow window the badge and the time go below the name rather than cut it. */}
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className={clsx('truncate font-sans text-label', unread && 'font-semibold')}>
              {row.title}
            </span>
            {online && <span className="sr-only">{t('messaging.conversations.online')}</span>}
            {row.counterpart ? (
              <AccountTypeBadge type={row.counterpart.accountType} />
            ) : (
              <span className="inline-block border border-info px-1 font-sans text-title font-semibold tracking-title text-info uppercase">
                {t('messaging.conversations.group')}
              </span>
            )}
            {row.muted && (
              <BellOff
                role="img"
                aria-label={t('messaging.conversations.muted')}
                className="size-3 shrink-0 text-secondary"
              />
            )}
            {row.lastMessage && (
              <span className="ml-auto shrink-0 font-mono text-title text-secondary">
                {when(row.lastMessage.sentAt)}
              </span>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Excerpt row={row} />
            {unread && (
              <span
                role="img"
                aria-label={t('messaging.conversations.unread', { count: row.unreadCount })}
                className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-amber font-mono text-title font-bold text-app"
              >
                {row.unreadCount}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}

/** The messages a search found, each opening its conversation at it. */
function SearchResults({
  q,
  onSelect,
}: Pick<ConversationListPanelProps, 'onSelect'> & { q: string }) {
  const { t } = useTranslation()
  const when = useWhen()
  const search = useMessageSearch(q)
  return (
    <QueryView
      query={search}
      isEmpty={(hits) => hits.length === 0}
      emptyMessage={t('messaging.conversations.noResult')}
    >
      {(hits) => (
        <>
          <p className="px-3 pt-2 font-sans text-title text-secondary" role="status">
            {t('messaging.conversations.found', { count: hits.length })}
          </p>
          <ul className="divide-y">
            {hits.map((hit) => (
              <li key={hit.messageId}>
                <button
                  type="button"
                  onClick={() => onSelect(hit.conversationId, hit.messageId)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-panel-header"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="truncate font-sans text-label font-semibold">
                      {hit.conversationTitle}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-title text-secondary">
                      {when(hit.sentAt)}
                    </span>
                  </span>
                  <span className="font-sans text-data text-secondary">
                    {t('messaging.conversations.byAuthor', {
                      name: hit.authorName,
                      text: hit.excerpt,
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </QueryView>
  )
}

/**
 * MSG, left (spec section 9, screen 11): the search of the messages, the tabs All / Unread /
 * Requests / Groups with their counts, and the conversations, the latest first.
 */
export function ConversationListPanel({
  filter,
  onFilter,
  selectedId,
  onSelect,
  onNew,
}: ConversationListPanelProps) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const rows = useConversations(filter)
  const all = useConversations('all').data ?? []
  const counts: Record<ConversationFilter, number | null> = {
    all: null,
    unread: all.reduce((total, row) => total + row.unreadCount, 0),
    requests: all.filter((row) => row.state === 'requestReceived').length,
    groups: null,
  }
  const searching = q.trim().length >= 2

  return (
    <Panel
      title={t('panels.conversations')}
      code="MSG"
      bodyClassName="flex flex-col"
      options={<NewConversation onOpen={onNew} />}
    >
      <div className="flex shrink-0 flex-col gap-2 p-2">
        <TextInput
          type="search"
          icon={Search}
          value={q}
          onChange={setQ}
          placeholder={t('messaging.conversations.search')}
          aria-label={t('messaging.conversations.search')}
        />
        {!searching && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-1.5">
            {CONVERSATION_FILTERS.map((value) => {
              const label = t(`messaging.conversations.tabs.${value}`)
              const count = counts[value]
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => onFilter(value)}
                  className={clsx(
                    'h-7 truncate border px-1 font-sans text-data',
                    filter === value
                      ? 'border-info bg-selected text-primary'
                      : 'text-secondary hover:text-primary',
                  )}
                >
                  {count ? t('messaging.conversations.tabCount', { label, count }) : label}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {searching ? (
          <SearchResults q={q} onSelect={onSelect} />
        ) : (
          <QueryView
            query={rows}
            isEmpty={(list) => list.length === 0}
            emptyMessage={t(`messaging.conversations.empty.${filter}`)}
          >
            {(list) => (
              <ul className="divide-y">
                {list.map((row) => (
                  <Row
                    key={row.id}
                    row={row}
                    selected={row.id === selectedId}
                    onSelect={() => onSelect(row.id)}
                  />
                ))}
              </ul>
            )}
          </QueryView>
        )}
      </div>
    </Panel>
  )
}
