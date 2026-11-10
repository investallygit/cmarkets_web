import type { IsoDateTime, Paged } from './common'
import type { NewsCategory, NewsLanguage, NewsSourceDto, NewsType } from './news'
import type { RichTextDoc } from './research'

/**
 * Where an item of a partner newspaper stands (spec section 10, GET /provider/news?status=): a draft,
 * scheduled at a time of Douala, published, or withdrawn with a reason. The feed shows the published
 * ones only.
 */
export const PROVIDER_NEWS_STATUSES = ['draft', 'scheduled', 'published', 'withdrawn'] as const
export type ProviderNewsStatus = (typeof PROVIDER_NEWS_STATUSES)[number]

/** GET /provider/news?status=&type= (paginated, newest first): a row of My news. */
export interface ProviderNewsRowDto {
  id: string
  type: NewsType
  status: ProviderNewsStatus
  /** Empty in a new draft. */
  headline: string
  /** When it reached the feed; null before. */
  publishedAt: IsoDateTime | null
  /** A scheduled item's time. */
  publishAt: IsoDateTime | null
  withdrawnAt: IsoDateTime | null
  /** The last save: "Saved at 07:58". */
  updatedAt: IsoDateTime
}

/** A file of an ARTICLE in the studio: an image of its body (with its credit), or its PDF. */
export interface NewsStudioFileDto {
  id: string
  kind: 'image' | 'document'
  fileName: string
  size: number
  /** /api/v1/news-files/{id}: the address an image of the body points to. */
  url: string
  credit: string | null
}

/** GET /provider/news/{id}: the item in the editor. */
export interface ProviderNewsDto extends ProviderNewsRowDto {
  /** An ARTICLE's standfirst (400 characters), a FLASH's text (500 characters). */
  summary: string
  /** An ARTICLE's body, the editor's document; null for a FLASH and a draft without one. */
  body: RichTextDoc | null
  /** Null in a draft only. */
  category: NewsCategory | null
  /** CEMAC countries; the six for CEMAC. */
  countries: string[]
  /** Ten at most. */
  securityIds: string[]
  language: NewsLanguage
  /** The amber code the feed shows: the code of the first related security. */
  subject: string | null
  /** "Source and author": the byline under the item. */
  author: string | null
  originalUrl: string | null
  /** An ARTICLE's PDF. */
  attachment: NewsStudioFileDto | null
  /** The last edit after the publication: "Updated on …". */
  editedAt: IsoDateTime | null
  /** The rights statement of the publication. */
  rightsConfirmedAt: IsoDateTime | null
  withdrawalReason: string | null
  /** The newspaper's id of the item in its files. */
  externalId: string | null
  /** Sent back with the next save or publication: 409 when another one came between. */
  version: number
}

/** PUT /provider/news/{id}: the editor's fields; a draft may be incomplete, within each limit. */
export interface ProviderNewsWriteDto {
  type: NewsType
  headline: string
  summary: string
  body: RichTextDoc | null
  category: NewsCategory | null
  countries: string[]
  securityIds: string[]
  language: NewsLanguage
  author: string | null
  originalUrl: string | null
  version: number
}

/**
 * POST /provider/news/{id}/publish: now (publishAt null) or at a time of Douala, the rights
 * certified. 400 with each field missing, 409 past the newspaper's FLASH items of the day.
 */
export interface NewsPublishDto {
  publishAt: IsoDateTime | null
  rightsConfirmed: boolean
  version: number
}

/** The unique clicks of an item or a day: payable, and excluded by the checks. */
export interface NewsClicksDto {
  /** An item's id, or a day of Douala ("2026-10-29"). */
  key: string
  payable: number
  excluded: number
}

/** GET /provider/news/stats?from=&to=&groupBy=item|day */
export interface NewsStatsDto {
  groupBy: 'item' | 'day'
  from: string | null
  to: string | null
  payable: number
  excluded: number
  rows: NewsClicksDto[]
}

/**
 * GET /provider/earnings?month=: a month's payable unique clicks, the rate of the contract, the
 * amount within the monthly cap, and the clicks the checks excluded (spec section 16).
 */
export interface NewsEarningsDto {
  /** "2026-10". */
  month: string
  payableClicks: number
  excludedClicks: number
  ratePerClick: number
  monthlyCap: number | null
  amount: number
  currency: string
}

/** GET / PUT /provider/source: the newspaper, its tag, its site and language; its terms read only. */
export interface ProviderSourceDto extends NewsSourceDto {
  websiteUrl: string | null
  language: NewsLanguage | null
  ratePerClick: number
  monthlyCap: number | null
  flashQuota: number
  /** FLASH items published or scheduled today, against the quota. */
  flashesToday: number
}

export interface ProviderSourceWriteDto {
  name: string
  /** Upper case, 16 characters at most. */
  shortName: string
  websiteUrl: string | null
  language: NewsLanguage | null
}

/** Where an upload stands: checked by a job, published once no valid row waits. */
export type NewsImportStatus = 'checking' | 'ready' | 'published' | 'failed'

/** The columns of the file of spec section 16, as its header names them. */
export const NEWS_IMPORT_COLUMNS = [
  'external_id',
  'type',
  'title',
  'summary',
  'body',
  'category',
  'countries',
  'securities',
  'language',
  'publish_at',
  'author',
  'source_url',
  'image_file',
  'image_credit',
  'attachment_file',
] as const
export type NewsImportColumn = (typeof NEWS_IMPORT_COLUMNS)[number]

/** GET /provider/news/imports(/{id}): an upload, the summary of the last import. */
export interface NewsImportDto {
  id: string
  fileName: string
  status: NewsImportStatus
  /** Why the file cannot be checked. */
  error: string | null
  uploadedAt: IsoDateTime
  publishedAt: IsoDateTime | null
  counts: {
    read: number
    /** Checked, waiting for Publish. */
    valid: number
    errors: number
    /** New items, published or scheduled. */
    published: number
    /** Rows of a known external_id, which updated their item. */
    updated: number
  }
}

/** What a check found in a cell: a code the screen words, the value it is about, a limit. */
export interface NewsImportIssueDto {
  code: string
  column: NewsImportColumn
  message: string
  value: string | null
  limit: number | null
}

export type NewsImportRowStatus = 'valid' | 'error' | 'published' | 'updated'

/** GET /provider/news/imports/{id}/rows?status= (paginated): a row by its line; `id` is the line. */
export interface NewsImportRowDto {
  id: number
  line: number
  externalId: string | null
  status: NewsImportRowStatus
  values: Partial<Record<NewsImportColumn, string>>
  issues: NewsImportIssueDto[]
  edited: boolean
  newsId: string | null
}

/** PATCH /provider/news/imports/{id}/rows/{rowId}: the cells fixed, an empty one cleared. */
export interface NewsImportRowFixDto {
  values: Partial<Record<NewsImportColumn, string | null>>
}

export type ProviderNewsPage = Paged<ProviderNewsRowDto>
