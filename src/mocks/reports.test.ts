import { getResponse } from 'msw'
import { beforeAll, describe, expect, it } from 'vitest'
import type {
  AdminConversationDto,
  AdminSpecialtyDto,
  AdminUserDetailsDto,
  AuditEntryDto,
  ContactPermissionDto,
  DirectorySettingsDto,
  ReportedItemDto,
  SpecialtyDto,
} from '@/shared/api/contracts'

type Db = typeof import('./db')
type Handlers = typeof import('./handlers/admin').adminHandlers

const ADMIN = 'user-admin'

// MOD and ADMCFG for the directory and the messaging (step 18): the reports, the conversations
// the Admin may read, the referred accounts, the defaults, limits and specialties.
describe('reports and directory settings', () => {
  let db: Db
  let handlers: Handlers

  beforeAll(async () => {
    db = await import('./db')
    const admin = await import('./handlers/admin')
    const directory = await import('./handlers/directory')
    const messaging = await import('./handlers/messaging')
    const network = await import('./handlers/network')
    handlers = [
      ...admin.adminHandlers,
      ...directory.directoryHandlers,
      ...messaging.messagingHandlers,
      ...network.networkHandlers,
    ]
  })

  async function call(userId: string, method: string, path: string, body?: unknown) {
    db.setSessionUser(userId)
    const request = new Request(new URL(`/api/v1${path}`, window.location.origin), {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await getResponse(handlers, request)
    if (!response) throw new Error(`No route for ${method} ${path}`)
    return response
  }
  const json = async <T>(response: Response) => (await response.json()) as T
  const queue = async () => json<ReportedItemDto[]>(await call(ADMIN, 'GET', '/admin/reports'))
  const lastAudit = () => db.auditStore.read().at(-1) as AuditEntryDto

  it('lists the reported profiles and conversations, the referred account first', async () => {
    const items = await queue()
    expect(items.map((item) => [item.type, item.title, item.reports.length])).toEqual([
      ['profile', 'Y. Abessolo', 3],
      ['conversation', 'Y. Abessolo · T. Bekale', 1],
      ['profile', 'R. Ondo', 1],
    ])
    // Beyond 3 open reports: 3 on the profile and 1 in a conversation.
    expect(items[0].account).toMatchObject({ openReports: 4, referred: true, status: 'active' })
    expect(items[0].reports[0]).toMatchObject({
      reason: 'spam',
      reportedBy: { displayName: 'B. Ngoma' },
    })
    expect(items[2].account?.referred).toBe(false)
    const conversations = await json<ReportedItemDto[]>(
      await call(ADMIN, 'GET', '/admin/reports?type=conversation'),
    )
    expect(conversations.map((item) => item.id)).toEqual(['conversation-abessolo'])
    expect((await call('user-analyst', 'GET', '/admin/reports')).status).toBe(403)
  })

  it('reads a reported conversation only, and writes each reading to the audit log', async () => {
    const response = await call(ADMIN, 'GET', '/admin/conversations/conversation-abessolo')
    const conversation = await json<AdminConversationDto>(response)
    expect(conversation.members.map((member) => member.displayName)).toEqual([
      'Y. Abessolo',
      'T. Bekale',
    ])
    expect(conversation.messages[1].text).toContain('2,000,000 XAF by mobile money')
    expect(lastAudit()).toMatchObject({
      action: 'conversation-read',
      target: { type: 'conversation', id: 'conversation-abessolo' },
      actor: { id: ADMIN },
    })
    expect((await call(ADMIN, 'GET', '/admin/conversations/conversation-atangana')).status).toBe(
      404,
    )
  })

  it("dismisses a profile's reports, once", async () => {
    expect((await call(ADMIN, 'POST', '/admin/reports/profile/user-ondo/dismiss')).status).toBe(204)
    expect(lastAudit()).toMatchObject({
      action: 'report-dismiss',
      target: { type: 'profile', id: 'user-ondo', label: 'R. Ondo' },
      changes: [{ field: 'reports', before: 1, after: 0 }],
    })
    expect((await queue()).map((item) => item.title)).not.toContain('R. Ondo')
    expect((await call(ADMIN, 'POST', '/admin/reports/profile/user-ondo/dismiss')).status).toBe(409)
    const details = await json<AdminUserDetailsDto>(
      await call(ADMIN, 'GET', '/admin/users/user-ondo'),
    )
    expect(details.reportsReceived).toEqual({ total: 1, open: 0, referred: false })
  })

  it('closes the reports about an account it suspends', async () => {
    const suspended = await call(ADMIN, 'POST', '/admin/users/user-abessolo/suspend', {
      reason: 'Asks members for money and promises guaranteed returns.',
    })
    expect(suspended.status).toBe(200)
    const details = await json<AdminUserDetailsDto>(suspended)
    expect(details.reportsReceived).toEqual({ total: 4, open: 0, referred: false })
    expect(await queue()).toEqual([])
    expect(
      db.profileReportStore.read().find((report) => report.userId === 'user-abessolo'),
    ).toMatchObject({ status: 'closed', outcome: 'suspended', closedBy: 'L. Mvogo' })
    // A report kept its conversation open to the Admin.
    expect((await call(ADMIN, 'GET', '/admin/conversations/conversation-abessolo')).status).toBe(
      200,
    )
  })

  it('takes a new report of a profile into the queue', async () => {
    const reported = await call('user-analyst', 'POST', '/profiles/user-cessomba/report', {
      reason: 'inappropriate',
      comment: 'Insults the analysts who disagree.',
    })
    expect(reported.status).toBe(204)
    const [item] = await queue()
    expect(item).toMatchObject({ type: 'profile', id: 'user-cessomba', title: 'C. Essomba' })
    expect(item.reports[0].reportedBy.displayName).toBe('K. Atangana')
  })

  it("applies the Admin's defaults, limits and threshold, and logs each change", async () => {
    const before = await json<DirectorySettingsDto>(
      await call(ADMIN, 'GET', '/admin/settings/directory'),
    )
    expect(before).toMatchObject({
      defaultContactRules: { student: 'request', analyst: 'direct' },
      newConversationsPerDay: { student: 5, manager: 20 },
      reportThreshold: 3,
    })
    const saved = await call(ADMIN, 'PUT', '/admin/settings/directory', {
      defaultContactRules: { ...before.defaultContactRules, student: 'direct', manager: 'none' },
      newConversationsPerDay: { ...before.newConversationsPerDay, student: 0 },
      reportThreshold: 0,
    })
    expect(saved.status).toBe(400)
    expect((await saved.json()).errors.reportThreshold).toBeDefined()
    const ok = await call(ADMIN, 'PUT', '/admin/settings/directory', {
      defaultContactRules: { ...before.defaultContactRules, student: 'direct', manager: 'none' },
      newConversationsPerDay: { ...before.newConversationsPerDay, student: 0 },
      reportThreshold: 1,
    })
    expect(ok.status).toBe(200)
    expect(lastAudit()).toMatchObject({
      action: 'settings-update',
      target: { id: 'directory' },
      changes: [
        { field: 'contactRule', scope: 'student', before: 'request', after: 'direct' },
        { field: 'contactRule', scope: 'manager', before: 'direct', after: 'none' },
        { field: 'newConversations', scope: 'student', before: 5, after: 0 },
        { field: 'reportThreshold', before: 3, after: 1 },
      ],
    })

    // A client who never wrote their profile takes the new defaults; the others keep theirs.
    const nkoulou = await json<ContactPermissionDto>(
      await call('user-manager', 'GET', '/profiles/user-nkoulou/contact-permission'),
    )
    expect(nkoulou.mode).toBe('none')
    // No new conversation a day for a Student now.
    const opened = await call('user-student', 'POST', '/conversations', {
      participantIds: ['user-analyst'],
      message: { text: 'Hello, could I ask you about the BVMAC?' },
    })
    expect(opened.status).toBe(429)
    // Beyond 1 open report: C. Essomba, reported twice, is referred.
    await call('user-manager', 'POST', '/profiles/user-cessomba/report', { reason: 'spam' })
    expect((await queue())[0].account).toMatchObject({ openReports: 2, referred: true })
  })

  it('adds, renames and removes the specialties nobody lists; one in use stays', async () => {
    const added = await call(ADMIN, 'POST', '/admin/specialties', {
      name: { fr: 'Finance islamique', en: 'Islamic finance' },
    })
    expect(added.status).toBe(201)
    expect(await added.json()).toMatchObject({ id: 'islamic-finance', profiles: 0 })
    const twice = await call(ADMIN, 'POST', '/admin/specialties', {
      name: { fr: 'Finance  ISLAMIQUE', en: 'Sukuk' },
    })
    expect((await twice.json()).errors['name.fr']).toEqual(['Another specialty has this name.'])

    const renamed = await call(ADMIN, 'PUT', '/admin/specialties/islamic-finance', {
      name: { fr: 'Finance islamique', en: 'Islamic finance and sukuk' },
    })
    expect(renamed.status).toBe(200)
    expect(lastAudit()).toMatchObject({
      action: 'specialty-rename',
      changes: [{ field: 'name', scope: 'en', after: 'Islamic finance and sukuk' }],
    })
    const listed = await json<SpecialtyDto[]>(await call(ADMIN, 'GET', '/directory/specialties'))
    expect(listed.at(-1)?.name.en).toBe('Islamic finance and sukuk')

    const specialties = await json<AdminSpecialtyDto[]>(
      await call(ADMIN, 'GET', '/admin/specialties'),
    )
    const sovereign = specialties.find((specialty) => specialty.id === 'sovereign-bonds')
    expect(sovereign?.profiles).toBeGreaterThan(0)
    expect((await call(ADMIN, 'DELETE', '/admin/specialties/sovereign-bonds')).status).toBe(409)
    expect((await call(ADMIN, 'DELETE', '/admin/specialties/islamic-finance')).status).toBe(204)
    expect(lastAudit()).toMatchObject({ action: 'specialty-remove', target: { type: 'specialty' } })
  })
})
