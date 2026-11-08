import type {
  AnalystDto,
  AttachmentDto,
  ContentReportDto,
  FollowResultDto,
  FrozenChartDto,
  FrozenChartRequestDto,
  LibraryItemDto,
  LibraryPublicationDto,
  LibrarySort,
  MyPublicationDto,
  Paged,
  PaymentDto,
  PayoutDto,
  PublicationAccess,
  PublicationCreateDto,
  PublicationDto,
  PublicationPricingUpdateDto,
  PublicationRating,
  PublicationRulesDto,
  PublicationStatsDto,
  PublicationUpdateDto,
  PurchaseRequestDto,
  RatingResultDto,
  SubjectType,
} from '../contracts'
import { answer, route, send, sendBlob, sendForm } from './define'

/** The filters of the library (screen 8) and of the ANA tab of a security, and the page. */
export interface LibraryFilters {
  subjectType?: SubjectType
  subjectId?: string
  country?: string
  sector?: string
  access?: PublicationAccess
  rating?: PublicationRating
  sort?: LibrarySort
  q?: string
  /** One analyst's publications. */
  analystId?: string
  /** The analysts the user follows. */
  followed?: boolean
  page: number
  pageSize: number
}

/** A step of a publication's lifecycle. */
export type PublicationStep = { kind: 'submit' | 'versions' } | { kind: 'archive'; reason: string }

/**
 * CMarket.Api/Controllers/Research: the library and its purchases, the analysts' studio, their
 * statistics and payouts, the analysts' public profiles.
 */
export const researchRoutes = {
  library: route('GET', '/library', answer<Paged<LibraryItemDto>>()),
  purchases: route('GET', '/me/purchases', answer<Paged<LibraryItemDto>>()),
  libraryPublication: route('GET', '/library/{id}', answer<LibraryPublicationDto>()),
  purchase: route('POST', '/library/{id}/purchase', answer<PaymentDto>()),
  rate: route('POST', '/library/{id}/rating', answer<RatingResultDto>()),
  report: route('POST', '/library/{id}/report'),
  pdf: route('GET', '/library/{id}/pdf', answer<Blob>()),
  libraryAttachment: route('GET', '/library/{id}/attachment', answer<Blob>()),
  myPublications: route('GET', '/me/publications', answer<MyPublicationDto[]>()),
  stats: route('GET', '/me/publications/stats', answer<PublicationStatsDto>()),
  payouts: route('GET', '/me/payouts', answer<PayoutDto[]>()),
  rules: route('GET', '/publications/rules', answer<PublicationRulesDto>()),
  create: route('POST', '/publications', answer<PublicationDto>()),
  publication: route('GET', '/publications/{id}', answer<PublicationDto>()),
  save: route('PUT', '/publications/{id}', answer<PublicationDto>()),
  savePricing: route('PUT', '/publications/{id}/pricing', answer<PublicationDto>()),
  submit: route('POST', '/publications/{id}/submit', answer<PublicationDto>()),
  newVersion: route('POST', '/publications/{id}/versions', answer<PublicationDto>()),
  archive: route('POST', '/publications/{id}/archive', answer<PublicationDto>()),
  freezeChart: route('POST', '/publications/{id}/charts', answer<FrozenChartDto>()),
  uploadAttachment: route('POST', '/publications/{id}/attachments', answer<AttachmentDto>()),
  attachmentFile: route('GET', '/publications/{id}/attachments/{attachmentId}', answer<Blob>()),
  removeAttachment: route('DELETE', '/publications/{id}/attachments/{attachmentId}'),
  analyst: route('GET', '/analysts/{id}', answer<AnalystDto>()),
  follow: route('POST', '/analysts/{id}/follow', answer<FollowResultDto>()),
  unfollow: route('DELETE', '/analysts/{id}/follow', answer<FollowResultDto>()),
}

const of = (id: string, signal?: AbortSignal) => ({ params: { id }, signal })

