import type { IsoDateTime } from './common'
import type { RichTextDoc } from './research'

/** ARTICLE or FLASH (spec section 16): the type is chosen at creation and kept once published. */
export const NEWS_TYPES = ['article', 'flash'] as const
export type NewsType = (typeof NEWS_TYPES)[number]

/**
 * The four channels that feed the news (spec section 16): a partner newspaper (a News provider),
 * the international API, CMarket's AI, CMarket itself (the Data admin). The newspaper tag takes
 * the colour of its channel.
 */
export const NEWS_CHANNELS = ['partner', 'api', 'ai', 'cmarket'] as const
export type NewsChannel = (typeof NEWS_CHANNELS)[number]

/**
 * The eight categories of spec section 16, which replace the three topics of the second version
 * (ROADMAP decision 4); the ingestion API and the files write them as the spec does (`RATES_DEBT`).
 */
export const NEWS_CATEGORIES = [
  'markets',
  'issuers',
  'monetary',
  'ratesDebt',
  'macro',
  'regulation',
  'commodities',
  'international',
] as const
export type NewsCategory = (typeof NEWS_CATEGORIES)[number]

/** An item is written in French or in English. */
export type NewsLanguage = 'fr' | 'en'

/** A newspaper: the feed's filter, the card of its tag (GET /news/sources). */
export interface NewsSourceDto {
  id: string
  channel: NewsChannel
  /** Upper case, 16 characters at most: "MEDIA I", "CMARKET". */
  shortName: string
  name: string
  logoUrl: string | null
  verified: boolean
}

/** The newspaper of an item (spec section 16, "Every news item returned by the API includes"). */
export interface NewsItemSourceDto extends NewsSourceDto {
  /** The original article, for the international API and the AI; null otherwise. */
  originalUrl: string | null
}

/**
 * GET /news?type=&channel=&sourceId=&securityId=&country=&category= (paginated), newest first.
 * The feed carries no content: GET /news/{id} does, and its display is the unique click.
 */
export interface NewsItemDto {
  id: string
  publishedAt: IsoDateTime
  type: NewsType
  source: NewsItemSourceDto
  category: NewsCategory
  /** The issuer code or the institution, in amber: SEMC, BEAC, COSUMAF; null when none. */
  subject: string | null
  /** 150 characters at most. */
  headline: string
  /** An ARTICLE's standfirst; null for a FLASH, whose text is its content. */
  excerpt: string | null
  /** ISO codes; the six CEMAC countries for an item of the whole region. */
  countries: string[]
  securityIds: string[]
  language: NewsLanguage
}

/**
 * The node of a "CMarket security" card in an ARTICLE's body (spec section 16): `attrs.securityId`
 * names the security, which the reader sees live.
 */
export const SECURITY_CARD_NODE = 'cmarketSecurity'

/** A file of an item: an ARTICLE's PDF, under its body; its address is its random id. */
export interface NewsFileDto {
  id: string
  fileName: string
  size: number
  /** /api/v1/news-files/{id}: opened without the session, as an image is. */
  url: string
}

/** GET /news/{id}: the content. Shown 3 seconds in an active tab, it sends POST /news/{id}/view. */
export interface NewsArticleDto extends NewsItemDto {
  /** An ARTICLE's standfirst (400 characters), a FLASH's text (500 characters). */
  summary: string
  /**
   * An ARTICLE's body, the document of the studio's editor: paragraphs, subheadings, lists, quotes,
   * tables, images with their credit, links, "CMarket security" cards; null for a FLASH.
   */
  body: RichTextDoc | null
  /** An ARTICLE's PDF. */
  attachment: NewsFileDto | null
  /** The byline: "Media I · Business desk". */
  author: string | null
  /** Set once the item was edited after its publication: "Updated on …". */
  updatedAt: IsoDateTime | null
}

/**
 * POST /data/news, PUT /data/news/{id}: an item of the CMARKET channel, entered by the Data admin
 * within the limits of its type (spec section 16).
 */
export interface NewsWriteDto {
  type: NewsType
  headline: string
  subject: string | null
  category: NewsCategory
  /** One or more; the six for CEMAC. */
  countries: string[]
  /** Ten at most. */
  securityIds: string[]
  language: NewsLanguage
  /** An ARTICLE's standfirst, a FLASH's text. */
  summary: string
  /** An ARTICLE's body, the editor's document; null for a FLASH. */
  body: RichTextDoc | null
}
