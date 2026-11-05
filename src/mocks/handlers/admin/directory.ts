import { http, HttpResponse } from 'msw'
import {
  CLIENT_ACCOUNT_TYPES,
  type AdminSpecialtyDto,
  type AuditChangeDto,
  type ContactMode,
  type ContactRules,
  type DirectorySettingsDto,
  type DirectorySettingsUpdateDto,
  type SpecialtyDto,
  type SpecialtyInputDto,
} from '@/shared/api/contracts'
import {
  currentAccount,
  directorySettingsStore,
  recordAudit,
  specialtyStore,
  specialtyUses,
} from '../../db'
import { api, latency, noContent, problem } from '../../lib/http'
import { normalize } from '../../lib/text'
import { allowed, forbidden, invalid, notFound, pick, type Errors } from './common'

const MODES: readonly ContactMode[] = ['direct', 'request', 'none']
const MAX_DAILY = 1_000
const MAX_THRESHOLD = 100
const NAME_MAX_LENGTH = 40

const isCount = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max

function readDirectorySettings(
  body: Partial<DirectorySettingsUpdateDto>,
): { settings: DirectorySettingsUpdateDto } | { errors: Errors } {
  const errors: Errors = {}
  const rules = {} as ContactRules
  const perDay = {} as DirectorySettingsUpdateDto['newConversationsPerDay']
  for (const type of CLIENT_ACCOUNT_TYPES) {
    const mode = pick(MODES, body.defaultContactRules?.[type])
    if (!mode) errors[`defaultContactRules.${type}`] = ['Direct, Request or No.']
    rules[type] = mode ?? 'none'
    const limit = body.newConversationsPerDay?.[type]
    if (!isCount(limit, 0, MAX_DAILY)) {
      errors[`newConversationsPerDay.${type}`] = [`A whole number from 0 to ${MAX_DAILY}.`]
    }
    perDay[type] = isCount(limit, 0, MAX_DAILY) ? limit : 0
  }
  if (!isCount(body.reportThreshold, 1, MAX_THRESHOLD)) {
    errors.reportThreshold = [`A whole number from 1 to ${MAX_THRESHOLD}.`]
  }
  if (Object.keys(errors).length > 0) return { errors }
  return {
    settings: {
      defaultContactRules: rules,
      newConversationsPerDay: perDay,
      reportThreshold: body.reportThreshold as number,
    },
  }
}

/** Each value the Admin changed, for the log. */
function directoryChanges(
  before: DirectorySettingsDto,
  after: DirectorySettingsUpdateDto,
): AuditChangeDto[] {
  const changes: AuditChangeDto[] = []
  for (const type of CLIENT_ACCOUNT_TYPES) {
    if (before.defaultContactRules[type] !== after.defaultContactRules[type]) {
      changes.push({
        field: 'contactRule',
        scope: type,
        before: before.defaultContactRules[type],
        after: after.defaultContactRules[type],
      })
    }
  }
  for (const type of CLIENT_ACCOUNT_TYPES) {
    if (before.newConversationsPerDay[type] !== after.newConversationsPerDay[type]) {
      changes.push({
        field: 'newConversations',
        scope: type,
        before: before.newConversationsPerDay[type],
        after: after.newConversationsPerDay[type],
      })
    }
  }
  if (before.reportThreshold !== after.reportThreshold) {
    changes.push({
      field: 'reportThreshold',
      scope: null,
      before: before.reportThreshold,
      after: after.reportThreshold,
    })
  }
  return changes
}

/** The names of a specialty, each language once in the list, or what is wrong with them. */
function readName(
  body: Partial<SpecialtyInputDto>,
  others: readonly SpecialtyDto[],
): { name: SpecialtyDto['name'] } | { errors: Errors } {
  const errors: Errors = {}
  const name = { fr: String(body.name?.fr ?? '').trim(), en: String(body.name?.en ?? '').trim() }
  for (const language of ['fr', 'en'] as const) {
    const value = name[language]
    if (!value || value.length > NAME_MAX_LENGTH) {
      errors[`name.${language}`] = [`From 1 to ${NAME_MAX_LENGTH} characters.`]
    } else if (
      others.some((specialty) => normalize(specialty.name[language]) === normalize(value))
    ) {
      errors[`name.${language}`] = ['Another specialty has this name.']
    }
  }
  return Object.keys(errors).length > 0 ? { errors } : { name }
}

