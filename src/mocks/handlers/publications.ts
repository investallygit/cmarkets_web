import { http, HttpResponse } from 'msw'
import type {
  AttachmentDto,
  FrozenChartDto,
  FrozenChartPeriod,
  FrozenChartRequestDto,
  FrozenChartType,
  MyPublicationDto,
  PayoutDto,
  Permission,
  PublicationArchiveDto,
  PublicationCreateDto,
  PublicationPricingDto,
  PublicationPricingUpdateDto,
  PublicationRating,
  PublicationStatsDto,
  PublicationStatus,
  PublicationUpdateDto,
  SubjectType,
} from '@/shared/api/contracts'
import { periodRange } from '@/shared/lib/chartPeriods'
import { paidMonths } from '../admin'
import {
  analystStore,
  currentUser,
  publicationRules,
  publicationStore,
  readerContext,
  researchMarket,
  securities,
} from '../db'
import { COUNTRY_NAMES } from '../fixtures/research'
import { api, latency, noContent, problem } from '../lib/http'
import { createPdf } from '../lib/pdf'
import {
  draftErrors,
  hasChanges,
  latestVersion,
  monthOf,
  NO_DISCLOSURES,
  payoutsOf,
  pricingErrors,
  scoreOf,
  submissionErrors,
  sumMonths,
  type StoredContent,
  type StoredPublication,
} from '../lib/research'
import { mergeMonths, myPublication, publicationDto } from '../lib/researchViews'
import { isFirstPublication, publish, withReference } from '../publications'
import { isIsoDate } from '../lib/validation'

type Errors = Record<string, string[]>

const STATUSES: readonly PublicationStatus[] = ['draft', 'pending', 'published', 'archived']
const SUBJECT_TYPES: readonly SubjectType[] = ['company', 'country']
const RATINGS: readonly PublicationRating[] = [
  'buy',
  'hold',
  'sell',
  'positive',
  'stable',
  'negative',
]
const CHART_PERIODS: readonly FrozenChartPeriod[] = ['1M', '3M', '6M', '1Y', '5Y']
const CHART_TYPES: readonly FrozenChartType[] = ['line', 'candles']
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const MAX_PDF_SIZE = 10 * 1024 * 1024
/** Images are kept in the body as data URLs by the mock: a large one would fill localStorage. */
const MAX_BODY_LENGTH = 6 * 1024 * 1024
const MAX_REASON_LENGTH = 500
const MAX_CHART_TITLE_LENGTH = 80

const forbidden = (detail: string) => problem(403, 'Forbidden', detail)
const notFound = (id: unknown) =>
  problem(404, 'Publication not found', `No publication ${String(id)}.`)
const invalid = (title: string, errors: Errors) => problem(400, title, undefined, errors)
const changed = () =>
  problem(409, 'Publication changed', 'This publication was saved elsewhere meanwhile.')
const pick = <T extends string>(values: readonly T[], value: unknown): T | undefined =>
  values.find((candidate) => candidate === value)
const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === 'number' && Number.isFinite(value))

/** PDF attachments uploaded in this session; the mock does not keep files on reload. */
const attachmentFiles = new Map<string, Blob>()

/** The analyst the current account writes as, once an Admin approved the status. */
function studioAnalyst(permission: Permission = 'publications:write') {
  const user = currentUser()
  if (!user.permissions.includes(permission)) {
    return { error: forbidden('Only an Analyst account publishes research.') }
  }
  if (user.verificationStatus !== 'approved') {
    return { error: forbidden('Your Analyst status is waiting for the approval of an Admin.') }
  }
  const analyst = analystStore.read().find((candidate) => candidate.userId === user.id)
  return analyst ? { analyst } : { error: forbidden('No analyst profile for this account.') }
}

/** One of the analyst's own publications, with the whole list to write back. */
function ownPublication(id: unknown) {
  const { analyst, error } = studioAnalyst()
  if (error) return { error }
  const publications = publicationStore.read()
  const publication = publications.find((candidate) => candidate.id === id)
  if (!publication) return { error: notFound(id) }
  if (publication.analystId !== analyst.id) {
    return { error: forbidden('This publication belongs to another analyst.') }
  }
  return { publications, publication }
}

