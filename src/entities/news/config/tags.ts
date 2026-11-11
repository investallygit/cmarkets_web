import type { NewsChannel, NewsType, ProviderNewsStatus } from '@/shared/api/contracts'

/** The colour of a type tag (spec section 16): FLASH red, ARTICLE blue. Utilities of app/styles. */
export const TYPE_TAG: Record<NewsType, string> = {
  flash: 'news-tag-flash',
  article: 'news-tag-article',
}

/**
 * The colour of a newspaper tag, by channel (spec section 16): a partner newspaper teal, the
 * international API grey, CMarket's AI and CMarket green.
 */
export const CHANNEL_TAG: Record<NewsChannel, string> = {
  partner: 'news-tag-partner',
  api: 'news-tag-api',
  ai: 'news-tag-ai',
  cmarket: 'news-tag-cmarket',
}

/**
 * The status of an item in its studio (screen 13): Draft grey, In review amber, Scheduled blue,
 * Published green, Withdrawn red.
 */
export const STATUS_TAG: Record<ProviderNewsStatus, string> = {
  draft: 'news-status-draft',
  pending: 'news-status-pending',
  scheduled: 'news-status-scheduled',
  published: 'news-status-published',
  withdrawn: 'news-status-withdrawn',
}
