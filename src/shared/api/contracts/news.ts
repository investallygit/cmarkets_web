import type { IsoDateTime } from './common'

export type NewsTopic = 'issuer' | 'regulator' | 'market'

/** GET /news?securityId=&country=&topic= (paginated). */
export interface NewsItemDto {
  id: string
  publishedAt: IsoDateTime
  /** Issuer code or institution, shown in amber: SEMC, BEAC, COSUMAF... */
  source: string
  headline: string
  topic: NewsTopic
  securityIds: string[]
  country: string | null
}

/** GET /news/{id}: the full article. */
export interface NewsArticleDto extends NewsItemDto {
  /** Paragraphs of plain text. */
  body: string[]
}
