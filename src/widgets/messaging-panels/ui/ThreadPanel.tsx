import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  byDay,
  messagesOf,
  relativeDay,
  useAnswerRequest,
  useConversation,
  useMarkRead,
  useMessages,
} from '@/entities/conversation'
import { useContactPermission, useProfile } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import { Composer } from '@/features/send-message'
import { isApiError } from '@/shared/api'
import type { ConversationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty, PanelError, PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { MessageBubble } from './MessageBubble'

interface ThreadPanelProps {
  conversationId: string | null
  /** A new conversation with this user, until its first message. */
  to: string | null
  /** A message found by a search, shown and framed. */
  highlightId: string | null
  onStarted: (conversationId: string) => void
  /** A request declined disappears from the list. */
  onClosed: () => void
}

const NOTE = 'mx-3 mt-3 border px-3 py-2 font-sans text-label'

/** Why the user cannot write, or the request to answer. */
function ThreadNotice({
  conversation,
  onClosed,
}: {
  conversation: ConversationDto
  onClosed: () => void
}) {
  const { t } = useTranslation()
  const answer = useAnswerRequest(conversation.id)
  const name = conversation.counterpart?.displayName ?? conversation.title
  if (conversation.state === 'requestReceived') {
    return (
      <div className={`${NOTE} flex flex-col gap-2 border-warning/60 bg-warning/10`}>
        <p className="text-warning">{t('messaging.thread.requestReceived', { name })}</p>
        <span className="flex gap-2">
          <Button
            variant="primary"
            busy={answer.isPending && answer.variables === 'accept'}
            onClick={() =>
              answer.mutate('accept', {
                onSuccess: () => toast.success(t('messaging.thread.accepted')),
              })
            }
          >
            {t('messaging.thread.accept')}
          </Button>
          <Button
            busy={answer.isPending && answer.variables === 'decline'}
            onClick={() =>
              answer.mutate('decline', {
                onSuccess: () => {
                  toast.info(t('messaging.thread.declined'))
                  onClosed()
                },
              })
            }
          >
            {t('messaging.thread.decline')}
          </Button>
        </span>
      </div>
    )
  }
  const message =
    conversation.state === 'requestSent'
      ? t('messaging.thread.requestSent', { name })
      : conversation.state !== 'closed'
        ? null
        : conversation.blocked === 'byMe'
          ? t('messaging.thread.blockedByMe', { name })
          : conversation.blocked === 'byThem'
            ? t('messaging.thread.blockedByThem')
            : t('messaging.thread.left')
  return message ? <p className={`${NOTE} text-secondary`}>{message}</p> : null
}

/** The messages of a conversation under the separators of their days, then the composer. */
function Conversation({
  conversationId,
  highlightId,
  onClosed,
}: Omit<ThreadPanelProps, 'to' | 'onStarted' | 'conversationId'> & { conversationId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const user = useCurrentUser()
  const details = useConversation(conversationId)
  const history = useMessages(conversationId)
  const markRead = useMarkRead(conversationId)
  const scroller = useRef<HTMLDivElement>(null)
  const messages = messagesOf(history.data)
  const last = messages.at(-1)
  const lastId = last?.id
  const conversation = details.data
  const marked = useRef<string | null>(null)
  const today = format.day(useNow(60_000))

  const ready = Boolean(conversation) && !history.isPending

  // The newest message shows, or the one a search found, once the thread is drawn.
  useEffect(() => {
    if (!lastId || !ready) return
    const found = highlightId ? document.getElementById(`message-${highlightId}`) : null
    if (found) found.scrollIntoView({ block: 'center' })
    else if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [lastId, highlightId, ready])

  // Read up to the last message once it shows.
  useEffect(() => {
    if (!last || !conversation || conversation.unreadCount === 0) return
    if (marked.current === last.id) return
    marked.current = last.id
    markRead.mutate(last.id)
  }, [last, conversation, markRead])

  if (details.isError) {
    return isApiError(details.error, 404) ? (
      <PanelEmpty message={t('messaging.thread.notFound')} />
    ) : (
      <PanelError error={details.error} onRetry={() => void details.refetch()} />
    )
  }
  if (!conversation || history.isPending) return <PanelLoading />

  return (
    <>
      <ThreadNotice conversation={conversation} onClosed={onClosed} />
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {history.hasNextPage && (
          <div className="mb-3 flex justify-center">
            <Button
              size="sm"
              busy={history.isFetchingNextPage}
              onClick={() => void history.fetchNextPage()}
            >
              {t('messaging.thread.earlier')}
            </Button>
          </div>
        )}
        {byDay(messages, format.day).map(({ day, messages: ofDay }) => {
          const relative = relativeDay(day, today)
          return (
            <section key={day} className="flex flex-col gap-3 pb-3">
              <h3 className="text-center font-mono text-title text-secondary uppercase">
                {relative ? t(`messaging.thread.${relative}`) : format.date(`${day}T12:00:00Z`)}
              </h3>
              <ol className="flex flex-col gap-3">
                {ofDay.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    own={message.author.userId === user.id}
                    showAuthor={conversation.kind === 'group'}
                    highlighted={message.id === highlightId}
                  />
                ))}
              </ol>
            </section>
          )
        })}
      </div>
      <Composer conversationId={conversation.id} disabled={!conversation.canWrite} />
    </>
  )
}

/** A conversation not started yet: the rule of the person says what the first message is. */
function NewConversation({ to, onStarted }: { to: string; onStarted: (id: string) => void }) {
  const { t } = useTranslation()
  const profile = useProfile(to)
  const permission = useContactPermission(to)
  if (profile.isError) return <PanelError error={profile.error} />
  if (!profile.data || !permission.data) return <PanelLoading />
  const name = profile.data.displayName
  const mode = permission.data.mode
  return (
    <>
      <p className={`${NOTE} ${mode === 'none' ? 'text-down' : 'text-secondary'}`}>
        {mode === 'direct'
          ? t('messaging.thread.newDirect')
          : mode === 'request'
            ? t('messaging.thread.newRequest', { name })
            : t('messaging.thread.newClosed', { name })}
      </p>
      <div className="min-h-0 flex-1" />
      <Composer conversationId={null} to={to} disabled={mode === 'none'} onStarted={onStarted} />
    </>
  )
}

/**
 * MSG, centre (spec section 9, screen 11): "K. ATANGANA · ANALYST", the history 50 messages at
 * a time with its dates, the request to answer, and the composer.
 */
export function ThreadPanel({
  conversationId,
  to,
  highlightId,
  onStarted,
  onClosed,
}: ThreadPanelProps) {
  const { t } = useTranslation()
  const details = useConversation(conversationId)
  const target = useProfile(conversationId ? null : to)
  const conversation = details.data
  const title = conversation
    ? conversation.kind === 'group'
      ? `${conversation.title} · ${t('messaging.thread.members', { count: conversation.memberCount })}`
      : `${conversation.title} · ${t(`accountBadge.${conversation.counterpart?.accountType ?? 'student'}`)}`
    : target.data
      ? t('messaging.thread.newTo', { name: target.data.displayName })
      : t('panels.thread')

  return (
    <Panel title={title} code="MSG" bodyClassName="flex flex-col">
      {conversationId ? (
        <Conversation
          key={conversationId}
          conversationId={conversationId}
          highlightId={highlightId}
          onClosed={onClosed}
        />
      ) : to ? (
        <NewConversation key={to} to={to} onStarted={onStarted} />
      ) : (
        <PanelEmpty message={t('messaging.thread.select')} />
      )}
    </Panel>
  )
}
