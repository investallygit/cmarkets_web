import { http, HttpResponse } from 'msw'
import type {
  DocumentDto,
  DocumentType,
  DocumentWriteDto,
  ImportDto,
  ImportRollbackDto,
  ImportRowDto,
  ImportRowPatchDto,
  ImportType,
  ImportTypeDto,
  NewsArticleDto,
  NewsTopic,
  NewsWriteDto,
  Paged,
  Permission,
  PriceCorrectionDto,
  PriceCorrectionRequestDto,
  StoredPriceDto,
} from '@/shared/api/contracts'
import { isCemacCountry } from '@/shared/config/countries'
import { toCsv } from '@/shared/lib/csv'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { xlsxBlob } from '@/shared/lib/xlsx'
import { allDocuments, findArticle, saveArticle, saveDocument } from '../content'
import { currentUser, securities } from '../db'
import {
  correctionStore,
  correctPrice,
  coverage,
  currentSession,
  discardImport,
  findImport,
  importDto,
  importStore,
  isSessionDay,
  patchRow,
  publishImport,
  rollBackImport,
  rowDto,
  startImport,
  statusOf,
  storedPrices,
  type StoredCorrection,
} from '../imports'
import { canPublish, importTypeOf, IMPORT_TYPES, isImportType, rowStatus } from '../lib/dataImport'
import { eodhdStatus } from '../lib/eodhd'
import { api, latency, paginate, problem } from '../lib/http'
import { readTemplateFile } from '../lib/templateFile'
import { isIsoDate, isNumber } from '../lib/validation'

type Errors = Record<string, string[]>

const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
const forbidden = () => problem(403, 'Forbidden', 'The back-office is for the Data admin.')
const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
const notFound = (what: string, id: unknown) =>
  problem(404, `${what} not found`, `No ${what.toLowerCase()} ${String(id)}.`)

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5_000
const MAX_PDF_BYTES = 20 * 1024 * 1024
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff)

/** A line of each template, so the Data admin sees the format expected. */
// prettier-ignore
function exampleRow(type: ImportType, day: string): (string | number)[] {
  switch (type) {
    case 'daily-prices':
    case 'history':
      return [day, 'SEMC', 51_900, 52_800, 51_900, 52_500, 96, 5_040_000]
    case 'indices':
      return [day, 'BVMAC-A', 1_284.37]
    case 'corporate-actions':
      return ['SAFACAM', 'dividend', addDays(day, 14), addDays(day, 28), 1_060]
    case 'auctions':
      return [day, 'CM', 'BTA 26 wk', addDays(day, 182), 15_000, 24_300, 15_000, 4.95, 5.05]
    case 'curves':
      return [day, 'CM', '3M', 4.6]
    case 'financial-statements':
      return ['SEMC', 2025, 'revenue', 18_250]
    case 'securities':
      return ['SEMC', 'CM0000010011', 'Société des Eaux Minérales du Cameroun', 'equity', 'Beverages', 'CM', 600_000, 'XAF']
  }
}

function withImport(permission: Permission, id: unknown) {
  if (!allowed(permission)) return { response: forbidden() }
  const stored = findImport(String(id))
  return stored ? { stored } : { response: notFound('Import', id) }
}

const editable = (status: ImportDto['status']) => status === 'ready' || status === 'rolledBack'

function readCorrection(body: Partial<PriceCorrectionRequestDto>): Errors {
  const errors: Errors = {}
  for (const field of ['open', 'high', 'low', 'close'] as const) {
    if (!isNumber(body[field]) || body[field] <= 0) errors[field] = ['A price above zero.']
  }
  if (!isNumber(body.volume) || !Number.isInteger(body.volume) || body.volume < 0) {
    errors.volume = ['A whole number of shares, zero or more.']
  }
  if (Object.keys(errors).length === 0) {
    const { open = 0, high = 0, low = 0, close = 0 } = body
    if (high < Math.max(open, close, low))
      errors.high = ['At least the open, the close and the low.']
    if (low > Math.min(open, close)) errors.low = ['At most the open and the close.']
  }
  if (String(body.reason ?? '').trim().length < 5) {
    errors.reason = ['Say why the price is corrected: the log keeps it.']
  }
  return errors
}

