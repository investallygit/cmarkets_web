import type { AccountStatus } from './admin'
import type { IsoDateTime } from './common'
import type { VerificationStatus } from './me'
import type {
  NewsCategory,
  NewsChannel,
  NewsFileDto,
  NewsItemSourceDto,
  NewsLanguage,
  NewsType,
} from './news'
import type { ContentReportReason, RichTextDoc } from './research'

/**
 * When a moderator reviews a newspaper's items, or those of CMarket's AI (spec section 16, set
 * by the Admin on SRC): `after` their publication (a verified newspaper's default, the AI's
 * "automatic"), or `before` it (the AI's "approval").
 */
export const NEWS_MODERATIONS = ['after', 'before'] as const
export type NewsModeration = (typeof NEWS_MODERATIONS)[number]

/** Why an item waits for a moderator. */
export type NewsHoldReason = 'sourceModeration' | 'aiApproval' | 'lowConfidence'

/** Why an item is in the moderation queue. */
export const NEWS_QUEUE_KINDS = ['reported', 'pending'] as const
export type NewsQueueKind = (typeof NEWS_QUEUE_KINDS)[number]

/** The status of any item, as the moderators see it. */
export type NewsStatus = 'draft' | 'pending' | 'scheduled' | 'published' | 'withdrawn'

/** A reader's report on an item. */
export interface NewsReportDto {
  id: string
  reason: ContentReportReason
  comment: string
  reportedAt: IsoDateTime
  reportedBy: string
}

/** POST /news/{id}/report: misleading, a conflict of interest, copyright, or another reason. */
export interface NewsReportWriteDto {
  reason: ContentReportReason
  /** Required for `other`; 1,000 characters at most. */
  comment: string
}

/**
 * GET /admin/news?status=pending|reported&channel=&sourceId= (NEWS and MOD): the reported items
 * first, then those waiting, the newest first in each.
 */
export interface NewsQueueItemDto {
  id: string
  kind: NewsQueueKind
  type: NewsType
  status: NewsStatus
  source: NewsItemSourceDto
  category: NewsCategory | null
  subject: string | null
  headline: string
  countries: string[]
  /** When it began to wait, or its latest report. */
  since: IsoDateTime
  holdReason: NewsHoldReason | null
  /** The AI's confidence, from 0 to 1; null for the other channels. */
  confidence: number | null
  /** Its open reports. */
  reports: number
}

/** GET /admin/news/{id}: the item as readers see it, or will once approved, with its reports. */
export interface ModeratedNewsDto {
  id: string
  type: NewsType
  status: NewsStatus
  source: NewsItemSourceDto
  category: NewsCategory | null
  subject: string | null
  headline: string
  summary: string
  body: RichTextDoc | null
  attachment: NewsFileDto | null
  countries: string[]
  securityIds: string[]
  language: NewsLanguage
  author: string | null
  publishedAt: IsoDateTime | null
  /** The time its newspaper chose, when it is still to come. */
  publishAt: IsoDateTime | null
  submittedAt: IsoDateTime | null
  /** Set once edited after its publication. */
  updatedAt: IsoDateTime | null
  holdReason: NewsHoldReason | null
  confidence: number | null
  withdrawnAt: IsoDateTime | null
  withdrawalReason: string | null
  /** The open reports, newest first. */
  reports: NewsReportDto[]
  version: number
}

/** GET /admin/publishers (NEWS): a domain the Data admin named, and the newspapers it names. */
export interface PublisherDto {
  id: string
  /** Lower case, without "www.": "mediaexample.com". */
  domain: string
  name: string
  /** The tag: upper case, 16 characters at most. */
  shortName: string
  /** The newspapers of the international API and the AI it names. */
  sources: number
  updatedAt: IsoDateTime
  updatedBy: string | null
}

/** PUT /admin/publishers: a domain named or renamed; the tag defaults to the name in capitals. */
export interface PublisherWriteDto {
  domain: string
  name: string
  shortName: string | null
}

/** A partner newspaper's media organisation. */
export interface NewsSourceOrganizationDto {
  id: string
  name: string
}

/** GET /admin/news-sources?channel= (SRC): a newspaper, its contract, moderation and members. */
export interface AdminNewsSourceDto {
  id: string
  channel: NewsChannel
  shortName: string
  name: string
  logoUrl: string | null
  verified: boolean
  websiteUrl: string | null
  language: NewsLanguage | null
  moderation: NewsModeration
  /** XAF per payable unique click. */
  ratePerClick: number
  /** XAF a month at most; null for no cap. */
  monthlyCap: number | null
  /** FLASH items a day at most. */
  flashQuota: number
  organization: NewsSourceOrganizationDto | null
  /** The media's News providers. */
  members: number
  /** Its items published this month. */
  itemsThisMonth: number
  /** Its site's domain, or its publisher's. */
  domain: string | null
}

/** A News provider who publishes under the newspaper's name. */
export interface NewsSourceMemberDto {
  id: string
  displayName: string
  email: string
  status: AccountStatus
  verification: VerificationStatus | null
}

/** GET /admin/news-sources/{id}: the newspaper and its members. */
export interface AdminNewsSourceDetailsDto {
  source: AdminNewsSourceDto
  members: NewsSourceMemberDto[]
}

/** PUT /admin/news-sources/{id}: the contract counts for a partner newspaper only. */
export interface AdminNewsSourceWriteDto {
  name: string
  shortName: string
  websiteUrl: string | null
  language: NewsLanguage | null
  verified: boolean
  moderation: NewsModeration
  ratePerClick: number
  monthlyCap: number | null
  flashQuota: number
}

/** GET / PUT /admin/news-settings (SRC): the AI's moderation and threshold, the views an hour. */
export interface NewsSettingsDto {
  /** `after`: the AI's items go live at once; `before`: each waits for approval. */
  aiModeration: NewsModeration
  /** From 0 to 1: an AI item less sure than this waits for a moderator anyway. */
  aiConfidenceThreshold: number
  /** The views an account makes in an hour before the next count as automated (decision 11). */
  viewsPerHour: number
  updatedAt: IsoDateTime | null
  updatedBy: string | null
}

export type NewsSettingsWriteDto = Omit<NewsSettingsDto, 'updatedAt' | 'updatedBy'>

/** GET /admin/ingest-clients (SRC): a server allowed to push news; never its secret. */
export interface IngestClientDto {
  id: string
  name: string
  /** What it sends in X-CMarket-Key: "cmk_…". */
  keyId: string
  /** CIDR ranges: "203.0.113.7/32". */
  addresses: string[]
  hourlyQuota: number
  createdAt: IsoDateTime
  createdBy: string | null
  lastUsedAt: IsoDateTime | null
  revokedAt: IsoDateTime | null
  itemsThisHour: number
  itemsToday: number
}

/** POST /admin/ingest-clients */
export interface IngestClientWriteDto {
  name: string
  /** Single addresses or CIDR ranges, 20 at most. */
  addresses: string[]
  /** 1,000 when null. */
  hourlyQuota: number | null
}

/** POST /admin/ingest-clients (201): the client and its signing secret, shown this once. */
export interface IngestClientCreatedDto {
  client: IngestClientDto
  secret: string
}
