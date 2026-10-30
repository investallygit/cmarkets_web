import type { IsoDateTime } from './common'

/** Issuer releases, annual reports, BVMAC notices, COSUMAF and BEAC decisions (spec section 5). */
export type DocumentType =
  | 'annual-report'
  | 'financial-statements'
  | 'information-note'
  | 'notice'
  | 'release'
  | 'decision'
  | 'articles'

/** GET /documents?securityId=&type=&q= (paginated). The file is GET /documents/{id}/file. */
export interface DocumentDto {
  id: string
  type: DocumentType
  title: string
  publishedAt: IsoDateTime
  /** Issuer code or institution: SEMC, BVMAC, COSUMAF... */
  source: string
  securityIds: string[]
  pages: number
  sizeBytes: number
}