/** "Islamic finance" -> "islamic-finance", numbered when taken. */
function newSpecialtyId(english: string, specialties: readonly SpecialtyDto[]): string {
  const base =
    normalize(english)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'specialty'
  const ids = new Set(specialties.map((specialty) => specialty.id))
  let id = base
  for (let index = 2; ids.has(id); index++) id = `${base}-${index}`
  return id
}

const specialtyTarget = (specialty: SpecialtyDto) =>
  ({ type: 'specialty', id: specialty.id, label: specialty.name.en }) as const

const nameChanges = (
  before: SpecialtyDto['name'] | null,
  after: SpecialtyDto['name'],
): AuditChangeDto[] =>
  (['en', 'fr'] as const)
    .filter((language) => before?.[language] !== after[language])
    .map((language) => ({
      field: 'name',
      scope: language,
      before: before?.[language] ?? null,
      after: after[language],
    }))

/**
 * ADMCFG, the directory and the messaging (spec section 15), without an endpoint in the spec:
 * the default contact rules, the new conversations a day, the report threshold, and the closed
 * list of specialties. A specialty that profiles list stays; it can be renamed.
 */
export const directorySettingsHandlers = [
  http.get(api('/admin/settings/directory'), async () => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    return HttpResponse.json(directorySettingsStore.read())
  }),

  http.put(api('/admin/settings/directory'), async ({ request }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const read = readDirectorySettings(
      (await request.json()) as Partial<DirectorySettingsUpdateDto>,
    )
    if ('errors' in read) return invalid('Invalid settings', read.errors)
    const before = directorySettingsStore.read()
    const changes = directoryChanges(before, read.settings)
    if (changes.length === 0) return HttpResponse.json(before)
    const saved: DirectorySettingsDto = {
      ...read.settings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAccount().displayName,
    }
    directorySettingsStore.write(saved)
    recordAudit(
      'settings-update',
      { type: 'settings', id: 'directory', label: 'Directory and messaging' },
      { changes },
    )
    return HttpResponse.json(saved)
  }),

  http.get(api('/admin/specialties'), async () => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const uses = specialtyUses()
    return HttpResponse.json<AdminSpecialtyDto[]>(
      specialtyStore
        .read()
        .map((specialty) => ({ ...specialty, profiles: uses.get(specialty.id) ?? 0 })),
    )
  }),

  http.post(api('/admin/specialties'), async ({ request }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const specialties = specialtyStore.read()
    const read = readName((await request.json()) as Partial<SpecialtyInputDto>, specialties)
    if ('errors' in read) return invalid('Invalid specialty', read.errors)
    const specialty: SpecialtyDto = {
      id: newSpecialtyId(read.name.en, specialties),
      name: read.name,
    }
    specialtyStore.write([...specialties, specialty])
    recordAudit('specialty-add', specialtyTarget(specialty), {
      changes: nameChanges(null, specialty.name),
    })
    return HttpResponse.json<AdminSpecialtyDto>({ ...specialty, profiles: 0 }, { status: 201 })
  }),

  http.put(api('/admin/specialties/:id'), async ({ params, request }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const specialties = specialtyStore.read()
    const specialty = specialties.find((candidate) => candidate.id === params.id)
    if (!specialty) return notFound('Specialty', params.id)
    const read = readName(
      (await request.json()) as Partial<SpecialtyInputDto>,
      specialties.filter((candidate) => candidate.id !== specialty.id),
    )
    if ('errors' in read) return invalid('Invalid specialty', read.errors)
    const changes = nameChanges(specialty.name, read.name)
    if (changes.length > 0) {
      specialty.name = read.name
      specialtyStore.write(specialties)
      recordAudit('specialty-rename', specialtyTarget(specialty), { changes })
    }
    return HttpResponse.json<AdminSpecialtyDto>({
      ...specialty,
      profiles: specialtyUses().get(specialty.id) ?? 0,
    })
  }),

  http.delete(api('/admin/specialties/:id'), async ({ params }) => {
    await latency()
    if (!allowed('settings:manage')) return forbidden()
    const specialties = specialtyStore.read()
    const specialty = specialties.find((candidate) => candidate.id === params.id)
    if (!specialty) return notFound('Specialty', params.id)
    const used = specialtyUses().get(specialty.id) ?? 0
    if (used > 0) {
      return problem(409, 'Specialty in use', `${used} profiles list it: rename it instead.`)
    }
    specialtyStore.write(specialties.filter((candidate) => candidate.id !== specialty.id))
    recordAudit('specialty-remove', specialtyTarget(specialty), {
      changes: nameChanges(specialty.name, { fr: '', en: '' }).map((change) => ({
        ...change,
        after: null,
      })),
    })
    return noContent()
  }),
]
