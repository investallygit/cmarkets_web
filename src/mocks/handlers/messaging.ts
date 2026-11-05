import { http, HttpResponse } from 'msw'
import type {
  ConversationFilter,
  ConversationReportDto,
  ConversationReportReason,
  ConversationSummaryDto,
  MessagePageDto,
  MessageSearchHitDto,
  SharedObjectDto,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import {
  anyAccount,
  attachmentDto,
  attachmentStore,
  contactModeFor,
  conversationDto,
  conversationReportStore,
  conversationStore,
  conversationSummary,
  currentAccount,
  currentUser,
  directConversation,
  fileContent,
  isClientAccount,
  isVisibleTo,
  keepFileContent,
  mayMessage,
  messageDto,
  messageStore,
  messagesOf,
  sharedChart,
  sharedPublication,
  sharedSecurity,
} from '../db'
import { api, latency, noContent, problem } from '../lib/http'
import { newId } from '../lib/ids'
import {
  activeMembers,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_TYPES,
  dailyConversations,
  extensionOf,
  GROUP_MAX_MEMBERS,
  GROUP_TITLE_MAX_LENGTH,
  inFilter,
  isEditable,
  matchExcerpt,
  memberOf,
  MESSAGE_MAX_LENGTH,
  openedToday,
  pageOf,
  PAGE_LIMIT,
  readMessage,
  SCAN_MS,
  type MessageInput,
  type StoredConversation,
  type StoredMessage,
} from '../lib/messaging'
import { normalize } from '../lib/text'

/**
 * MSG (screen 11): conversations, their messages, contact requests, groups, files and reports
 * (spec sections 10 and 15). The hub /hubs/chat comes with step 17 of the roadmap.
 */

const FILTERS: readonly ConversationFilter[] = ['all', 'unread', 'requests', 'groups']
const REPORT_REASONS: readonly ConversationReportReason[] = [
  'spam',
  'harassment',
  'scam',
  'inappropriate',
  'other',
]
const MAX_COMMENT_LENGTH = 1000

type Errors = Record<string, string[]>
const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
const notFound = () => problem(404, 'Conversation not found')

/** The user writes: a client with messages:write, whose status an Admin approved if needed. */
function refused() {
  const account = currentAccount()
  if (!currentUser().permissions.includes('messages:write')) {
    return problem(403, 'Forbidden', 'Your account type has no messaging.')
  }
  if (!mayMessage(account)) {
    return problem(403, 'Awaiting approval', 'Messaging opens once an Admin approves your status.')
  }
  return null
}

/** A conversation of the user, the conversations to write back, or the answer to give. */
function ownConversation(id: unknown) {
  const conversations = conversationStore.read()
  const conversation = conversations.find((candidate) => candidate.id === id)
  const userId = currentAccount().id
  if (!conversation || !isVisibleTo(conversation, userId)) return { error: notFound() }
  return { conversations, conversation, userId }
}

const touch = (conversation: StoredConversation, at: string) => {
  conversation.updatedAt = at
}

/** The object a message shares, as it is now. */
function snapshot(input: MessageInput['shared'], at: string): SharedObjectDto | null {
  if (!input) return null
  if (input.type === 'security') return sharedSecurity(input.securityId, at)
  if (input.type === 'chart') return sharedChart(input.securityId, input.period, Date.parse(at))
  return sharedPublication(input.publicationId)
}

/** Checks the files and the object, then adds the message; the author has read it. */
function addMessage(
  conversation: StoredConversation,
  authorId: string,
  input: MessageInput,
): { error: Response } | { message: StoredMessage } {
  const sentAt = new Date().toISOString()
  const attachments = attachmentStore.read()
  const used = new Set(messageStore.read().flatMap((message) => message.attachmentIds))
  const unknown = input.attachmentIds.filter(
    (id) =>
      used.has(id) ||
      !attachments.some((attachment) => attachment.id === id && attachment.ownerId === authorId),
  )
  if (unknown.length > 0) {
    return { error: invalid('Invalid message', { attachmentIds: ['Upload the files first.'] }) }
  }
  const shared = snapshot(input.shared, sentAt)
  if (input.shared && !shared) {
    return { error: invalid('Invalid message', { shared: ['Nothing to share under this id.'] }) }
  }
  const message: StoredMessage = {
    id: newId('message'),
    conversationId: conversation.id,
    authorId,
    text: input.text,
    sentAt,
    editedAt: null,
    deletedAt: null,
    attachmentIds: input.attachmentIds,
    shared,
  }
  messageStore.write([...messageStore.read(), message])
  const member = memberOf(conversation, authorId)
  if (member) member.lastReadAt = sentAt
  touch(conversation, sentAt)
  return { message }
}

const dayOf = (iso: string) => toMarketDay(Date.parse(iso))

/** A file of a form, whichever realm made it (the browser's, or Node's in the tests). */
const isFile = (value: unknown): value is File =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as File).name === 'string' &&
  typeof (value as File).arrayBuffer === 'function'

