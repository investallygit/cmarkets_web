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
  useOnline,
  useTypingUsers,
} from '@/entities/conversation'
import { useContactPermission, useProfile } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import { Composer } from '@/features/send-message'
import { isApiError } from '@/shared/api'
import type { ConversationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'
import { usePageVisible } from '@/shared/lib/usePageVisible'
import { useJoinConversation } from '@/shared/realtime'
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

/** "K. Atangana is typing…" under the last message, as the hub tells it (TypingIndicator). */
function Typing({ conversation }: { conversation: ConversationDto }) {
  const { t } = useTranslation()
  const names = useTypingUsers(conversation.id).flatMap((userId) => {
    const member = conversation.members.find((person) => person.userId === userId)
    return member ? [member.displayName] : []
  })
  const [first, second] = names
  return (
    <p role="status" className="min-h-4 font-sans text-data text-secondary">
      {names.length === 0
        ? null
        : names.length === 1
          ? t('messaging.thread.typingOne', { name: first })
          : names.length === 2
            ? t('messaging.thread.typingTwo', { first, second })
            : t('messaging.thread.typingMany')}
    </p>
  )
}

/** Close enough to the end of the thread to follow the new messages. */
const END_MARGIN_PX = 48

/**
 * The messages of a conversation under the separators of their days, then the composer. The
 * thread joins the conversation on the hub while it shows: new messages, "typing…", ✓✓.
 */
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
  const lastOwn = last?.author.userId === user.id
  const conversation = details.data
  /** The last message drawn at the end, and whether the user reads the end. */
  const shown = useRef<string | null>(null)
  const atEnd = useRef(true)
  /** The last message when the thread showed, and the last one marked read. */
  const opened = useRef<string | null>(null)
  const marked = useRef<string | null>(null)
  /** The message a search found, once framed. */
  const framed = useRef<string | null>(null)
  const today = format.day(useNow(60_000))
  const visible = usePageVisible()
  useJoinConversation(conversationId)

  const ready = Boolean(conversation) && !history.isPending
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = history
  const highlightLoaded = highlightId !== null && messages.some(({ id }) => id === highlightId)

  // The message a search found, framed in the middle: older pages load until it is there.
  useEffect(() => {
    if (!ready || !highlightId || framed.current === highlightId) return
    if (!highlightLoaded) {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
      return
    }
    framed.current = highlightId
    document.getElementById(`message-${highlightId}`)?.scrollIntoView({ block: 'center' })
  }, [highlightId, highlightLoaded, ready, hasNextPage, isFetchingNextPage, fetchNextPage])

  // The newest message shows once the thread is drawn, then each new one while the user reads the
  // end, or sent it; someone reading older messages stays where they are.
  useEffect(() => {
    if (!lastId || !ready || shown.current === lastId) return
    const first = shown.current === null
    shown.current = lastId
    if (first && highlightId) return
    if ((first || atEnd.current || lastOwn) && scroller.current) {
      scroller.current.scrollTop = scroller.current.scrollHeight
    }
  }, [lastId, lastOwn, highlightId, ready])

  // Read up to the last message: what was unread when the thread opened, then each message of
  // another that the hub brings while it shows; in a hidden tab, once the user comes back.
  useEffect(() => {
    if (!last || !conversation) return
    opened.current ??= last.id
    if (!visible) return
    const arrived = last.id !== opened.current && !lastOwn
    if ((!arrived && conversation.unreadCount === 0) || marked.current === last.id) return
    marked.current = last.id
    markRead.mutate(last.id)
  }, [last, lastOwn, conversation, markRead, visible])

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
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget
          atEnd.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < END_MARGIN_PX
        }}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
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
        <Typing conversation={conversation} />
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
  const counterpart = conversation?.counterpart
  const online = useOnline(counterpart?.userId, counterpart?.online)
  const title = conversation
    ? conversation.kind === 'group'
      ? `${conversation.title} · ${t('messaging.thread.members', { count: conversation.memberCount })}`
      : [
          conversation.title,
          t(`accountBadge.${counterpart?.accountType ?? 'student'}`),
          ...(online ? [t('messaging.thread.online')] : []),
        ].join(' · ')
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
