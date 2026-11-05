import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CONVERSATION_FILTERS, useConversations } from '@/entities/conversation'
import { mayWriteMessages, useCurrentUser } from '@/entities/session'
import { ScreenWorkspace } from '@/features/workspace-layout'
import { useSearchParamsUpdate, withParams } from '@/shared/routes/useSearchParamsUpdate'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { ConversationListPanel, ParticipantPanel, ThreadPanel } from '@/widgets/messaging-panels'
import { MESSAGES_LAYOUT } from '../config/layout'

/**
 * MSG, the messaging (spec sections 9 and 15, screen 11): the conversations, the thread and the
 * participant. The URL holds the conversation open (?c=), the message a search found (&m=), the
 * tab, or the person a new conversation starts with (?to=), as Contact in NET links it; an open
 * conversation with that person opens instead. The first conversation opens when none is chosen.
 */
export function MessagesPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [params, update] = useSearchParamsUpdate()
  const patch = (values: Record<string, string>) => update((current) => withParams(current, values))
  const writes = mayWriteMessages(user)
  const all = useConversations('all', { enabled: writes })
  const filter = CONVERSATION_FILTERS.find((value) => value === params.get('filter')) ?? 'all'
  const to = params.get('to')
  const existing = to
    ? all.data?.find((row) => row.kind === 'direct' && row.counterpart?.userId === to)
    : undefined
  const existingId = existing?.id

  useEffect(() => {
    if (existingId) {
      update((current) => withParams(current, { c: existingId, to: '', m: '' }))
    }
  }, [existingId, update])

  // The route asks for messaging: what remains is a status waiting for an Admin.
  if (!writes) return <PanelEmpty message={t('messaging.awaitingApproval')} />

  const newTo = to && all.data && !existing ? to : null
  const conversationId = params.get('c') ?? (to ? null : (all.data?.at(0)?.id ?? null))
  const panels = {
    conversations: (
      <ConversationListPanel
        filter={filter}
        onFilter={(value) => patch({ filter: value === 'all' ? '' : value })}
        selectedId={conversationId}
        onSelect={(id, messageId) => patch({ c: id, m: messageId ?? '', to: '' })}
        onNew={(target) =>
          'to' in target
            ? patch({ to: target.to, c: '', m: '' })
            : patch({ c: target.conversationId, to: '', m: '' })
        }
      />
    ),
    thread: (
      <ThreadPanel
        conversationId={conversationId}
        to={conversationId ? null : newTo}
        highlightId={params.get('m')}
        onStarted={(id) => patch({ c: id, to: '' })}
        onClosed={() => patch({ c: '', m: '' })}
      />
    ),
    participant: (
      <ParticipantPanel
        conversationId={conversationId}
        to={conversationId ? null : newTo}
        onLeft={() => patch({ c: '', m: '' })}
      />
    ),
  }

  return <ScreenWorkspace screenId="MSG" defaultLayout={MESSAGES_LAYOUT} panels={panels} />
}
