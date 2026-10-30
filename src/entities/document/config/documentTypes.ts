import type { DocumentType } from '@/shared/api/contracts'

/** Document types in the order of the filters: issuer documents first, then notices and decisions. */
export const DOCUMENT_TYPES: readonly DocumentType[] = [
  'annual-report',
  'financial-statements',
  'information-note',
  'release',
  'notice',
  'decision',
  'articles',
]

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.some((type) => type === value)
}
