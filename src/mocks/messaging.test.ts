import { getResponse } from 'msw'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  ConversationDto,
  ConversationSummaryDto,
  MessageAttachmentDto,
  MessagePageDto,
} from '@/shared/api/contracts'

type Db = typeof import('./db')
type Handlers = typeof import('./handlers/messaging').messagingHandlers

// MSG, the messaging of screen 11.
describe('messaging', () => {
  let db: Db
  let handlers: Handlers

  beforeAll(async () => {
    db = await import('./db')
    const messaging = await import('./handlers/messaging')
    const directory = await import('./handlers/directory')
    handlers = [...messaging.messagingHandlers, ...directory.directoryHandlers]
  })

  /** A form with one file, written out: jsdom's FormData is not Node's. */
  interface Upload {
    upload: string
  }
  const isUpload = (body: unknown): body is Upload =>
    typeof body === 'object' && body !== null && 'upload' in body

  async function call(userId: string, method: string, path: string, body?: unknown) {
    db.setSessionUser(userId)
    const boundary = 'cmarket-test'
    const request = new Request(new URL(`/api/v1${path}`, window.location.origin), {
      method,
      body: isUpload(body)
        ? `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${body.upload}"\r\nContent-Type: application/octet-stream\r\n\r\n%PDF-1.4\r\n--${boundary}--\r\n`
        : body === undefined
          ? undefined
          : JSON.stringify(body),
      headers: {
        'Content-Type': isUpload(body)
          ? `multipart/form-data; boundary=${boundary}`
          : 'application/json',
      },
    })
    const response = await getResponse(handlers, request)
    if (!response) throw new Error(`No route for ${method} ${path}`)
    return response
  }
  const json = async <T>(response: Response) => (await response.json()) as T
  const list = async (userId: string, filter = 'all') =>
    json<ConversationSummaryDto[]>(await call(userId, 'GET', `/conversations?filter=${filter}`))

  it("lists P. Owona's conversations as on the mockup", async () => {
    const rows = await list('user-manager')
    expect(rows.map((row) => [row.title, row.unreadCount, row.state])).toEqual([
      ['K. Atangana', 0, 'open'],
      ['CEMAC rates desk', 2, 'open'],
      ['M. Ndong', 1, 'open'],
      ['S. Mvondo', 0, 'requestReceived'],
      ['R. Tamba', 0, 'open'],
      ['E. Fouda', 0, 'open'],
    ])
    expect(rows[1]).toMatchObject({ kind: 'group', memberCount: 4, counterpart: null })
    expect((await list('user-manager', 'unread')).map((row) => row.title)).toEqual([
      'CEMAC rates desk',
      'M. Ndong',
    ])
    expect((await list('user-manager', 'requests')).map((row) => row.title)).toEqual(['S. Mvondo'])
  })

  it('shows the thread of the mockup, its bond and its read receipts', async () => {
    const page = await json<MessagePageDto>(
      await call('user-manager', 'GET', '/conversations/conversation-atangana/messages'),
    )
    expect(page.hasMore).toBe(false)
    const bond = page.items[5]
    expect(bond.shared).toMatchObject({ type: 'security', code: 'ECMR 6.25% 29', price: 101.4 })
    expect(bond.shared?.type === 'security' && bond.shared.yieldPct).toBeGreaterThan(5)
    // K. Atangana read P. Owona's last message: ✓✓; the replies are not P. Owona's.
    expect(page.items[6]).toMatchObject({ readByAll: true, author: { displayName: 'P. Owona' } })
    expect(page.items[7].readByAll).toBeNull()
    const details = await json<ConversationDto>(
      await call('user-manager', 'GET', '/conversations/conversation-atangana'),
    )
    expect(details.files.map((file) => file.fileName)).toEqual([
      'courbe_cmr_oct26.xlsx',
      'note_dette_cmr.pdf',
    ])
    const pdf = await call('user-manager', 'GET', '/attachments/attachment-note-dette-cmr')
    expect(pdf.headers.get('Content-Type')).toBe('application/pdf')
    // Members only.
    expect((await call('user-ella', 'GET', '/attachments/attachment-note-dette-cmr')).status).toBe(
      404,
    )
  })

  it('keeps a request waiting, and does not tell its sender it was declined', async () => {
    const sent = await list('user-student')
    expect(sent.find((row) => row.id === 'conversation-mvondo')?.state).toBe('requestSent')
    const again = await call(
      'user-student',
      'POST',
      '/conversations/conversation-mvondo/messages',
      {
        text: 'Hello again',
      },
    )
    expect(again.status).toBe(409)
    expect(
      (await call('user-manager', 'POST', '/conversations/conversation-mvondo/decline')).status,
    ).toBe(204)
    expect((await list('user-manager')).some((row) => row.id === 'conversation-mvondo')).toBe(false)
    expect(
      (await list('user-student')).find((row) => row.id === 'conversation-mvondo')?.state,
    ).toBe('requestSent')

    const accepted = await call('user-analyst', 'POST', '/conversations/conversation-eyinga/accept')
    expect((await json<ConversationDto>(accepted)).state).toBe('open')
    const reply = await call('user-eyinga', 'POST', '/conversations/conversation-eyinga/messages', {
      text: 'Thank you for accepting.',
    })
    expect(reply.status).toBe(201)
  })

  it('follows the contact rules, and the new conversations of a day', async () => {
    const closed = await call('user-manager', 'POST', '/conversations', {
      participantIds: ['user-tchakounte'],
      message: { text: 'Hello' },
    })
    expect(closed.status).toBe(403)
    // A conversation already open takes the message.
    const existing = await call('user-manager', 'POST', '/conversations', {
      participantIds: ['user-analyst'],
      message: { text: 'One more question.' },
    })
    expect((await json<ConversationDto>(existing)).id).toBe('conversation-atangana')
    // A Student's first message to an Analyst is a request.
    const request = await call('user-student', 'POST', '/conversations', {
      participantIds: ['user-fotso'],
      message: { text: 'Hello, may I ask about SAFACAM?' },
    })
    expect(request.status).toBe(201)
    expect((await json<ConversationDto>(request)).state).toBe('requestSent')

    // Five new conversations a day for a Student.
    const today = new Date().toISOString()
    const conversations = db.conversationStore.read()
    for (let index = 0; index < 4; index++) {
      conversations.push({
        ...conversations[0],
        id: `conversation-today-${index}`,
        createdBy: 'user-student',
        createdAt: today,
      })
    }
    const limited = await call('user-student', 'POST', '/conversations', {
      participantIds: ['user-cessomba'],
      message: { text: 'Hello' },
    })
    expect(limited.status).toBe(429)
    db.conversationStore.write(
      conversations.filter((item) => !item.id.startsWith('conversation-today')),
    )
  })

  it('closes a conversation with a block, and keeps a hidden profile open to it', async () => {
    const analyst = db.anyAccount('user-analyst')
    const manager = db.anyAccount('user-manager')
    if (!analyst || !manager || !db.isClientAccount(analyst)) throw new Error('demo users')
    expect((await call('user-analyst', 'POST', '/blocks/user-manager')).status).toBe(204)
    const blocked = await json<ConversationDto>(
      await call('user-analyst', 'GET', '/conversations/conversation-atangana'),
    )
    expect(blocked).toMatchObject({ blocked: 'byMe', state: 'closed', canWrite: false })
    expect(db.contactModeFor(manager, analyst)).toBe('none')
    expect(db.canSeeProfile(manager, analyst)).toBe(false)
    expect((await call('user-analyst', 'DELETE', '/blocks/user-manager')).status).toBe(204)

    const profile = db.profileOf(analyst)
    db.saveProfile({ ...profile, privacy: { ...profile.privacy, visibility: 'hidden' } })
    expect(db.contactModeFor(manager, analyst)).toBe('direct')
    expect(db.canSeeProfile(manager, analyst)).toBe(true)
    const stranger = db.anyAccount('user-ella')
    expect(stranger && db.contactModeFor(stranger, analyst)).toBe('none')
    db.saveProfile(profile)
  })

  it('scans a file before it can be downloaded, and blocks a virus', async () => {
    const form = (name: string): Upload => ({ upload: name })
    const clean = await json<MessageAttachmentDto>(
      await call('user-analyst', 'POST', '/attachments', form('curve.pdf')),
    )
    expect(clean.status).toBe('scanning')
    expect((await call('user-analyst', 'GET', `/attachments/${clean.id}`)).status).toBe(409)
    const infected = await json<MessageAttachmentDto>(
      await call('user-analyst', 'POST', '/attachments', form('eicar.pdf')),
    )
    const attachments = db.attachmentStore.read()
    for (const attachment of attachments) {
      if (attachment.id === clean.id || attachment.id === infected.id) {
        attachment.availableAt = new Date(Date.now() - 1).toISOString()
      }
    }
    expect((await call('user-analyst', 'GET', `/attachments/${clean.id}`)).status).toBe(200)
    expect((await call('user-analyst', 'GET', `/attachments/${infected.id}`)).status).toBe(410)
    expect((await call('user-analyst', 'POST', '/attachments', form('macro.docm'))).status).toBe(
      400,
    )
  })
})
