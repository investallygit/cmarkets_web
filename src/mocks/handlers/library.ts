import { http, HttpResponse } from 'msw'
import type {
  ContentReportDto,
  ContentReportReason,
  FollowResultDto,
  LibraryItemDto,
  LibrarySort,
  Paged,
  PaymentDto,
  Permission,
  PublicationAccess,
  PublicationRating,
  PublicationRulesDto,
  PurchaseRequestDto,
  RatingRequestDto,
  RatingResultDto,
  SubjectType,
} from '@/shared/api/contracts'
import { formatIsoDate, formatNumber } from '@/shared/lib/format'
import { docBlocks } from '@/shared/lib/richText'
import {
  analystStore,
  contentReportStore,
  currentAccount,
  currentUser,
  followStore,
  invoiceStore,
  myRatingStore,
  publicationRules,
  publicationStore,
  purchaseStore,
  readerContext,
  readStore,
  researchMarket,
} from '../db'
import { TAX_RATE_PCT } from '../fixtures/billing'
import { invoiceNumber, publicationInvoice } from '../lib/billing'
import { api, latency, noContent, paginate, problem } from '../lib/http'
import { newId } from '../lib/ids'
import { createPdf } from '../lib/pdf'
import {
  EMPTY_MONTH,
  latestVersion,
  matchesLibraryFilter,
  monthOf,
  scoreOf,
  sortLibrary,
  sumMonths,
  type LibraryFilter,
  type StoredPublication,
} from '../lib/research'
import { analystProfile, libraryItem, libraryPublication } from '../lib/researchViews'
import { newPaymentId, settleDue, startPayment } from '../payments'

const MAX_COMMENT_LENGTH = 1000

const SUBJECT_TYPES: readonly SubjectType[] = ['company', 'country']
const ACCESSES: readonly PublicationAccess[] = ['free', 'paid']
const RATINGS: readonly PublicationRating[] = [
  'buy',
  'hold',
  'sell',
  'positive',
  'stable',
  'negative',
]
const SORTS: readonly LibrarySort[] = ['recent', 'rating', 'reads', 'price']
const REPORT_REASONS: readonly ContentReportReason[] = [
  'misleading',
  'conflict',
  'copyright',
  'other',
]

const allowed = (permission: Permission) => currentUser().permissions.includes(permission)
const forbidden = (detail: string) => problem(403, 'Forbidden', detail)
const notFound = (id: unknown) =>
  problem(404, 'Publication not found', `No publication ${String(id)}.`)

const pick = <T extends string>(values: readonly T[], value: string | null): T | undefined =>
  values.find((candidate) => candidate === value)

function readFilter(query: URLSearchParams): LibraryFilter {
  return {
    subjectType: pick(SUBJECT_TYPES, query.get('subjectType')),
    subjectId: query.get('subjectId') || undefined,
    country: query.get('country') || undefined,
    sector: query.get('sector') || undefined,
    access: pick(ACCESSES, query.get('access')),
    rating: pick(RATINGS, query.get('rating')),
    q: query.get('q')?.trim() || undefined,
    analystId: query.get('analystId') || undefined,
    analystIds:
      query.get('followed') === 'true'
        ? new Set(followStore.read().map((follow) => follow.analystId))
        : undefined,
  }
}

function findPublication(id: unknown) {
  const publications = publicationStore.read()
  return { publications, publication: publications.find((candidate) => candidate.id === id) }
}

/** The month a read, a sale or a rating counts in. */
function currentMonth(publication: StoredPublication) {
  const month = monthOf(readerContext().today)
  return (publication.monthly[month] ??= { ...EMPTY_MONTH })
}

