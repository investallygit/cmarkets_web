import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ConversationFilter,
  ConversationReportDto,
  MessageAttachmentDto,
  MessageDto,
  SendMessageDto,
} from '@/shared/api/contracts'
import { isApiError } from '@/shared/api'
import { messagingApi } from '@/shared/api/endpoints'
import type { MessagePages } from '../lib/live'

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filter: ConversationFilter) => [...conversationKeys.lists(), filter] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  messages: (id: string) => [...conversationKeys.all, 'messages', id] as const,
  search: (q: string) => [...conversationKeys.all, 'search', q] as const,
}

/**
 * While a file is scanned, the thread asks again until it is available or blocked: the hub tells
 * the verdict (MessageUpdated), this covers an event missed.
 */
const SCAN_REFRESH_MS = 3_000

/** GET /conversations?filter=: the rows of a tab, the latest first. */
export function useConversations(
  filter: ConversationFilter = 'all',
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: conversationKeys.list(filter),
    queryFn: ({ signal }) => messagingApi.conversations(filter, signal),
    enabled,
  })
}

/** GET /conversations/{id}: details, members and the files shared. */
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ''),
    queryFn: ({ signal }) => messagingApi.conversation(id ?? '', signal),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.files.some((file) => file.status === 'scanning') ? SCAN_REFRESH_MS : false,
  })
}

/** GET /conversations/{id}/messages?before=&limit=50: the newest page first, then older ones. */
export function useMessages(id: string | null) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(id ?? ''),
    queryFn: ({ pageParam, signal }) =>
      messagingApi.messages(id ?? '', { before: pageParam, limit: 50 }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.hasMore ? (page.items.at(0)?.id ?? null) : null),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.pages.some((page) =>
        page.items.some((message) =>
          message.attachments.some((file) => file.status === 'scanning'),
        ),
      )
        ? SCAN_REFRESH_MS
        : false,
  })
}

/** The messages of every page loaded, the oldest first. */
export function messagesOf(data: MessagePages | undefined): MessageDto[] {
  return data ? [...data.pages].reverse().flatMap((page) => page.items) : []
}

/** GET /messages/search?q=: the user's messages that hold the words. */
export function useMessageSearch(q: string) {
  const text = q.trim()
  return useQuery({
    queryKey: conversationKeys.search(text),
    queryFn: ({ signal }) => messagingApi.search(text, signal),
    enabled: text.length >= 2,
  })
}

/** After a change: the rows, the details and the thread of the conversation. */
function useRefresh() {
  const queryClient = useQueryClient()
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })
    if (id) {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: conversationKeys.messages(id) })
    }
  }
}

/** POST /conversations: a direct conversation or a group, with its first message. */
export function useStartConversation() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: messagingApi.start,
    onSuccess: (conversation) => refresh(conversation.id),
  })
}

/**
 * POST /conversations/{id}/messages. Refused (403 closed, 409 a request waiting), the conversation
 * is read again: the thread then says why and locks the composer.
 */
export function useSendMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: SendMessageDto) => messagingApi.send(id, input),
    onSuccess: () => refresh(id),
    onError: (error) => {
      if (isApiError(error, 403) || isApiError(error, 409)) refresh(id)
    },
  })
}

/** PUT /conversations/{id}/messages/{messageId}: within 15 minutes of sending. */
export function useEditMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      messagingApi.edit(id, messageId, text),
    onSuccess: () => refresh(id),
  })
}

/** DELETE /conversations/{id}/messages/{messageId}: for every member. */
export function useDeleteMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (messageId: string) => messagingApi.delete(id, messageId),
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/read: read up to a message; tried again twice, or the ✓✓ would wait. */
export function useMarkRead(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => messagingApi.markRead(id, messageId),
    retry: (failures, error) => !isApiError(error, 400) && !isApiError(error, 404) && failures < 2,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) })
    },
  })
}

/** POST /conversations/{id}/accept · /decline: the answer to a contact request. */
export function useAnswerRequest(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (answer: 'accept' | 'decline') => messagingApi.answerRequest(id, answer),
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/mute */
export function useMuteConversation(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (muted: boolean) => messagingApi.mute(id, muted),
    onSuccess: () => refresh(id),
  })
}

/** POST / DELETE /conversations/{id}/members/{userId}: the creator adds, a member leaves. */
export function useGroupMember(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ userId, add }: { userId: string; add: boolean }) =>
      messagingApi.groupMember(id, userId, add),
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/report */
export function useReportConversation(id: string) {
  return useMutation({
    mutationFn: (report: ConversationReportDto) => messagingApi.report(id, report),
  })
}

/** POST /attachments: the file is scanned before it becomes available. */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: messagingApi.upload,
  })
}

/** GET /attachments/{id}: members of the conversation only. */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (attachment: MessageAttachmentDto) => messagingApi.attachment(attachment.id),
  })
}
