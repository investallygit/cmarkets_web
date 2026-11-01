import type {
  ImportDto,
  ImportRowDto,
  ImportStatus,
  ImportType,
  ImportValues,
} from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import type { RealtimeEventMap } from '@/shared/realtime'
import { currentAccount, indices, recordAudit, securities, type AuditActor } from '../db'
import { newId } from '../lib/ids'
import { countRows, rowStatus } from '../lib/dataImport'
import type { Cell } from '../lib/templateFile'
import { checkImport, storedRows } from './checks'
import { findSecurity } from './lookups'
import { saveImports } from './published'
import {
  findImport,
  importStore,
  type LiveValues,
  type StoredImport,
  type StoredImportRow,
} from './store'

/**
 * The upload cycle (spec section 11): a file read and checked step by step, its rows fixed, then
 * published, rolled back or discarded, each step told to the simulated hub and the audit log.
 */

const FORMAT_MS = 700
const CHECKS_MS = 1_800

type ImportEvent =
  | { name: 'ImportStatusChanged'; payload: RealtimeEventMap['ImportStatusChanged'] }
  | { name: 'DataPublished'; payload: RealtimeEventMap['DataPublished'] }

const listeners = new Set<(event: ImportEvent) => void>()

/** Progress of the checks and publications, for the simulated hub. */
export function onImportEvent(listener: (event: ImportEvent) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function emit(event: ImportEvent): void {
  listeners.forEach((listener) => listener(event))
}

export function statusOf(stored: StoredImport, now = Date.now()): ImportStatus {
  if (stored.status !== 'ready') return stored.status
  if (now < stored.formatUntil) return 'format'
  if (now < stored.readyAt) return 'checks'
  return 'ready'
}

const ZERO_COUNTS = { new: 0, changed: 0, unchanged: 0, alerts: 0, alertsChecked: 0, errors: 0 }

export function importDto(stored: StoredImport, now = Date.now()): ImportDto {
  const status = statusOf(stored, now)
  const checking = status === 'format' || status === 'checks'
  return {
    id: stored.id,
    type: stored.type,
    fileName: stored.fileName,
    sessionDate: stored.sessionDate,
    columns: stored.columns,
    status,
    counts: checking ? { read: stored.rows.length, ...ZERO_COUNTS } : countRows(stored.rows),
    uploadedAt: stored.uploadedAt,
    uploadedBy: stored.uploadedBy,
    publishedAt: stored.publishedAt,
    publishedBy: stored.publishedBy,
    rollback: stored.rollback,
    replacesId: stored.replacesId,
  }
}

export function rowDto(row: StoredImportRow): ImportRowDto {
  return {
    id: row.id,
    line: row.line,
    values: row.values,
    stored: row.diff === 'changed' ? row.stored : null,
    status: rowStatus(row),
    issues: row.issues,
    checked: row.checked,
    edited: row.edited,
  }
}

function announceChecks(stored: StoredImport): void {
  const { formatUntil, readyAt } = stored
  const report = () => {
    const current = findImport(stored.id)
    if (!current) return
    const dto = importDto(current)
    emit({
      name: 'ImportStatusChanged',
      payload: {
        importId: dto.id,
        status: dto.status,
        errors: dto.counts.errors,
        warnings: dto.counts.alerts,
      },
    })
  }
  window.setTimeout(report, Math.max(0, formatUntil - Date.now()))
  window.setTimeout(report, Math.max(0, readyAt - Date.now()) + 10)
}

/** POST /data/imports: the file is read now, its checks shown step by step. */
export function startImport(input: {
  type: ImportType
  fileName: string
  sessionDate: string
  rows: readonly { line: number; cells: Readonly<Record<string, Cell>> }[]
  columns: string[]
  replaces: StoredImport | undefined
}): StoredImport {
  const account = currentAccount()
  const now = Date.now()
  const id = newId('import')
  const stored: StoredImport = {
    id,
    type: input.type,
    fileName: input.fileName,
    sessionDate: input.sessionDate,
    columns: input.columns,
    status: 'ready',
    uploadedAt: new Date(now).toISOString(),
    uploadedById: account.id,
    uploadedBy: account.displayName,
    formatUntil: now + FORMAT_MS,
    readyAt: now + FORMAT_MS + CHECKS_MS,
    publishedAt: null,
    publishedBy: null,
    rollback: null,
    replacesId: input.replaces?.id ?? null,
    rows: storedRows(checkImport(input.type, input.sessionDate, input.rows), id),
  }
  const imports = importStore.read()
  if (input.replaces) input.replaces.status = 'discarded'
  saveImports([stored, ...imports])
  announceChecks(stored)
  return stored
}

/**
 * PATCH of a row: Fix row puts new values and runs the checks again on the whole file (a fix can
 * end a duplicate); an alert whose reason stays the same keeps its "checked" tick.
 */
export function patchRow(
  stored: StoredImport,
  rowId: string,
  patch: { values?: ImportValues; checked?: boolean },
): StoredImportRow | { error: string } {
  const row = stored.rows.find((candidate) => candidate.id === rowId)
  if (!row) return { error: 'No such row.' }
  if (patch.values) {
    const before = new Map(stored.rows.map((candidate) => [candidate.id, candidate]))
    const cells = stored.rows.map((candidate) => ({
      line: candidate.line,
      cells: candidate.id === rowId ? { ...candidate.values, ...patch.values } : candidate.values,
    }))
    const checked = checkImport(stored.type, stored.sessionDate, cells)
    stored.rows = stored.rows.map((candidate, index) => {
      const next = checked[index]
      const previous = before.get(candidate.id)
      const sameAlerts =
        previous !== undefined &&
        JSON.stringify(previous.issues) === JSON.stringify(next.issues) &&
        candidate.id !== rowId
      return {
        ...next,
        id: candidate.id,
        checked: sameAlerts ? candidate.checked : false,
        edited: candidate.edited || candidate.id === rowId,
      }
    })
  }
  const current = stored.rows.find((candidate) => candidate.id === rowId) ?? row
  if (patch.checked !== undefined) {
    if (rowStatus(current) !== 'alert')
      return { error: 'Only a row with an alert is ticked checked.' }
    current.checked = patch.checked
  }
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  return current
}

function liveOf(id: string): LiveValues | undefined {
  const security = securities.get(id)
  if (!security) return undefined
  const { open, high, low, last, volume } = security
  return { open, high, low, last, volume }
}

/** Today's session published: the live prices and index values become the file's. */
function applyToday(stored: StoredImport): void {
  const today = toMarketDay(Date.now())
  if (stored.sessionDate !== today) return
  const before: Record<string, LiveValues | number> = {}
  for (const { values } of stored.rows) {
    if (stored.type === 'daily-prices' && values.date === today) {
      const security = findSecurity(String(values.code))
      const live = security && liveOf(security.id)
      if (!security || !live) continue
      before[security.id] = live
      Object.assign(security, {
        open: Number(values.open),
        high: Number(values.high),
        low: Number(values.low),
        last: Number(values.close),
        volume: Number(values.volume),
        updatedAt: new Date().toISOString(),
      })
    }
    if (stored.type === 'indices' && values.date === today) {
      const index = indices.get(String(values.index))
      if (!index) continue
      before[index.code] = index.value
      index.value = Number(values.value)
    }
  }
  stored.liveBefore = before
}

function restoreToday(stored: StoredImport): void {
  for (const [id, value] of Object.entries(stored.liveBefore ?? {})) {
    const security = securities.get(id)
    if (security && typeof value === 'object') Object.assign(security, value)
    const index = indices.get(id)
    if (index && typeof value === 'number') index.value = value
  }
  stored.liveBefore = undefined
}

function announcePublished(stored: StoredImport): void {
  emit({
    name: 'DataPublished',
    payload: { importId: stored.id, type: stored.type, date: stored.sessionDate },
  })
}

const importTarget = (stored: StoredImport) =>
  ({ type: 'import', id: stored.id, label: stored.fileName }) as const

/** The log of an upload's publication or rollback: its status and how many rows. */
export function auditImport(
  stored: StoredImport,
  action: 'import-publish' | 'import-rollback' | 'import-discard',
  before: ImportStatus,
  options: { reason?: string | null; at?: string; actor?: AuditActor } = {},
): void {
  const after =
    action === 'import-publish'
      ? 'published'
      : action === 'import-rollback'
        ? 'rolledBack'
        : 'discarded'
  recordAudit(action, importTarget(stored), {
    changes: [
      { field: 'importStatus', scope: null, before, after },
      ...(action === 'import-discard'
        ? []
        : [
            { field: 'rows', scope: stored.type, before: null, after: stored.rows.length } as const,
          ]),
    ],
    ...options,
  })
}

/** POST /data/imports/{id}/publish: the rows go into the database; screens are told to refresh. */
export function publishImport(stored: StoredImport): void {
  const before = statusOf(stored)
  stored.status = 'published'
  stored.publishedAt = new Date().toISOString()
  stored.publishedBy = currentAccount().displayName
  applyToday(stored)
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-publish', before)
  announcePublished(stored)
}

/** POST /data/imports/{id}/rollback: the previous values come back; the rows can be fixed again. */
export function rollBackImport(stored: StoredImport, reason: string): void {
  stored.status = 'rolledBack'
  stored.rollback = {
    at: new Date().toISOString(),
    by: currentAccount().displayName,
    reason,
  }
  restoreToday(stored)
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-rollback', 'published', { reason })
  announcePublished(stored)
}

export function discardImport(stored: StoredImport): void {
  const before = statusOf(stored)
  stored.status = 'discarded'
  saveImports(
    importStore.read().map((candidate) => (candidate.id === stored.id ? stored : candidate)),
  )
  auditImport(stored, 'import-discard', before)
}