/** Once paid, the reader owns the publication and the analyst has a sale; the receipt follows. */
function recordPurchase(payment: PaymentDto): void {
  const { publications, publication } = findPublication(payment.publicationId)
  if (!publication || !payment.confirmedAt) return
  const month = currentMonth(publication)
  month.sales += 1
  month.revenue += payment.amount
  publicationStore.write(publications)
  purchaseStore.write([
    ...purchaseStore.read(),
    {
      publicationId: publication.id,
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      purchasedAt: payment.confirmedAt,
    },
  ])
  const invoices = invoiceStore.read()
  invoices.push(
    publicationInvoice({
      id: `invoice-${payment.id}`,
      number: invoiceNumber(invoices, payment.confirmedAt),
      userId: currentAccount().id,
      title: latestVersion(publication)?.content.title ?? publication.draft.title,
      total: payment.amount,
      taxRatePct: TAX_RATE_PCT,
      method: payment.method,
      paidAt: payment.confirmedAt,
    }),
  )
  invoiceStore.write(invoices)
}

const PDF_WORDS = {
  en: {
    summary: 'SUMMARY',
    disclosures: 'DISCLOSURES',
    conflicts: 'The analyst declares no conflict of interest with the subject.',
    disclaimer: 'This publication is not personalized investment advice.',
    sources: 'Sources and dates of the data are cited in the text.',
    reference: (price: string, date: string) => `Reference price ${price} on ${date}.`,
    dataDate: (date: string) => `Data as of ${date}.`,
    target: 'target',
    chart: (title: string, date: string) => `[Chart: ${title}, frozen on ${date}]`,
    image: 'Image',
    version: (number: number, date: string) => `Version ${number} of ${date}.`,
    ratings: {
      buy: 'Buy',
      hold: 'Hold',
      sell: 'Sell',
      positive: 'Positive outlook',
      stable: 'Stable outlook',
      negative: 'Negative outlook',
    },
  },
  fr: {
    summary: 'RÉSUMÉ',
    disclosures: 'MENTIONS OBLIGATOIRES',
    conflicts: "L'analyste déclare n'avoir aucun conflit d'intérêts avec le sujet.",
    disclaimer: "Cette publication n'est pas un conseil en investissement personnalisé.",
    sources: 'Les sources et dates des données sont citées dans le texte.',
    reference: (price: string, date: string) => `Cours de référence ${price} au ${date}.`,
    dataDate: (date: string) => `Données au ${date}.`,
    target: 'objectif',
    chart: (title: string, date: string) => `[Graphique : ${title}, figé au ${date}]`,
    image: 'Image',
    version: (number: number, date: string) => `Version ${number} du ${date}.`,
    ratings: {
      buy: 'Achat',
      hold: 'Conserver',
      sell: 'Vente',
      positive: 'Perspective positive',
      stable: 'Perspective stable',
      negative: 'Perspective négative',
    },
  },
} as const

/** Lines of about 86 characters of 11 pt Helvetica on A4. */
function wrap(text: string, width = 86): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (line && line.length + word.length + 1 > width) {
        lines.push(line)
        line = word
      } else line = line ? `${line} ${word}` : word
    }
    lines.push(line)
  }
  return lines
}

