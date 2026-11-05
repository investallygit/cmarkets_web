import type {
  ConversationFilter,
  ConversationReportReason,
  FrozenChartPeriod,
} from '@/shared/api/contracts'

/** The tabs of the conversations (spec section 9, screen 11). */
export const CONVERSATION_FILTERS: readonly ConversationFilter[] = [
  'all',
  'unread',
  'requests',
  'groups',
]

/** The limits of spec section 15, which the server enforces too. */
export const MESSAGE_MAX_LENGTH = 4000
export const GROUP_MAX_MEMBERS = 50
export const GROUP_TITLE_MAX_LENGTH = 60
export const ATTACHMENTS_MAX = 5
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
/** PDF, XLSX, CSV, PNG and JPEG, by their extensions. */
export const ATTACHMENT_EXTENSIONS = ['pdf', 'xlsx', 'csv', 'png', 'jpg', 'jpeg']

/** The periods a shared chart may cover. */
export const SHARED_CHART_PERIODS: readonly FrozenChartPeriod[] = ['1M', '3M', '6M', '1Y', '5Y']

export const CONVERSATION_REPORT_REASONS: readonly ConversationReportReason[] = [
  'spam',
  'harassment',
  'scam',
  'inappropriate',
  'other',
]

/**
 * The user's Typing is sent at most this often while they write; the others' "typing…" shows
 * until this long after their last one, or their message.
 */
export const TYPING_NOTIFY_MS = 2_500
export const TYPING_SHOWN_MS = 4_000