export const researchApi = {
  library: (filters: LibraryFilters, signal?: AbortSignal) =>
    send(researchRoutes.library, { query: { ...filters }, signal }),
  /** The Purchased tab: the same filters over the user's purchases. */
  purchases: (filters: LibraryFilters, signal?: AbortSignal) =>
    send(researchRoutes.purchases, { query: { ...filters }, signal }),
  /** The preview, or the full content when the user may read it. */
  libraryPublication: (id: string, signal?: AbortSignal) =>
    send(researchRoutes.libraryPublication, of(id, signal)),
  /** Starts a payment by mobile money or card, followed with subscriptionsApi.payment. */
  purchase: (id: string, request: PurchaseRequestDto) =>
    send(researchRoutes.purchase, { params: { id }, body: request }),
  /** 1 to 5 stars, the reader's again if rated before. */
  rate: (id: string, stars: number) =>
    send(researchRoutes.rate, { params: { id }, body: { stars } }),
  /** For the moderators (screen 9). */
  report: (id: string, report: ContentReportDto) =>
    send(researchRoutes.report, { params: { id }, body: report }),
  /** Watermarked with the buyer's name. */
  pdf: (id: string, language: string) =>
    sendBlob(researchRoutes.pdf, { params: { id }, query: { language } }),
  /** The attachment of a publication the user may read. */
  libraryAttachment: (id: string) => sendBlob(researchRoutes.libraryAttachment, { params: { id } }),
  /** The analyst's own, newest change first. */
  myPublications: (signal?: AbortSignal) => send(researchRoutes.myPublications, { signal }),
  stats: (from: string, to: string, signal?: AbortSignal) =>
    send(researchRoutes.stats, { query: { from, to }, signal }),
  /** One statement a month. */
  payouts: (signal?: AbortSignal) => send(researchRoutes.payouts, { signal }),
  /** The price range, the commission and the moderation mode. */
  rules: (signal?: AbortSignal) => send(researchRoutes.rules, { signal }),
  /** A draft on a company or a country. */
  create: (input: PublicationCreateDto) => send(researchRoutes.create, { body: input }),
  /** The working copy. */
  publication: (id: string, signal?: AbortSignal) =>
    send(researchRoutes.publication, of(id, signal)),
  /** The autosave; a 409 means the copy was saved elsewhere. */
  save: (id: string, input: PublicationUpdateDto) =>
    send(researchRoutes.save, { params: { id }, body: input }),
  /** Once published, readers get the new price at once. */
  savePricing: (id: string, input: PublicationPricingUpdateDto) =>
    send(researchRoutes.savePricing, { params: { id }, body: input }),
  step: (id: string, step: PublicationStep) =>
    step.kind === 'archive'
      ? send(researchRoutes.archive, { params: { id }, body: { reason: step.reason } })
      : send(step.kind === 'submit' ? researchRoutes.submit : researchRoutes.newVersion, {
          params: { id },
        }),
  /** The chart's data is copied as of today. */
  freezeChart: (id: string, request: FrozenChartRequestDto) =>
    send(researchRoutes.freezeChart, { params: { id }, body: request }),
  /** An image of the body, or the PDF attachment. */
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return sendForm(researchRoutes.uploadAttachment, form, { params: { id } })
  },
  /** The PDF of the analyst's own publication, in the studio (its attachment's url). */
  attachmentFile: (id: string, attachmentId: string) =>
    sendBlob(researchRoutes.attachmentFile, { params: { id, attachmentId } }),
  removeAttachment: (id: string, attachmentId: string) =>
    send(researchRoutes.removeAttachment, { params: { id, attachmentId } }),
  /** The public profile and the history of the analyst's ratings. */
  analyst: (id: string, signal?: AbortSignal) => send(researchRoutes.analyst, of(id, signal)),
  follow: (id: string, follow: boolean) =>
    send(follow ? researchRoutes.follow : researchRoutes.unfollow, { params: { id } }),
}
