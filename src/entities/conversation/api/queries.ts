import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { apiClient } from '@/shared/api'
import type {
  ConversationDto,
  ConversationFilter,
  ConversationReportDto,
  ConversationSummaryDto,
  MessageAttachmentDto,
  MessageDto,
  MessagePageDto,
  MessageSearchHitDto,
  NewConversationDto,
  SendMessageDto,
} from '@/shared/api/contracts'

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filter: ConversationFilter) => [...conversationKeys.lists(), filter] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  messages: (id: string) => [...conversationKeys.all, 'messages', id] as const,
  search: (q: string) => [...conversationKeys.all, 'search', q] as const,
}

const path = (id: string, rest = '') => `/conversations/${encodeURIComponent(id)}${rest}`

/** While a file is scanned, the thread asks again until it is available or blocked. */
const SCAN_REFRESH_MS = 1_000

/** GET /conversations?filter=: the rows of a tab, the latest first. */
export function useConversations(filter: ConversationFilter = 'all') {
  return useQuery({
    queryKey: conversationKeys.list(filter),
    queryFn: ({ signal }) =>
      apiClient.get<ConversationSummaryDto[]>('/conversations', { query: { filter }, signal }),
  })
}

/** GET /conversations/{id}: details, members and the files shared. */
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ''),
    queryFn: ({ signal }) => apiClient.get<ConversationDto>(path(id ?? ''), { signal }),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.files.some((file) => file.status === 'scanning') ? SCAN_REFRESH_MS : false,
  })
}

type MessagePages = InfiniteData<MessagePageDto, unknown>

/** GET /conversations/{id}/messages?before=&limit=50: the newest page first, then older ones. */
export function useMessages(id: string | null) {
  return useInfiniteQuery({
    queryKey: conversationKeys.messages(id ?? ''),
    queryFn: ({ pageParam, signal }) =>
      apiClient.get<MessagePageDto>(path(id ?? '', '/messages'), {
        query: { before: pageParam, limit: 50 },
        signal,
      }),
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
    queryFn: ({ signal }) =>
      apiClient.get<MessageSearchHitDto[]>('/messages/search', { query: { q: text }, signal }),
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
    mutationFn: (input: NewConversationDto) =>
      apiClient.post<ConversationDto>('/conversations', input),
    onSuccess: (conversation) => refresh(conversation.id),
  })
}

/** POST /conversations/{id}/messages */
export function useSendMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (input: SendMessageDto) => apiClient.post<MessageDto>(path(id, '/messages'), input),
    onSuccess: () => refresh(id),
  })
}

/** PUT /conversations/{id}/messages/{messageId}: within 15 minutes of sending. */
export function useEditMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      apiClient.put<MessageDto>(path(id, `/messages/${encodeURIComponent(messageId)}`), { text }),
    onSuccess: () => refresh(id),
  })
}

/** DELETE /conversations/{id}/messages/{messageId}: for every member. */
export function useDeleteMessage(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (messageId: string) =>
      apiClient.delete<void>(path(id, `/messages/${encodeURIComponent(messageId)}`)),
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/read: read up to a message. */
export function useMarkRead(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) => apiClient.post<void>(path(id, '/read'), { messageId }),
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
    mutationFn: (answer: 'accept' | 'decline') => apiClient.post<unknown>(path(id, `/${answer}`)),
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/mute */
export function useMuteConversation(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (muted: boolean) =>
      apiClient.post<ConversationSummaryDto>(path(id, '/mute'), { muted }),
    onSuccess: () => refresh(id),
  })
}

/** POST / DELETE /conversations/{id}/members/{userId}: the creator adds, a member leaves. */
export function useGroupMember(id: string) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ userId, add }: { userId: string; add: boolean }) => {
      const member = path(id, `/members/${encodeURIComponent(userId)}`)
      return add ? apiClient.post<unknown>(member) : apiClient.delete<unknown>(member)
    },
    onSuccess: () => refresh(id),
  })
}

/** POST /conversations/{id}/report */
export function useReportConversation(id: string) {
  return useMutation({
    mutationFn: (report: ConversationReportDto) =>
      apiClient.post<void>(path(id, '/report'), report),
  })
}

/** POST /attachments: the file is scanned before it becomes available. */
export function useUploadAttachment() {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return apiClient.postForm<MessageAttachmentDto>('/attachments', form)
    },
  })
}

/** GET /attachments/{id}: members of the conversation only. */
export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (attachment: MessageAttachmentDto) =>
      apiClient.getBlob(`/attachments/${encodeURIComponent(attachment.id)}`),
  })
}