/** POST /conversations: a direct one, or a group with a title. */
function startConversation(body: Record<string, unknown>) {
  const sender = currentAccount()
  const ids = Array.isArray(body.participantIds)
    ? [...new Set(body.participantIds.filter((id): id is string => typeof id === 'string'))]
    : []
  const participants = ids.filter((id) => id !== sender.id)
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const { errors, message } = readMessage(body.message)
  if (participants.length === 0) errors.participantIds = ['Choose at least one person.']
  const group = participants.length > 1 || Boolean(title)
  if (group && !title) errors.title = ['Name the group.']
  if (title.length > GROUP_TITLE_MAX_LENGTH) {
    errors.title = [`${GROUP_TITLE_MAX_LENGTH} characters at most.`]
  }
  if (participants.length + 1 > GROUP_MAX_MEMBERS) {
    errors.participantIds = [`${GROUP_MAX_MEMBERS} members at most, you included.`]
  }
  if (Object.keys(errors).length > 0) return invalid('Invalid conversation', errors)

  const accounts = participants.map((id) => anyAccount(id))
  if (accounts.some((account) => !account || !isClientAccount(account))) {
    return problem(404, 'Unknown participant', 'One of the people is not in the directory.')
  }
  const modes = accounts.map((account) => (account ? contactModeFor(sender, account) : 'none'))
  const conversations = conversationStore.read()

  if (!group) {
    const recipient = accounts[0]
    if (!recipient) return problem(404, 'Unknown participant')
    const existing = directConversation(sender.id, recipient.id)
    if (existing) {
      const state = conversationSummary(existing, sender.id).state
      if (state !== 'open') {
        return problem(409, 'Request waiting', 'A contact request between you waits for an answer.')
      }
      const added = addMessage(existing, sender.id, message)
      if ('error' in added) return added.error
      conversationStore.write(conversations)
      return HttpResponse.json(conversationDto(existing, sender.id), { status: 200 })
    }
    if (modes[0] === 'none') {
      return problem(
        403,
        'Contact not open',
        `${recipient.displayName} does not take messages from your account type.`,
      )
    }
  } else if (modes.some((mode) => mode !== 'direct')) {
    // A group creator adds only the people they may write to at once (spec section 15).
    const names = accounts.filter((_, index) => modes[index] !== 'direct')
    return problem(
      403,
      'Contact not open',
      `${names.map((account) => account?.displayName).join(', ')} cannot be added to a group by you.`,
    )
  }

  const now = new Date().toISOString()
  const limit = dailyConversations(sender.accountType)
  if (openedToday(conversations, sender.id, dayOf(now), dayOf) >= limit) {
    return problem(429, 'Daily limit', `${limit} new conversations a day at most.`)
  }
  const conversation: StoredConversation = {
    id: newId('conversation'),
    kind: group ? 'group' : 'direct',
    title: group ? title : null,
    createdBy: sender.id,
    createdAt: now,
    members: [sender.id, ...participants].map((userId) => ({
      userId,
      joinedAt: now,
      leftAt: null,
      lastReadAt: null,
      muted: false,
    })),
    request: !group && modes[0] === 'request' ? { to: participants[0], status: 'pending' } : null,
    updatedAt: now,
  }
  const added = addMessage(conversation, sender.id, message)
  if ('error' in added) return added.error
  conversationStore.write([...conversations, conversation])
  return HttpResponse.json(conversationDto(conversation, sender.id), { status: 201 })
}