const subjectKnown = (type: SubjectType, id: string) =>
  type === 'company' ? securities.get(id)?.type === 'equity' : id in COUNTRY_NAMES

function readContent(body: Partial<PublicationUpdateDto>): {
  content?: StoredContent
  errors: Errors
} {
  const errors: Errors = {}
  const subjectType = pick(SUBJECT_TYPES, body.subjectType)
  if (!subjectType) errors.subjectType = ['Company or country.']
  const subjectId = typeof body.subjectId === 'string' && body.subjectId ? body.subjectId : null
  if (subjectType && subjectId && !subjectKnown(subjectType, subjectId)) {
    errors.subject = ['Unknown company or country.']
  }
  if (typeof body.title !== 'string') errors.title = ['A text.']
  if (typeof body.summary !== 'string') errors.summary = ['A text.']
  const docBody = body.body
  if (
    docBody?.type !== 'doc' ||
    (docBody.content !== undefined && !Array.isArray(docBody.content))
  ) {
    errors.body = ['A document of the editor.']
  } else if (JSON.stringify(docBody).length > MAX_BODY_LENGTH) {
    errors.body = ['Too long: use smaller images.']
  }
  const rating = body.rating === null ? null : pick(RATINGS, body.rating)
  if (rating === undefined) errors.rating = ['Unknown rating.']
  if (!isNullableNumber(body.targetPrice)) errors.targetPrice = ['A number.']
  if (!isNullableNumber(body.horizonMonths)) errors.horizonMonths = ['A number of months.']
  const dataDate = body.dataDate ?? null
  if (dataDate !== null && !isIsoDate(dataDate)) errors.dataDate = ['A date.']
  const disclosures = body.disclosures
  if (typeof disclosures !== 'object' || disclosures === null) errors.disclosures = ['Missing.']
  if (Object.keys(errors).length > 0 || !subjectType || !docBody || rating === undefined) {
    return { errors }
  }
  const content: StoredContent = {
    subjectType,
    subjectId,
    title: String(body.title),
    summary: String(body.summary),
    body: docBody,
    rating,
    targetPrice: subjectType === 'company' ? (body.targetPrice ?? null) : null,
    horizonMonths: subjectType === 'company' ? (body.horizonMonths ?? null) : null,
    referenceDate: null,
    referencePrice: null,
    dataDate: subjectType === 'country' ? dataDate : null,
    disclosures: {
      conflicts: disclosures?.conflicts === true,
      disclaimer: disclosures?.disclaimer === true,
      sources: disclosures?.sources === true,
    },
  }
  return { content, errors: draftErrors(content) }
}

function readPricing(
  body: Partial<PublicationPricingUpdateDto>,
): PublicationPricingDto | undefined {
  const access = body.access === 'free' || body.access === 'paid' ? body.access : undefined
  const { price = null, studentPrice = null, freeAfterMonths = null } = body
  if (!access || ![price, studentPrice, freeAfterMonths].every(isNullableNumber)) return undefined
  return access === 'free'
    ? { access, price: null, studentPrice: null, freeAfterMonths: null }
    : { access, price, studentPrice, freeAfterMonths }
}

function saved(publications: StoredPublication[], publication: StoredPublication) {
  publication.version += 1
  publication.savedAt = new Date().toISOString()
  publicationStore.write(publications)
  return HttpResponse.json(publicationDto(publication, readerContext()))
}

function checksOf(publication: StoredPublication): Errors {
  return submissionErrors(publication.draft, publication.pricing, publicationRules(), {
    access: publication.pricing.access,
    readFree: publication.readFree,
  })
}

async function dataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000))
  }
  return `data:${file.type};base64,${btoa(binary)}`
}

/**
 * Screen 7, the publishing studio: drafts saved by the editor, pricing, frozen charts,
 * attachments, submission with its automatic checks, updates, archiving and the earnings
 * (spec sections 10 and 13). Every change carries the row version it was read at.
 */