const NEWS_TOPICS: readonly NewsTopic[] = ['issuer', 'regulator', 'market']
// prettier-ignore
const DOCUMENT_TYPES: readonly DocumentType[] = [
  'annual-report', 'financial-statements', 'information-note', 'release', 'notice', 'decision', 'articles',
]

function readContent(fields: { title: string; source: string; securityIds: string[] }): Errors {
  const errors: Errors = {}
  if (fields.title.length < 3 || fields.title.length > 200) errors.title = ['3 to 200 characters.']
  if (!/^[A-Z0-9][A-Z0-9 .&-]{0,23}$/.test(fields.source)) {
    errors.source = ['The issuer code or the institution, e.g. SEMC or BEAC.']
  }
  const unknown = fields.securityIds.filter((id) => !securities.has(id))
  if (unknown.length > 0) errors.securityIds = [`Unknown securities: ${unknown.join(', ')}.`]
  return errors
}

function readNews(body: Partial<NewsWriteDto>): { write: NewsWriteDto } | { errors: Errors } {
  const write: NewsWriteDto = {
    headline: String(body.headline ?? '').trim(),
    source: String(body.source ?? '')
      .trim()
      .toUpperCase(),
    topic: body.topic as NewsTopic,
    country: body.country ?? null,
    securityIds: Array.isArray(body.securityIds) ? body.securityIds.map(String) : [],
    body: Array.isArray(body.body)
      ? body.body.map((paragraph) => String(paragraph).trim()).filter(Boolean)
      : [],
  }
  const { title, ...errors } = readContent({ ...write, title: write.headline })
  if (title) errors.headline = title
  if (!NEWS_TOPICS.includes(write.topic)) errors.topic = ['Issuer, regulator or market.']
  if (write.country !== null && !isCemacCountry(write.country))
    errors.country = ['A CEMAC country.']
  if (write.body.length === 0) errors.body = ['The text of the news.']
  else if (write.body.join('\n').length > 10_000) errors.body = ['10,000 characters at most.']
  return Object.keys(errors).length > 0 ? { errors } : { write }
}

async function readDocument(
  request: Request,
  fileRequired: boolean,
): Promise<{ write: DocumentWriteDto; file: File | null } | { errors: Errors }> {
  const form = await request.formData()
  const write: DocumentWriteDto = {
    type: String(form.get('type') ?? '') as DocumentType,
    title: String(form.get('title') ?? '').trim(),
    source: String(form.get('source') ?? '')
      .trim()
      .toUpperCase(),
    securityIds: form.getAll('securityIds').map(String),
  }
  const errors = readContent(write)
  if (!DOCUMENT_TYPES.includes(write.type)) errors.type = ['A document type.']
  const file = form.get('file')
  if (file instanceof File) {
    if (!/\.pdf$/i.test(file.name)) errors.file = ['A PDF file.']
    else if (file.size > MAX_PDF_BYTES) errors.file = ['20 MB at most.']
  } else if (fileRequired) errors.file = ['The PDF of the document.']
  return Object.keys(errors).length > 0
    ? { errors }
    : { write, file: file instanceof File ? file : null }
}

function correctionDto(correction: StoredCorrection): PriceCorrectionDto {
  const { id, securityId, date, before, after, reason, correctedAt, correctedBy } = correction
  return { id, securityId, date, before, after, reason, correctedAt, correctedBy }
}