export const messagingHandlers = [
  http.get(api('/conversations'), async ({ request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const query = new URL(request.url).searchParams
    const filter = FILTERS.find((candidate) => candidate === query.get('filter')) ?? 'all'
    const q = normalize(query.get('q') ?? '')
    const userId = currentAccount().id
    const rows = conversationStore
      .read()
      .filter((conversation) => isVisibleTo(conversation, userId))
      .map((conversation) => ({ conversation, row: conversationSummary(conversation, userId) }))
      .filter(({ row }) => inFilter(filter, row))
      .filter(
        ({ conversation, row }) =>
          !q ||
          normalize(row.title).includes(q) ||
          messagesOf(conversation.id).some(
            (message) => message.deletedAt === null && normalize(message.text).includes(q),
          ),
      )
      .map(({ row }) => row)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    return HttpResponse.json<ConversationSummaryDto[]>(rows)
  }),

  http.post(api('/conversations'), async ({ request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const body = (await request.json()) as Record<string, unknown>
    return startConversation(body ?? {})
  }),

  http.get(api('/conversations/:id'), async ({ params }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    return HttpResponse.json(conversationDto(found.conversation, found.userId))
  }),

  http.get(api('/conversations/:id/messages'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const query = new URL(request.url).searchParams
    const limit = Math.min(PAGE_LIMIT, Math.max(1, Number(query.get('limit')) || PAGE_LIMIT))
    const page = pageOf(messagesOf(found.conversation.id), query.get('before'), limit)
    return HttpResponse.json<MessagePageDto>({
      items: page.items.map((message) => messageDto(message, found.conversation, found.userId)),
      hasMore: page.hasMore,
    })
  }),

  http.post(api('/conversations/:id/messages'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const { conversation, conversations, userId } = found
    const details = conversationDto(conversation, userId)
    if (!details.canWrite) {
      return details.state === 'closed'
        ? problem(403, 'Conversation closed', 'Nobody can write in this conversation any more.')
        : problem(409, 'Request waiting', 'The contact request waits for an answer.')
    }
    const { errors, message } = readMessage(await request.json())
    if (Object.keys(errors).length > 0) return invalid('Invalid message', errors)
    const added = addMessage(conversation, userId, message)
    if ('error' in added) return added.error
    conversationStore.write(conversations)
    return HttpResponse.json(messageDto(added.message, conversation, userId), { status: 201 })
  }),

  http.put(api('/conversations/:id/messages/:messageId'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const messages = messageStore.read()
    const message = messages.find(
      (candidate) =>
        candidate.id === params.messageId && candidate.conversationId === found.conversation.id,
    )
    if (!message) return problem(404, 'Message not found')
    if (!isEditable(message, found.userId, Date.now())) {
      return problem(403, 'Not editable', 'Only your own messages, within 15 minutes of sending.')
    }
    const body = (await request.json()) as { text?: unknown }
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const alone = message.attachmentIds.length === 0 && message.shared === null
    if ((!text && alone) || text.length > MESSAGE_MAX_LENGTH) {
      return invalid('Invalid message', {
        text: [text ? `${MESSAGE_MAX_LENGTH} characters at most.` : 'Write a message.'],
      })
    }
    message.text = text
    message.editedAt = new Date().toISOString()
    messageStore.write(messages)
    return HttpResponse.json(messageDto(message, found.conversation, found.userId))
  }),

  // Deleted for everyone: the others read that it was.
  http.delete(api('/conversations/:id/messages/:messageId'), async ({ params }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const messages = messageStore.read()
    const message = messages.find(
      (candidate) =>
        candidate.id === params.messageId && candidate.conversationId === found.conversation.id,
    )
    if (!message) return problem(404, 'Message not found')
    if (message.authorId !== found.userId) {
      return problem(403, 'Forbidden', 'Only your own messages.')
    }
    message.deletedAt = new Date().toISOString()
    message.text = ''
    messageStore.write(messages)
    return noContent()
  }),

  http.post(api('/conversations/:id/read'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const body = (await request.json()) as { messageId?: unknown }
    const message = messagesOf(found.conversation.id).find(
      (candidate) => candidate.id === body.messageId,
    )
    if (!message) return invalid('Invalid read', { messageId: ['A message of the conversation.'] })
    const member = memberOf(found.conversation, found.userId)
    if (member && (member.lastReadAt === null || member.lastReadAt < message.sentAt)) {
      member.lastReadAt = message.sentAt
      conversationStore.write(found.conversations)
    }
    return noContent()
  }),

  ...(['accept', 'decline'] as const).map((answer) =>
    http.post(api(`/conversations/:id/${answer}`), async ({ params }) => {
      await latency()
      const denied = refused()
      if (denied) return denied
      const found = ownConversation(params.id)
      if ('error' in found) return found.error
      const { conversation, conversations, userId } = found
      if (conversation.request?.to !== userId || conversation.request.status !== 'pending') {
        return problem(409, 'No request', 'No contact request waits for your answer here.')
      }
      // A decline is not told: the sender still sees the request waiting.
      conversation.request.status = answer === 'accept' ? 'accepted' : 'declined'
      if (answer === 'accept') touch(conversation, new Date().toISOString())
      conversationStore.write(conversations)
      return answer === 'accept'
        ? HttpResponse.json(conversationDto(conversation, userId))
        : noContent()
    }),
  ),

  http.post(api('/conversations/:id/mute'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const body = (await request.json()) as { muted?: unknown }
    const member = memberOf(found.conversation, found.userId)
    if (member) member.muted = body.muted !== false
    conversationStore.write(found.conversations)
    return HttpResponse.json(conversationSummary(found.conversation, found.userId))
  }),

  // The creator adds people they may write to at once.
  http.post(api('/conversations/:id/members/:userId'), async ({ params }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const { conversation, conversations, userId } = found
    if (conversation.kind !== 'group') return problem(409, 'Not a group')
    if (conversation.createdBy !== userId) {
      return problem(403, 'Forbidden', 'Only the creator of the group adds members.')
    }
    const account = anyAccount(String(params.userId))
    if (!account || !isClientAccount(account)) return problem(404, 'Unknown participant')
    if (contactModeFor(currentAccount(), account) !== 'direct') {
      return problem(403, 'Contact not open', `${account.displayName} cannot be added by you.`)
    }
    const member = memberOf(conversation, account.id)
    if (member?.leftAt === null) return problem(409, 'Already a member')
    if (activeMembers(conversation).length >= GROUP_MAX_MEMBERS) {
      return problem(409, 'Group full', `${GROUP_MAX_MEMBERS} members at most.`)
    }
    const now = new Date().toISOString()
    if (member) {
      member.leftAt = null
      member.joinedAt = now
    } else {
      conversation.members.push({
        userId: account.id,
        joinedAt: now,
        leftAt: null,
        lastReadAt: null,
        muted: false,
      })
    }
    touch(conversation, now)
    conversationStore.write(conversations)
    return HttpResponse.json(conversationDto(conversation, userId))
  }),

  // A member leaves; the creator takes someone out.
  http.delete(api('/conversations/:id/members/:userId'), async ({ params }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const { conversation, conversations, userId } = found
    if (conversation.kind !== 'group') return problem(409, 'Not a group')
    const target = String(params.userId)
    if (target !== userId && conversation.createdBy !== userId) {
      return problem(403, 'Forbidden', 'Only the creator of the group takes members out.')
    }
    const member = memberOf(conversation, target)
    if (!member || member.leftAt !== null) return problem(404, 'Not a member')
    member.leftAt = new Date().toISOString()
    conversationStore.write(conversations)
    return noContent()
  }),

  http.post(api('/conversations/:id/report'), async ({ params, request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const found = ownConversation(params.id)
    if ('error' in found) return found.error
    const body = (await request.json()) as Partial<ConversationReportDto>
    const reason = REPORT_REASONS.find((candidate) => candidate === body.reason)
    const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
    const errors: Errors = {}
    if (!reason) errors.reason = ['Choose a reason.']
    if (reason === 'other' && !comment) errors.comment = ['Say what is wrong.']
    if (comment.length > MAX_COMMENT_LENGTH) {
      errors.comment = [`${MAX_COMMENT_LENGTH} characters at most.`]
    }
    if (!reason || Object.keys(errors).length > 0) return invalid('Invalid report', errors)
    const reports = conversationReportStore.read()
    if (
      reports.some(
        (report) =>
          report.conversationId === found.conversation.id && report.reporterId === found.userId,
      )
    ) {
      return problem(409, 'Already reported', 'You already reported this conversation.')
    }
    conversationReportStore.write([
      ...reports,
      {
        id: newId('conversation-report'),
        conversationId: found.conversation.id,
        reporterId: found.userId,
        reason,
        comment,
        at: new Date().toISOString(),
      },
    ])
    return noContent()
  }),

  // Scanned before use: available after a moment, or blocked if the scan finds a virus.
  http.post(api('/attachments'), async ({ request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const file = (await request.formData()).get('file')
    if (!isFile(file)) return invalid('Invalid file', { file: ['Choose a file.'] })
    const contentType = ATTACHMENT_TYPES[extensionOf(file.name)]
    if (!contentType) {
      return invalid('Invalid file', { file: ['PDF, XLSX, CSV, PNG or JPEG.'] })
    }
    if (file.size > ATTACHMENT_MAX_BYTES)
      return invalid('Invalid file', { file: ['10 MB at most.'] })
    const now = Date.now()
    const attachment = {
      id: newId('attachment'),
      ownerId: currentAccount().id,
      fileName: file.name,
      size: file.size,
      contentType,
      uploadedAt: new Date(now).toISOString(),
      availableAt: new Date(now + SCAN_MS).toISOString(),
      // The EICAR test file of the antivirus vendors, by its name in the prototype.
      infected: /eicar/i.test(file.name),
    }
    keepFileContent(attachment.id, file)
    attachmentStore.write([...attachmentStore.read(), attachment])
    return HttpResponse.json(attachmentDto(attachment, now), { status: 201 })
  }),

  // Members of a conversation that holds the file only, once scanned.
  http.get(api('/attachments/:id'), async ({ params }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const attachment = attachmentStore.read().find((candidate) => candidate.id === params.id)
    const userId = currentAccount().id
    if (!attachment) return problem(404, 'File not found')
    const conversationIds = new Set(
      messageStore
        .read()
        .filter(
          (message) => message.deletedAt === null && message.attachmentIds.includes(attachment.id),
        )
        .map((message) => message.conversationId),
    )
    const member = conversationStore
      .read()
      .some(
        (conversation) => conversationIds.has(conversation.id) && isVisibleTo(conversation, userId),
      )
    if (!member && attachment.ownerId !== userId) return problem(404, 'File not found')
    const status = attachmentDto(attachment).status
    if (status === 'scanning') return problem(409, 'Scanning', 'The file is still being scanned.')
    if (status === 'infected')
      return problem(410, 'Blocked', 'The scan found a virus in this file.')
    const content = await fileContent(attachment)
    if (!content) {
      return problem(410, 'Gone', 'The prototype keeps the files sent until the page is reloaded.')
    }
    return new HttpResponse(new Uint8Array(await content.arrayBuffer()), {
      headers: {
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      },
    })
  }),

  http.get(api('/messages/search'), async ({ request }) => {
    await latency()
    const denied = refused()
    if (denied) return denied
    const q = new URL(request.url).searchParams.get('q') ?? ''
    const userId = currentAccount().id
    const conversations = conversationStore
      .read()
      .filter((conversation) => isVisibleTo(conversation, userId))
    const titles = new Map(
      conversations.map((conversation) => [
        conversation.id,
        conversationSummary(conversation, userId).title,
      ]),
    )
    const hits = messageStore
      .read()
      .filter((message) => titles.has(message.conversationId) && message.deletedAt === null)
      .flatMap((message): MessageSearchHitDto[] => {
        const excerpt = matchExcerpt(message.text, q)
        return excerpt
          ? [
              {
                messageId: message.id,
                conversationId: message.conversationId,
                conversationTitle: titles.get(message.conversationId) ?? '',
                authorName: anyAccount(message.authorId)?.displayName ?? '',
                excerpt,
                sentAt: message.sentAt,
              },
            ]
          : []
      })
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
      .slice(0, PAGE_LIMIT)
    return HttpResponse.json(hits)
  }),
]
