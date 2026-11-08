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
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

/**
 * CMarket.Api/Controllers/Messaging: the conversations of the directory (screen 11), their
 * messages and files, the contact requests, the search. New messages, typing and presence come
 * through the /hubs/chat hub (shared/realtime).
 */
export const messagingRoutes = {
  conversations: route('GET', '/conversations', answer<ConversationSummaryDto[]>()),
  start: route('POST', '/conversations', answer<ConversationDto>()),
  conversation: route('GET', '/conversations/{id}', answer<ConversationDto>()),
  messages: route('GET', '/conversations/{id}/messages', answer<MessagePageDto>()),
  send: route('POST', '/conversations/{id}/messages', answer<MessageDto>()),
  edit: route('PUT', '/conversations/{id}/messages/{messageId}', answer<MessageDto>()),
  delete: route('DELETE', '/conversations/{id}/messages/{messageId}'),
  markRead: route('POST', '/conversations/{id}/read'),
  accept: route('POST', '/conversations/{id}/accept', answer<unknown>()),
  decline: route('POST', '/conversations/{id}/decline', answer<unknown>()),
  mute: route('POST', '/conversations/{id}/mute', answer<ConversationSummaryDto>()),
  addMember: route('POST', '/conversations/{id}/members/{userId}', answer<unknown>()),
  removeMember: route('DELETE', '/conversations/{id}/members/{userId}', answer<unknown>()),
  report: route('POST', '/conversations/{id}/report'),
  search: route('GET', '/messages/search', answer<MessageSearchHitDto[]>()),
  upload: route('POST', '/attachments', answer<MessageAttachmentDto>()),
  attachment: route('GET', '/attachments/{id}', answer<Blob>()),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const messagingApi = {
  /** The rows of a tab, the latest first. */
  conversations: (filter: ConversationFilter, signal?: AbortSignal) =>
    send(messagingRoutes.conversations, { query: { filter }, signal }),
  /** A direct conversation or a group, with its first message. */
  start: (input: NewConversationDto) => send(messagingRoutes.start, { body: input }),
  /** Details, members and the files shared. */
  conversation: (id: string, signal?: AbortSignal) =>
    send(messagingRoutes.conversation, of(id, signal)),
  /** A page of 50 or so, the messages before `before` (the newest page without it). */
  messages: (id: string, page: { before: string | null; limit: number }, signal?: AbortSignal) =>
    send(messagingRoutes.messages, { ...of(id, signal), query: page }),
  send: (id: string, input: SendMessageDto) =>
    send(messagingRoutes.send, { params: { id }, body: input }),
  /** Within 15 minutes of sending. */
  edit: (id: string, messageId: string, text: string) =>
    send(messagingRoutes.edit, { params: { id, messageId }, body: { text } }),
  /** For every member. */
  delete: (id: string, messageId: string) =>
    send(messagingRoutes.delete, { params: { id, messageId } }),
  /** Read up to a message. */
  markRead: (id: string, messageId: string) =>
    send(messagingRoutes.markRead, { params: { id }, body: { messageId } }),
  /** The answer to a contact request. */
  answerRequest: (id: string, answer: 'accept' | 'decline') =>
    send(answer === 'accept' ? messagingRoutes.accept : messagingRoutes.decline, {
      params: { id },
    }),
  mute: (id: string, muted: boolean) =>
    send(messagingRoutes.mute, { params: { id }, body: { muted } }),
  /** The creator adds a member; a member leaves, or the creator takes one out. */
  groupMember: (id: string, userId: string, add: boolean) =>
    send(add ? messagingRoutes.addMember : messagingRoutes.removeMember, {
      params: { id, userId },
    }),
  report: (id: string, report: ConversationReportDto) =>
    send(messagingRoutes.report, { params: { id }, body: report }),
  /** The user's messages that hold the words. */
  search: (q: string, signal?: AbortSignal) =>
    send(messagingRoutes.search, { query: { q }, signal }),
  /** The file is scanned before it becomes available. */
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return sendForm(messagingRoutes.upload, form)
  },
  /** Members of the conversation only; 409 while the file is scanned. */
  attachment: (id: string) => sendBlob(messagingRoutes.attachment, { params: { id } }),
}