export const publicationHandlers = [
  http.get(api('/me/publications'), async ({ request }) => {
    await latency()
    const { analyst, error } = studioAnalyst()
    if (error) return error
    const status = pick(STATUSES, new URL(request.url).searchParams.get('status'))
    const context = readerContext()
    const items = publicationStore
      .read()
      .filter(
        (publication) =>
          publication.analystId === analyst.id && (!status || publication.status === status),
      )
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .map((publication) => myPublication(publication, context))
    return HttpResponse.json<MyPublicationDto[]>(items)
  }),

  http.post(api('/publications'), async ({ request }) => {
    await latency()
    const { analyst, error } = studioAnalyst()
    if (error) return error
    const body = (await request.json()) as Partial<PublicationCreateDto>
    const subjectType = pick(SUBJECT_TYPES, body.subjectType)
    const subjectId = typeof body.subjectId === 'string' ? body.subjectId : ''
    if (!subjectType || !subjectKnown(subjectType, subjectId)) {
      return invalid('Invalid publication', { subject: ['Choose a listed company or a country.'] })
    }
    const now = new Date().toISOString()
    const publication: StoredPublication = {
      id: `pub-${Date.now().toString(36)}`,
      analystId: analyst.id,
      status: 'draft',
      createdAt: now,
      savedAt: now,
      version: 1,
      draft: withReference({
        subjectType,
        subjectId,
        title: '',
        summary: '',
        body: { type: 'doc', content: [{ type: 'paragraph' }] },
        rating: null,
        targetPrice: null,
        horizonMonths: subjectType === 'company' ? 12 : null,
        referenceDate: null,
        referencePrice: null,
        dataDate: null,
        disclosures: { ...NO_DISCLOSURES },
      }),
      pricing: { access: 'free', price: null, studentPrice: null, freeAfterMonths: null },
      attachment: null,
      charts: [],
      versions: [],
      archiveReason: null,
      readFree: false,
      monthly: {},
    }
    publicationStore.write([...publicationStore.read(), publication])
    return HttpResponse.json(publicationDto(publication, readerContext()), { status: 201 })
  }),

  http.get(api('/publications/:id'), async ({ params }) => {
    await latency()
    const { publication, error } = ownPublication(params.id)
    if (error) return error
    return HttpResponse.json(publicationDto(publication, readerContext()))
  }),

  http.put(api('/publications/:id'), async ({ params, request }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    const body = (await request.json()) as Partial<PublicationUpdateDto>
    if (body.version !== publication.version) return changed()
    if (publication.status === 'archived') {
      return problem(409, 'Publication archived', 'An archived publication cannot change.')
    }
    if (publication.status === 'pending') {
      return problem(409, 'In moderation', 'Wait for the moderator before changing it.')
    }
    const { content, errors } = readContent(body)
    if (!content || Object.keys(errors).length > 0) return invalid('Invalid publication', errors)
    const { draft } = publication
    const sameSubject =
      content.subjectType === draft.subjectType && content.subjectId === draft.subjectId
    if (!sameSubject && publication.versions.length > 0) {
      return invalid('Invalid publication', {
        subject: ['A published publication keeps its subject.'],
      })
    }
    publication.draft = sameSubject
      ? { ...content, referenceDate: draft.referenceDate, referencePrice: draft.referencePrice }
      : withReference(content)
    return saved(publications, publication)
  }),

  http.put(api('/publications/:id/pricing'), async ({ params, request }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    const body = (await request.json()) as Partial<PublicationPricingUpdateDto>
    if (body.version !== publication.version) return changed()
    if (publication.status === 'archived') {
      return problem(409, 'Publication archived', 'An archived publication cannot change.')
    }
    const pricing = readPricing(body)
    if (!pricing) return invalid('Invalid pricing', { access: ['Free or paid, prices in XAF.'] })
    const errors = pricingErrors(pricing, publicationRules(), {
      access: publication.pricing.access,
      readFree: publication.readFree,
    })
    if (Object.keys(errors).length > 0) return invalid('Invalid pricing', errors)
    publication.pricing = pricing
    return saved(publications, publication)
  }),

  http.post(api('/publications/:id/submit'), async ({ params }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    if (publication.status !== 'draft') {
      return problem(409, 'Already submitted', 'This publication was submitted already.')
    }
    const errors = checksOf(publication)
    if (Object.keys(errors).length > 0) {
      return problem(422, 'Publication incomplete', undefined, errors)
    }
    // Before publication, a moderator approves it; after, it is out at once (spec section 13),
    // unless it is the analyst's first.
    if (
      publicationRules().moderation === 'after' &&
      !isFirstPublication(publication.analystId, publication.id)
    ) {
      publish(publication)
    } else {
      publication.draft = withReference(publication.draft)
      publication.status = 'pending'
    }
    return saved(publications, publication)
  }),

  http.post(api('/publications/:id/versions'), async ({ params }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    if (publication.status !== 'published') {
      return problem(409, 'Not published', 'Only a published publication gets updates.')
    }
    if (!hasChanges(publication)) {
      return problem(409, 'Nothing to publish', 'No change since the latest version.')
    }
    const errors = checksOf(publication)
    if (Object.keys(errors).length > 0) {
      return problem(422, 'Publication incomplete', undefined, errors)
    }
    publish(publication)
    return saved(publications, publication)
  }),

  http.post(api('/publications/:id/archive'), async ({ params, request }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    if (publication.status === 'archived') return problem(409, 'Already archived')
    const { reason } = (await request.json()) as Partial<PublicationArchiveDto>
    const text = typeof reason === 'string' ? reason.trim() : ''
    if (!text || text.length > MAX_REASON_LENGTH) {
      return invalid('Invalid archive', {
        reason: [`A reason, at most ${MAX_REASON_LENGTH} characters.`],
      })
    }
    publication.status = 'archived'
    publication.archiveReason = text
    return saved(publications, publication)
  }),

  // Frozen at insertion: the bars are copied, later prices do not change the chart.
  http.post(api('/publications/:id/charts'), async ({ params, request }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    const body = (await request.json()) as Partial<FrozenChartRequestDto>
    const security =
      typeof body.securityId === 'string' ? securities.get(body.securityId) : undefined
    const period = pick(CHART_PERIODS, body.period)
    const type = pick(CHART_TYPES, body.type)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const errors: Errors = {}
    if (!security) errors.securityId = ['Unknown security.']
    if (!period) errors.period = ['1M, 3M, 6M, 1Y or 5Y.']
    if (!type) errors.type = ['Line or candles.']
    if (title.length > MAX_CHART_TITLE_LENGTH) {
      errors.title = [`At most ${MAX_CHART_TITLE_LENGTH} characters.`]
    }
    if (!security || !period || !type || Object.keys(errors).length > 0) {
      return invalid('Invalid chart', errors)
    }
    const range = periodRange(period)
    const chart: FrozenChartDto = {
      id: `chart-${Date.now().toString(36)}`,
      securityId: security.id,
      code: security.code,
      title: title || `${security.code} · ${period}`,
      period,
      type,
      currency: security.currency,
      frozenAt: range.to,
      bars: researchMarket().bars(
        security.id,
        range.from,
        range.to,
        range.interval === '1w' ? '1w' : '1d',
      ),
    }
    publication.charts.push(chart)
    publicationStore.write(publications)
    return HttpResponse.json(chart, { status: 201 })
  }),

  // An image goes in the body (the mock answers with a data URL); a PDF is the attachment.
  http.post(api('/publications/:id/attachments'), async ({ params, request }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) return invalid('Invalid attachment', { file: ['Choose a file.'] })
    const id = `attachment-${Date.now().toString(36)}`
    if (IMAGE_TYPES.includes(file.type)) {
      if (file.size > MAX_IMAGE_SIZE) {
        return invalid('Invalid attachment', { file: ['An image of 2 MB at most.'] })
      }
      const image: AttachmentDto = {
        id,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        url: await dataUrl(file),
      }
      return HttpResponse.json(image, { status: 201 })
    }
    if (file.type !== 'application/pdf') {
      return invalid('Invalid attachment', { file: ['A PDF, or a PNG, JPEG, WebP or GIF image.'] })
    }
    if (file.size > MAX_PDF_SIZE) {
      return invalid('Invalid attachment', { file: ['A PDF of 10 MB at most.'] })
    }
    attachmentFiles.set(id, file)
    publication.attachment = {
      id,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      url: `/publications/${publication.id}/attachments/${id}`,
    }
    publicationStore.write(publications)
    return HttpResponse.json(publication.attachment, { status: 201 })
  }),

  http.get(api('/publications/:id/attachments/:attachmentId'), async ({ params }) => {
    await latency()
    const { publication, error } = ownPublication(params.id)
    if (error) return error
    const { attachment } = publication
    if (!attachment || attachment.id !== params.attachmentId) return notFound(params.attachmentId)
    const file =
      attachmentFiles.get(attachment.id) ??
      new Blob([createPdf(attachment.fileName, [publication.draft.title])])
    return new HttpResponse(file, { headers: { 'Content-Type': 'application/pdf' } })
  }),

  http.delete(api('/publications/:id/attachments/:attachmentId'), async ({ params }) => {
    await latency()
    const { publications, publication, error } = ownPublication(params.id)
    if (error) return error
    const { attachment } = publication
    if (!attachment || attachment.id !== params.attachmentId) return notFound(params.attachmentId)
    attachmentFiles.delete(attachment.id)
    publication.attachment = null
    publicationStore.write(publications)
    return noContent()
  }),

  http.get(api('/me/publications/stats'), async ({ request }) => {
    await latency()
    const { analyst, error } = studioAnalyst('publications:earnings')
    if (error) return error
    const query = new URL(request.url).searchParams
    const today = readerContext().today
    const from = query.get('from') ?? `${monthOf(today)}-01`
    const to = query.get('to') ?? today
    if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
      return invalid('Invalid period', { from: ['Two dates, from before to.'] })
    }
    const mine = publicationStore
      .read()
      .filter((publication) => publication.analystId === analyst.id)
    const [fromMonth, toMonth] = [monthOf(from), monthOf(to)]
    const items = mine.flatMap((publication) => {
      const stats = sumMonths(publication.monthly, fromMonth, toMonth)
      if (stats.reads === 0 && stats.sales === 0 && stats.starCount === 0) return []
      return [
        {
          publicationId: publication.id,
          title: latestVersion(publication)?.content.title ?? publication.draft.title,
          reads: stats.reads,
          sales: stats.sales,
          revenue: stats.revenue,
          score: scoreOf(stats),
          scoreCount: stats.starCount,
        },
      ]
    })
    const totals = sumMonths(mergeMonths(mine), fromMonth, toMonth)
    const { commissionPct } = publicationRules()
    const commission = Math.round((totals.revenue * commissionPct) / 100)
    return HttpResponse.json<PublicationStatsDto>({
      from,
      to,
      items: items.sort((a, b) => b.revenue - a.revenue || b.reads - a.reads),
      reads: totals.reads,
      sales: totals.sales,
      revenue: totals.revenue,
      commission,
      net: totals.revenue - commission,
      commissionPct,
      score: scoreOf(totals),
      scoreCount: totals.starCount,
      followers: analyst.followers,
    })
  }),

  http.get(api('/me/payouts'), async () => {
    await latency()
    const { analyst, error } = studioAnalyst('publications:earnings')
    if (error) return error
    const mine = publicationStore
      .read()
      .filter((publication) => publication.analystId === analyst.id)
    return HttpResponse.json<PayoutDto[]>(
      payoutsOf(
        mergeMonths(mine),
        publicationRules().commissionPct,
        readerContext().today,
        paidMonths(analyst.id),
      ),
    )
  }),
]
