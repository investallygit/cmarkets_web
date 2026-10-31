import { estimatePages } from '@/shared/lib/richText'
import { announcePublication, publicationStore, readerContext, securities } from './db'
import type { StoredContent, StoredPublication } from './lib/research'

/** A company's latest price is the reference of its rating; set again on publication. */
export function withReference(content: StoredContent): StoredContent {
  const security =
    content.subjectType === 'company' && content.subjectId && securities.get(content.subjectId)
  return security
    ? { ...content, referenceDate: readerContext().today, referencePrice: security.last }
    : { ...content, referenceDate: null, referencePrice: null }
}

/** A new version for readers; followers of the analyst and of the subject are told. */
export function publish(publication: StoredPublication): void {
  publication.draft = withReference(publication.draft)
  const now = new Date().toISOString()
  publication.versions.push({
    number: publication.versions.length + 1,
    publishedAt: now,
    content: structuredClone(publication.draft),
    pages: estimatePages(publication.draft.summary, publication.draft.body),
  })
  publication.status = 'published'
  announcePublication({
    publicationId: publication.id,
    subjectId: publication.draft.subjectId ?? '',
    analystId: publication.analystId,
  })
}

/**
 * Nothing of the analyst's is out yet: under review after publication, the screen 9 mockup still
 * reviews a first publication before it goes live.
 */
export function isFirstPublication(analystId: string, publicationId: string): boolean {
  return !publicationStore
    .read()
    .some(
      (publication) =>
        publication.analystId === analystId &&
        publication.id !== publicationId &&
        publication.versions.length > 0,
    )
}
