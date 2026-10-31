import type {
  DocumentDto,
  DocumentWriteDto,
  NewsArticleDto,
  NewsItemDto,
  NewsWriteDto,
} from '@/shared/api/contracts'
import { currentAccount, news, recordAudit, sharedStore } from './db'
import { DOCUMENTS } from './fixtures/documents'
import { articleBody } from './fixtures/feeds'
import { newId } from './lib/ids'

/**
 * News and documents entered in the back-office (NEWS, spec section 5): kept with their text and
 * shown with the sample ones; an edited sample is kept here under its own id.
 */
interface StoredArticle extends NewsArticleDto {
  enteredBy: string
  updatedAt: string
}

interface StoredDocument extends DocumentDto {
  fileName: string
  enteredBy: string
}

const articleStore = sharedStore<StoredArticle[]>('enteredNews', () => [])
const documentStore = sharedStore<StoredDocument[]>('enteredDocuments', () => [])

/** The PDFs uploaded in this tab; after a reload, a generated file stands in for them. */
const files = new Map<string, Blob>()

function toItem(article: StoredArticle): NewsItemDto {
  const { id, publishedAt, source, headline, topic, securityIds, country } = article
  return { id, publishedAt, source, headline, topic, securityIds, country }
}

function toDocument(stored: StoredDocument): DocumentDto {
  const { id, type, title, publishedAt, source, securityIds, pages, sizeBytes } = stored
  return { id, type, title, publishedAt, source, securityIds, pages, sizeBytes }
}

const newestFirst = <T extends { publishedAt: string }>(a: T, b: T) =>
  b.publishedAt.localeCompare(a.publishedAt)

/** The feed: what was entered, and the samples not edited since. */
export function allNews(): NewsItemDto[] {
  const entered = articleStore.read()
  const ids = new Set(entered.map((article) => article.id))
  return [...entered.map(toItem), ...news.filter((item) => !ids.has(item.id))].sort(newestFirst)
}

export function findArticle(id: string): NewsArticleDto | undefined {
  const entered = articleStore.read().find((article) => article.id === id)
  if (entered) return { ...toItem(entered), body: entered.body }
  const item = news.find((candidate) => candidate.id === id)
  return item && { ...item, body: articleBody(item) }
}

const newsListeners = new Set<(item: NewsItemDto) => void>()

/** News entered by the Data admin, for the simulated hub to push (NewsPublished). */
export function onNewsEntered(listener: (item: NewsItemDto) => void): () => void {
  newsListeners.add(listener)
  return () => newsListeners.delete(listener)
}

/** POST /data/news, or PUT /data/news/{id}: an edit keeps the publication time. */
export function saveArticle(id: string | null, write: NewsWriteDto): NewsArticleDto {
  const now = new Date().toISOString()
  const existing = id ? findArticle(id) : undefined
  const article: StoredArticle = {
    id: existing?.id ?? newId('news'),
    publishedAt: existing?.publishedAt ?? now,
    ...write,
    enteredBy: currentAccount().displayName,
    updatedAt: now,
  }
  articleStore.write([article, ...articleStore.read().filter((stored) => stored.id !== article.id)])
  recordAudit(
    existing ? 'news-edit' : 'news-publish',
    { type: 'news', id: article.id, label: article.headline },
    existing && existing.headline !== article.headline
      ? {
          changes: [
            { field: 'title', scope: null, before: existing.headline, after: article.headline },
          ],
        }
      : {},
  )
  if (!existing) newsListeners.forEach((listener) => listener(toItem(article)))
  return { ...toItem(article), body: article.body }
}

/** The document library: what was entered, and the samples not edited since. */
export function allDocuments(): DocumentDto[] {
  const entered = documentStore.read()
  const ids = new Set(entered.map((document) => document.id))
  return [
    ...entered.map(toDocument),
    ...DOCUMENTS.filter((document) => !ids.has(document.id)),
  ].sort(newestFirst)
}

export function documentFile(id: string): Blob | undefined {
  return files.get(id)
}

/** Pages of a PDF: its page objects, counted in the file. */
async function pageCount(file: Blob): Promise<number> {
  const text = new TextDecoder('latin1').decode(await file.arrayBuffer())
  return Math.max(1, (text.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? []).length)
}

/** POST /data/documents, or PUT /data/documents/{id} with or without a new file. */
export async function saveDocument(
  id: string | null,
  write: DocumentWriteDto,
  file: File | null,
): Promise<DocumentDto> {
  const existing = id ? allDocuments().find((document) => document.id === id) : undefined
  const documentId = existing?.id ?? newId('doc')
  const stored: StoredDocument = {
    id: documentId,
    publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    ...write,
    pages: file ? await pageCount(file) : (existing?.pages ?? 1),
    sizeBytes: file?.size ?? existing?.sizeBytes ?? 0,
    fileName: file?.name ?? `${documentId}.pdf`,
    enteredBy: currentAccount().displayName,
  }
  if (file) files.set(documentId, file)
  documentStore.write([
    stored,
    ...documentStore.read().filter((document) => document.id !== documentId),
  ])
  recordAudit(
    existing ? 'document-edit' : 'document-publish',
    { type: 'document', id: documentId, label: stored.title },
    existing && existing.title !== stored.title
      ? { changes: [{ field: 'title', scope: null, before: existing.title, after: stored.title }] }
      : {},
  )
  return toDocument(stored)
}