/** The PDF of the latest version: the text, charts and images named, and the disclosures. */
function publicationPdf(
  publication: StoredPublication,
  language: 'en' | 'fr',
  watermark: string | undefined,
) {
  const latest = latestVersion(publication)
  const analyst = analystStore.read().find((candidate) => candidate.id === publication.analystId)
  if (!latest) return undefined
  const words = PDF_WORDS[language]
  const { content } = latest
  const number = (value: number) => formatNumber(value, language, 0)
  const date = (iso: string) => formatIsoDate(iso.slice(0, 10))
  const subject = content.subjectType === 'company' ? content.subjectId : null
  const rating = content.rating
    ? [
        words.ratings[content.rating],
        content.targetPrice ? `${words.target} ${number(content.targetPrice)}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : ''
  const lines = [
    [analyst?.displayName, date(publication.versions[0].publishedAt), subject]
      .filter(Boolean)
      .join(' · '),
    rating,
    '',
    words.summary,
    ...wrap(content.summary),
  ]
  for (const block of docBlocks(content.body)) {
    if (block.kind === 'heading') lines.push('', block.text)
    else if (block.kind === 'item') lines.push(...wrap(`- ${block.text}`))
    else if (block.kind === 'image')
      lines.push(`[${words.image}${block.text ? `: ${block.text}` : ''}]`)
    else if (block.kind === 'chart') {
      const chart = publication.charts.find((candidate) => candidate.id === block.chartId)
      if (chart) lines.push(words.chart(chart.title, formatIsoDate(chart.frozenAt)))
    } else lines.push(...wrap(block.text))
  }
  lines.push('', words.disclosures, ...wrap(words.conflicts), ...wrap(words.disclaimer))
  lines.push(...wrap(words.sources))
  if (content.referencePrice && content.referenceDate) {
    lines.push(
      words.reference(number(content.referencePrice), formatIsoDate(content.referenceDate)),
    )
  }
  if (content.dataDate) lines.push(words.dataDate(formatIsoDate(content.dataDate)))
  lines.push(words.version(latest.number, date(latest.publishedAt)))
  return createPdf(content.title, lines, { watermark })
}

/**
 * Screen 8, the research library: the catalogue with its filters, the preview or the full
 * content, purchase by mobile money or card, the watermarked PDF, ratings, reports, and the
 * analysts' public profiles (spec sections 10 and 13).
 */
export const libraryHandlers = [
  http.get(api('/publications/rules'), async () => {
    await latency()
    return HttpResponse.json<PublicationRulesDto>(publicationRules())
  }),

  http.get(api('/library'), async ({ request }) => {
    await latency()
    if (!allowed('research:read')) return forbidden('This account cannot read research.')
    settleDue(currentAccount().id)
    const query = new URL(request.url).searchParams
    const context = readerContext()
    const filter = readFilter(query)
    const items = publicationStore.read().flatMap((publication) => {
      if (publication.status !== 'published') return []
      const item = libraryItem(publication, context)
      return item && matchesLibraryFilter(item, filter) ? [item] : []
    })
    const sorted = sortLibrary(items, pick(SORTS, query.get('sort')) ?? 'recent')
    return HttpResponse.json<Paged<LibraryItemDto>>(paginate(sorted, query))
  }),

  // The prototype filters purchases like the library, for the Purchased tab.
  http.get(api('/me/purchases'), async ({ request }) => {
    await latency()
    settleDue(currentAccount().id)
    const query = new URL(request.url).searchParams
    const context = readerContext()
    const filter = readFilter(query)
    const items = publicationStore.read().flatMap((publication) => {
      if (!context.purchases.has(publication.id)) return []
      const item = libraryItem(publication, context)
      return item && matchesLibraryFilter(item, filter) ? [item] : []
    })
    const sort = pick(SORTS, query.get('sort'))
    const sorted = sort
      ? sortLibrary(items, sort)
      : items.sort((a, b) => (b.purchasedAt ?? '').localeCompare(a.purchasedAt ?? ''))
    return HttpResponse.json<Paged<LibraryItemDto>>(paginate(sorted, query))
  }),

  http.get(api('/library/:id'), async ({ params }) => {
    await latency()
    if (!allowed('research:read')) return forbidden('This account cannot read research.')
    settleDue(currentAccount().id)
    const { publications, publication } = findPublication(params.id)
    if (!publication) return notFound(params.id)
    const context = readerContext()
    const dto = libraryPublication(publication, context)
    if (!dto) return notFound(params.id)
    // Withdrawn: its buyers keep the version they bought (spec section 13).
    if (publication.status === 'archived' && !dto.purchasedAt && !dto.isAuthor) {
      return problem(410, 'Publication withdrawn', 'The analyst withdrew this publication.')
    }
    // A reader is counted once; a free publication read once can no longer become paid.
    if (dto.hasAccess && !dto.isAuthor && !dto.isRead) {
      currentMonth(publication).reads += 1
      if (dto.access === 'free') publication.readFree = true
      publicationStore.write(publications)
      readStore.write([...readStore.read(), { publicationId: publication.id }])
      dto.isRead = true
      dto.reads += 1
    }
    return HttpResponse.json(dto)
  }),

  http.post(api('/library/:id/purchase'), async ({ params, request }) => {
    await latency()
    if (!allowed('research:buy')) {
      return forbidden('Paid research is bought with a client account.')
    }
    const { publication } = findPublication(params.id)
    const dto = publication && libraryPublication(publication, readerContext())
    if (!publication || !dto || publication.status !== 'published') return notFound(params.id)
    if (dto.isAuthor) return problem(409, 'Own publication', 'You wrote this publication.')
    if (dto.access === 'free') return problem(409, 'Free publication', 'It is free to read.')
    if (dto.purchasedAt) return problem(409, 'Already bought', 'You bought it already.')
    const body = (await request.json()) as Partial<PurchaseRequestDto>
    if (body.method !== 'mobileMoney' && body.method !== 'card') {
      return problem(400, 'Invalid purchase', undefined, { method: ['Mobile money or card.'] })
    }
    const digits = (body.phone ?? '').replace(/[\s.+-]/g, '')
    if (body.method === 'mobileMoney' && !/^\d{8,15}$/.test(digits)) {
      return problem(400, 'Invalid purchase', undefined, {
        phone: ['A mobile money number, e.g. +237 6 70 12 34 56.'],
      })
    }
    const payment: PaymentDto = {
      id: newPaymentId(),
      purpose: 'publication',
      publicationId: publication.id,
      planId: null,
      amount: dto.priceToPay ?? 0,
      currency: 'XAF',
      method: body.method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      failureReason: null,
    }
    startPayment(payment, {
      userId: currentAccount().id,
      phone: body.phone ?? null,
      onConfirmed: recordPurchase,
    })
    return HttpResponse.json(payment, { status: 202 })
  }),

  http.get(api('/library/:id/pdf'), async ({ params, request }) => {
    await latency()
    const { publication } = findPublication(params.id)
    const dto = publication && libraryPublication(publication, readerContext())
    if (!publication || !dto) return notFound(params.id)
    if (!dto.hasAccess) return forbidden('Buy the publication to download it.')
    const language = new URL(request.url).searchParams.get('language') === 'fr' ? 'fr' : 'en'
    const watermark =
      dto.watermark &&
      `${dto.watermark.name} - ${formatIsoDate(dto.watermark.purchasedAt.slice(0, 10))}`
    const pdf = publicationPdf(publication, language, watermark ?? undefined)
    if (!pdf) return notFound(params.id)
    return new HttpResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${publication.id}.pdf"`,
      },
    })
  }),

  // The prototype's way to the attachment of a readable publication.
  http.get(api('/library/:id/attachment'), async ({ params }) => {
    await latency()
    const { publication } = findPublication(params.id)
    const dto = publication && libraryPublication(publication, readerContext())
    if (!publication?.attachment || !dto) return notFound(params.id)
    if (!dto.hasAccess) return forbidden('Buy the publication to download its attachment.')
    return new HttpResponse(
      createPdf(publication.attachment.fileName, [dto.title, '', ...wrap(dto.summary)]),
      { headers: { 'Content-Type': 'application/pdf' } },
    )
  }),

  http.post(api('/library/:id/rating'), async ({ params, request }) => {
    await latency()
    const { publications, publication } = findPublication(params.id)
    const dto = publication && libraryPublication(publication, readerContext())
    if (!publication || !dto) return notFound(params.id)
    if (!dto.canRate) return forbidden('Read the publication to rate it; authors do not rate.')
    const { stars } = (await request.json()) as Partial<RatingRequestDto>
    if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 1 || stars > 5) {
      return problem(400, 'Invalid rating', undefined, { stars: ['From 1 to 5 stars.'] })
    }
    const ratings = myRatingStore.read()
    const previous = ratings.find((rating) => rating.publicationId === publication.id)
    if (previous) {
      const month = (publication.monthly[previous.month] ??= { ...EMPTY_MONTH })
      month.starSum -= previous.stars
      month.starCount -= 1
    }
    const month = currentMonth(publication)
    month.starSum += stars
    month.starCount += 1
    publicationStore.write(publications)
    myRatingStore.write([
      ...ratings.filter((rating) => rating !== previous),
      { publicationId: publication.id, stars, month: monthOf(readerContext().today) },
    ])
    const totals = sumMonths(publication.monthly)
    return HttpResponse.json<RatingResultDto>({
      score: scoreOf(totals),
      scoreCount: totals.starCount,
      myRating: stars,
    })
  }),

  http.post(api('/library/:id/report'), async ({ params, request }) => {
    await latency()
    const { publication } = findPublication(params.id)
    if (!publication || publication.versions.length === 0) return notFound(params.id)
    const body = (await request.json()) as Partial<ContentReportDto>
    const reason = pick(REPORT_REASONS, body.reason ?? null)
    const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
    const errors: Record<string, string[]> = {}
    if (!reason) errors.reason = ['Choose a reason.']
    if (reason === 'other' && !comment) errors.comment = ['Say what is wrong.']
    if (comment.length > MAX_COMMENT_LENGTH) {
      errors.comment = [`At most ${MAX_COMMENT_LENGTH} characters.`]
    }
    if (!reason || Object.keys(errors).length > 0) {
      return problem(400, 'Invalid report', undefined, errors)
    }
    contentReportStore.write([
      ...contentReportStore.read(),
      {
        id: newId('report'),
        publicationId: publication.id,
        userId: currentUser().id,
        reason,
        comment,
        reportedAt: new Date().toISOString(),
        status: 'open',
        closedAt: null,
        closedBy: null,
        outcome: null,
      },
    ])
    return noContent()
  }),

  http.get(api('/analysts/:id'), async ({ params }) => {
    await latency()
    const analyst = analystStore.read().find((candidate) => candidate.id === params.id)
    if (!analyst) return problem(404, 'Analyst not found', `No analyst ${String(params.id)}.`)
    const market = researchMarket()
    const context = readerContext()
    return HttpResponse.json(
      analystProfile(analyst, publicationStore.read(), {
        today: context.today,
        security: context.security,
        closeOn: market.closeOn,
        isFollowed: followStore.read().some((follow) => follow.analystId === analyst.id),
        isSelf: analyst.userId === context.user.id,
      }),
    )
  }),

  ...(['post', 'delete'] as const).map((method) =>
    http[method](api('/analysts/:id/follow'), async ({ params }) => {
      await latency()
      const analysts = analystStore.read()
      const analyst = analysts.find((candidate) => candidate.id === params.id)
      if (!analyst) return problem(404, 'Analyst not found', `No analyst ${String(params.id)}.`)
      if (analyst.userId === currentUser().id) {
        return problem(409, 'Own profile', 'You cannot follow yourself.')
      }
      const follows = followStore.read()
      const isFollowed = follows.some((follow) => follow.analystId === analyst.id)
      if (method === 'post' && !isFollowed) {
        followStore.write([...follows, { analystId: analyst.id }])
        analyst.followers += 1
      }
      if (method === 'delete' && isFollowed) {
        followStore.write(follows.filter((follow) => follow.analystId !== analyst.id))
        analyst.followers -= 1
      }
      analystStore.write(analysts)
      return HttpResponse.json<FollowResultDto>({
        isFollowed: method === 'post',
        followers: analyst.followers,
      })
    }),
  ),
]