export const dataHandlers = [
  http.get(api('/data/import-types'), async () => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    return HttpResponse.json<ImportTypeDto[]>([...IMPORT_TYPES])
  }),

  http.get(api('/data/import-types/:type/template'), async ({ params, request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const type = String(params.type)
    if (!isImportType(type)) return notFound('Import type', type)
    const format = new URL(request.url).searchParams.get('format') ?? 'csv'
    const rows = [
      importTypeOf(type).columns.map((column) => column.name),
      exampleRow(type, currentSession()),
    ]
    const name = `cmarket_template_${type.replaceAll('-', '_')}`
    if (format === 'xlsx') {
      return new HttpResponse(await xlsxBlob(rows), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${name}.xlsx"`,
        },
      })
    }
    // UTF-8 with its byte order mark, so Excel reads the accents (spec section 11).
    return new HttpResponse(`${BYTE_ORDER_MARK}${toCsv(rows)}\r\n`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${name}.csv"`,
      },
    })
  }),

  http.post(api('/data/imports'), async ({ request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const form = await request.formData()
    const type = String(form.get('type') ?? '')
    const sessionDate = String(form.get('sessionDate') ?? '')
    const replacesId = form.get('replacesId')
    const file = form.get('file')
    const errors: Errors = {}
    if (!isImportType(type)) errors.type = ['A file type of the templates.']
    if (!isIsoDate(sessionDate) || !isSessionDay(sessionDate) || sessionDate > currentSession()) {
      errors.sessionDate = ['A session day, the current one at the latest.']
    }
    if (!(file instanceof File)) errors.file = ['A .csv or .xlsx file of the template.']
    else if (file.size > MAX_FILE_BYTES) errors.file = ['5 MB at most.']
    if (Object.keys(errors).length > 0 || !isImportType(type) || !(file instanceof File)) {
      return invalid('Invalid upload', errors)
    }
    const replaces = replacesId ? findImport(String(replacesId)) : undefined
    if (replacesId && (!replaces || !editable(statusOf(replaces)))) {
      return problem(409, 'Cannot replace', 'Only a file not published yet can be replaced.')
    }
    const pending = importStore
      .read()
      .find(
        (stored) =>
          stored.type === type &&
          stored.sessionDate === sessionDate &&
          stored.id !== replaces?.id &&
          (stored.status === 'ready' || stored.status === 'rolledBack'),
      )
    if (pending) {
      return problem(
        409,
        'Upload in progress',
        `${pending.fileName} is being checked for this session: replace or discard it first.`,
        undefined,
        { importId: pending.id },
      )
    }
    const definition = importTypeOf(type)
    const names = definition.columns.map((column) => column.name)
    const read = await readTemplateFile(
      file,
      names,
      definition.columns.filter((column) => column.required).map((column) => column.name),
    )
    if ('error' in read) return invalid('Invalid file', { file: [read.error] })
    if (read.rows.length === 0) return invalid('Invalid file', { file: ['No row in the file.'] })
    if (read.rows.length > MAX_ROWS) {
      return invalid('Invalid file', {
        file: [`${MAX_ROWS.toLocaleString('en-US')} rows at most.`],
      })
    }
    const columns = names.filter((name) => read.rows.some((row) => row.cells[name] !== null))
    const stored = startImport({
      type,
      fileName: file.name,
      sessionDate,
      rows: read.rows,
      columns,
      replaces,
    })
    return HttpResponse.json<ImportDto>(importDto(stored), { status: 202 })
  }),

  http.get(api('/data/imports'), async ({ request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const query = new URL(request.url).searchParams
    const statuses = query.getAll('status')
    const types = query.getAll('type')
    const from = query.get('from')
    const to = query.get('to')
    const sessionDate = query.get('sessionDate')
    const now = Date.now()
    const items = importStore
      .read()
      .map((stored) => importDto(stored, now))
      .filter((dto) => {
        const day = toMarketDay(dto.uploadedAt)
        return (
          (statuses.length === 0 || statuses.includes(dto.status)) &&
          (types.length === 0 || types.includes(dto.type)) &&
          (!from || day >= from) &&
          (!to || day <= to) &&
          (!sessionDate || dto.sessionDate === sessionDate)
        )
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    return HttpResponse.json<Paged<ImportDto>>(paginate(items, query))
  }),

  http.get(api('/data/imports/:id'), async ({ params }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    return HttpResponse.json<ImportDto>(importDto(found.stored))
  }),

  http.get(api('/data/imports/:id/rows'), async ({ params, request }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    const { stored } = found
    const query = new URL(request.url).searchParams
    const status = query.get('status')
    const checking = ['format', 'checks'].includes(statusOf(stored))
    const rows = checking
      ? []
      : stored.rows.filter((row) => {
          const rowState = rowStatus(row)
          if (!status) return true
          if (status === 'error' || status === 'alert') return rowState === status
          return rowState !== 'error' && row.diff === status
        })
    return HttpResponse.json<Paged<ImportRowDto>>(paginate(rows.map(rowDto), query))
  }),

  http.patch(api('/data/imports/:id/rows/:rowId'), async ({ params, request }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    const { stored } = found
    if (!editable(statusOf(stored))) {
      return problem(409, 'Not editable', 'Rows are fixed before the file is published.')
    }
    const body = (await request.json()) as Partial<ImportRowPatchDto>
    const names = new Set(importTypeOf(stored.type).columns.map((column) => column.name))
    const values = body.values
    if (values !== undefined) {
      const wrong = Object.entries(values ?? {}).filter(
        ([name, value]) =>
          !names.has(name) || !(value === null || ['string', 'number'].includes(typeof value)),
      )
      if (values === null || typeof values !== 'object' || wrong.length > 0) {
        return invalid('Invalid row', {
          values: ['Columns of the template, with text or numbers.'],
        })
      }
    }
    if (body.checked !== undefined && typeof body.checked !== 'boolean') {
      return invalid('Invalid row', { checked: ['true or false.'] })
    }
    const result = patchRow(stored, String(params.rowId), { values, checked: body.checked })
    if ('error' in result) return invalid('Invalid row', { checked: [result.error] })
    return HttpResponse.json<ImportRowDto>(rowDto(result))
  }),

  http.post(api('/data/imports/:id/publish'), async ({ params }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    const { stored } = found
    const dto = importDto(stored)
    if (!editable(dto.status)) {
      return problem(409, 'Cannot publish', `The file is ${dto.status}, not in its preview.`)
    }
    if (!canPublish(dto.counts)) {
      return problem(
        409,
        'Cannot publish',
        'Fix the rows in error and tick each alert "checked" first.',
        undefined,
        { counts: dto.counts },
      )
    }
    publishImport(stored)
    return HttpResponse.json<ImportDto>(importDto(stored))
  }),

  http.post(api('/data/imports/:id/rollback'), async ({ params, request }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    const { stored } = found
    if (stored.status !== 'published') {
      return problem(409, 'Cannot roll back', 'Only a published file is rolled back.')
    }
    const reason = String(
      ((await request.json()) as Partial<ImportRollbackDto>).reason ?? '',
    ).trim()
    if (!reason)
      return invalid('Invalid rollback', { reason: ['Say why the file is rolled back.'] })
    rollBackImport(stored, reason)
    return HttpResponse.json<ImportDto>(importDto(stored))
  }),

  // Discard has no endpoint in the spec (ROADMAP open questions).
  http.post(api('/data/imports/:id/discard'), async ({ params }) => {
    await latency()
    const found = withImport('data:import', params.id)
    if ('response' in found) return found.response
    const { stored } = found
    if (stored.status === 'published' || stored.status === 'discarded') {
      return problem(409, 'Cannot discard', 'A published file is rolled back, not discarded.')
    }
    discardImport(stored)
    return HttpResponse.json<ImportDto>(importDto(stored))
  }),

  http.get(api('/data/coverage'), async ({ request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const date = new URL(request.url).searchParams.get('date') ?? currentSession()
    if (!isIsoDate(date)) return problem(400, 'Invalid date', 'date must be an ISO date.')
    return HttpResponse.json(coverage(date))
  }),

  http.get(api('/data/providers/eodhd/status'), async () => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    return HttpResponse.json(eodhdStatus())
  }),

  http.get(api('/data/securities/:id/prices'), async ({ params, request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const id = String(params.id)
    if (!securities.has(id)) return notFound('Security', id)
    const query = new URL(request.url).searchParams
    const to = query.get('to') ?? toMarketDay(Date.now())
    const from = query.get('from') ?? addDays(to, -45)
    if (!isIsoDate(from) || !isIsoDate(to)) return problem(400, 'Invalid dates', 'ISO dates.')
    return HttpResponse.json<StoredPriceDto[]>(storedPrices(id, from, to))
  }),

  http.put(api('/data/securities/:id/prices/:date'), async ({ params, request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const id = String(params.id)
    const date = String(params.date)
    if (!securities.has(id)) return notFound('Security', id)
    if (!isIsoDate(date) || storedPrices(id, date, date).length === 0) {
      return problem(404, 'No session', `No stored session on ${date} for ${id}.`)
    }
    const body = (await request.json()) as Partial<PriceCorrectionRequestDto>
    const errors = readCorrection(body)
    if (Object.keys(errors).length > 0) return invalid('Invalid correction', errors)
    const correction = correctPrice(id, date, {
      open: Number(body.open),
      high: Number(body.high),
      low: Number(body.low),
      close: Number(body.close),
      volume: Number(body.volume),
      reason: String(body.reason).trim(),
    })
    return HttpResponse.json<PriceCorrectionDto>(correctionDto(correction))
  }),

  http.get(api('/data/corrections'), async ({ request }) => {
    await latency()
    if (!allowed('data:import')) return forbidden()
    const query = new URL(request.url).searchParams
    const securityId = query.get('securityId')
    const items = correctionStore
      .read()
      .filter((correction) => !securityId || correction.securityId === securityId)
      .map(correctionDto)
    return HttpResponse.json<Paged<PriceCorrectionDto>>(paginate(items, query))
  }),

  http.post(api('/data/news'), async ({ request }) => {
    await latency()
    if (!allowed('content:publish')) return forbidden()
    const read = readNews((await request.json()) as Partial<NewsWriteDto>)
    if ('errors' in read) return invalid('Invalid news', read.errors)
    return HttpResponse.json<NewsArticleDto>(saveArticle(null, read.write), { status: 201 })
  }),

  http.put(api('/data/news/:id'), async ({ params, request }) => {
    await latency()
    if (!allowed('content:publish')) return forbidden()
    const id = String(params.id)
    if (!findArticle(id)) return notFound('News', id)
    const read = readNews((await request.json()) as Partial<NewsWriteDto>)
    if ('errors' in read) return invalid('Invalid news', read.errors)
    return HttpResponse.json<NewsArticleDto>(saveArticle(id, read.write))
  }),

  http.post(api('/data/documents'), async ({ request }) => {
    await latency()
    if (!allowed('content:publish')) return forbidden()
    const read = await readDocument(request, true)
    if ('errors' in read) return invalid('Invalid document', read.errors)
    return HttpResponse.json<DocumentDto>(await saveDocument(null, read.write, read.file), {
      status: 201,
    })
  }),

  http.put(api('/data/documents/:id'), async ({ params, request }) => {
    await latency()
    if (!allowed('content:publish')) return forbidden()
    const id = String(params.id)
    if (!allDocuments().some((document) => document.id === id)) return notFound('Document', id)
    const read = await readDocument(request, false)
    if ('errors' in read) return invalid('Invalid document', read.errors)
    return HttpResponse.json<DocumentDto>(await saveDocument(id, read.write, read.file))
  }),
]
