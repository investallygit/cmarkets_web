import { NEWS_LIMITS, summaryLimit } from '@/entities/news'
import type {
  NewsCategory,
  NewsLanguage,
  NewsType,
  ProviderNewsDto,
  ProviderNewsWriteDto,
  RichTextDoc,
} from '@/shared/api/contracts'
import { docHasText, docLength } from '@/shared/lib/richText'

/** The editor's fields of an item (spec section 16, "Partner newspapers: direct entry"). */
export interface NewsForm {
  type: NewsType
  headline: string
  /** An ARTICLE's standfirst, a FLASH's text. */
  summary: string
  /** An ARTICLE's body; none for a FLASH. */
  body: RichTextDoc | null
  category: NewsCategory | null
  countries: string[]
  securityIds: string[]
  language: NewsLanguage
  /** "Source and author". */
  author: string
  originalUrl: string
}

export type NewsField = keyof NewsForm

/** What the limits of a save found: a field too long, a link that is no web page. */
export type LimitIssue = 'tooLong' | 'url'

/** What publishing still needs, in the order of the screen. */
export const PUBLISH_NEEDS = [
  'headline',
  'summary',
  'body',
  'category',
  'countries',
  'rights',
  'publishAt',
] as const
export type PublishNeed = (typeof PUBLISH_NEEDS)[number]

export function toNewsForm(item: ProviderNewsDto): NewsForm {
  return {
    type: item.type,
    headline: item.headline,
    summary: item.summary,
    body: item.body,
    category: item.category,
    countries: [...item.countries],
    securityIds: [...item.securityIds],
    language: item.language,
    author: item.author ?? '',
    originalUrl: item.originalUrl ?? '',
  }
}

export function toWriteDto(form: NewsForm, version: number): ProviderNewsWriteDto {
  return {
    type: form.type,
    headline: form.headline.trim(),
    summary: form.summary.trim(),
    body: form.type === 'flash' ? null : form.body,
    category: form.category,
    countries: form.countries,
    securityIds: form.securityIds,
    language: form.language,
    author: form.author.trim() || null,
    originalUrl: form.originalUrl.trim() || null,
    version,
  }
}

const WEB_ADDRESS = /^https?:\/\/\S+$/i

/** The limits every save keeps, a draft's too; the server checks them again. */
export function limitIssues(form: NewsForm): Partial<Record<NewsField, LimitIssue>> {
  const issues: Partial<Record<NewsField, LimitIssue>> = {}
  if (form.headline.trim().length > NEWS_LIMITS.headline) issues.headline = 'tooLong'
  if (form.summary.trim().length > summaryLimit(form.type)) issues.summary = 'tooLong'
  if (form.type === 'article' && form.body && docLength(form.body) > NEWS_LIMITS.body)
    issues.body = 'tooLong'
  if (form.author.trim().length > NEWS_LIMITS.author) issues.author = 'tooLong'
  const url = form.originalUrl.trim()
  if (url && (url.length > NEWS_LIMITS.originalUrl || !WEB_ADDRESS.test(url)))
    issues.originalUrl = 'url'
  return issues
}

/** A time of Douala (UTC+1 all year), as the publication sends it: "2026-10-29T08:00:00+01:00". */
export const doualaIso = (date: string, time: string) => `${date}T${time}:00+01:00`

const DOUALA_OFFSET_MS = 60 * 60_000

/** The day and time of Douala of an instant: { date: "2026-10-29", time: "08:00" }. */
export function doualaParts(iso: string): { date: string; time: string } {
  const local = new Date(new Date(iso).getTime() + DOUALA_OFFSET_MS).toISOString()
  return { date: local.slice(0, 10), time: local.slice(11, 16) }
}

/** Tomorrow at 08:00 in Douala: where a new schedule starts. */
export function defaultSchedule(now: Date): { date: string; time: string } {
  const tomorrow = new Date(now.getTime() + DOUALA_OFFSET_MS + 24 * 60 * 60_000)
  return { date: tomorrow.toISOString().slice(0, 10), time: '08:00' }
}

export interface PublishContext {
  rightsConfirmed: boolean
  /** The time of a schedule; null to publish now. */
  schedule: { date: string; time: string } | null
  now: Date
}

/**
 * What the item lacks to be published (spec section 16): its headline, standfirst or FLASH text,
 * an ARTICLE's body, a category, a country, the rights statement; a schedule needs a time to come.
 * Publish stays off until none is left.
 */
export function publishNeeds(form: NewsForm, context: PublishContext): PublishNeed[] {
  const needs: PublishNeed[] = []
  if (!form.headline.trim()) needs.push('headline')
  if (!form.summary.trim()) needs.push('summary')
  if (form.type === 'article' && !docHasText(form.body)) needs.push('body')
  if (!form.category) needs.push('category')
  if (form.countries.length === 0) needs.push('countries')
  if (!context.rightsConfirmed) needs.push('rights')
  const { schedule } = context
  if (
    schedule &&
    (!schedule.date ||
      !schedule.time ||
      new Date(doualaIso(schedule.date, schedule.time)).getTime() <= context.now.getTime())
  )
    needs.push('publishAt')
  return needs
}
