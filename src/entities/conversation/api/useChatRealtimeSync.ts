import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatClient, useChatConnection, useChatEvent, useIsJoined } from '@/shared/realtime'
import { toast } from '@/shared/ui/toast'
import { withDeleted, withMessage, type MessagePages } from '../lib/live'
import { resetChatState, setPresence, startTyping, stopTyping } from '../model/chatState'
import { conversationKeys } from './queries'

/**
 * The /hubs/chat hub (spec section 10), connected while the user may write: a new message joins
 * its thread, edits, deletions and read receipts refresh it, and the rows and the count on MSG
 * follow; "typing…" and presence go to the chat state. Mounted once by the app shell.
 */
export function useChatRealtimeSync(enabled: boolean, userId: string | undefined) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const chat = useChatClient()
  const isJoined = useIsJoined()
  useChatConnection(enabled)

  const refresh = (queryKey: readonly unknown[]) => void queryClient.invalidateQueries({ queryKey })

  useChatEvent('MessageReceived', ({ conversationId, message }) => {
    queryClient.setQueryData<MessagePages>(conversationKeys.messages(conversationId), (data) =>
      withMessage(data, message),
    )
    stopTyping(conversationId, message.author.userId)
    // An open thread reads the message of another, which refreshes the rows.
    if (!isJoined(conversationId) || message.author.userId === userId) {
      refresh(conversationKeys.lists())
    }
    if (message.attachments.length > 0) refresh(conversationKeys.detail(conversationId))
  })
  useChatEvent('MessageUpdated', ({ conversationId }) => {
    refresh(conversationKeys.messages(conversationId))
    refresh(conversationKeys.lists())
  })
  useChatEvent('MessageDeleted', ({ conversationId, messageId }) => {
    queryClient.setQueryData<MessagePages>(conversationKeys.messages(conversationId), (data) =>
      withDeleted(data, messageId),
    )
    refresh(conversationKeys.lists())
    refresh(conversationKeys.detail(conversationId))
  })
  useChatEvent('ReadReceipt', ({ conversationId, userId: reader }) => {
    if (reader === userId) {
      // Read in another tab: the unread counts.
      refresh(conversationKeys.lists())
      refresh(conversationKeys.detail(conversationId))
    } else {
      // ✓✓ on the user's messages.
      refresh(conversationKeys.messages(conversationId))
    }
  })
  useChatEvent('TypingIndicator', ({ conversationId, userId: typist }) => {
    if (typist !== userId) startTyping(conversationId, typist)
  })
  useChatEvent('PresenceChanged', ({ userId: person, online }) => setPresence(person, online))
  useChatEvent('ContactRequestReceived', ({ fromType }) => {
    refresh(conversationKeys.lists())
    toast.info(t('messaging.realtime.request', { type: t(`accountTypes.${fromType}`) }))
  })

  // A new connection may have missed events: the conversations are read again.
  useEffect(
    () =>
      chat.onStateChange((state) => {
        if (state !== 'connected') return
        resetChatState()
        void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
      }),
    [chat, queryClient],
  )
  // Nothing of the session stays once it ends.
  useEffect(() => resetChatState, [])
}
