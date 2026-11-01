import type { CoverageDto, CoverageItemDto, ImportType } from '@/shared/api/contracts'
import { toMarketDay } from '@/shared/lib/format'
import { addDays } from '@/shared/lib/isoDate'
import { calendar } from '../db'
import { allNews } from '../content'
import { importTypeOf } from '../lib/dataImport'
import { isSessionDay } from './lookups'
import { importStore } from './store'

/** Session coverage: the files expected for a session, and where each one stands. */

const COVERAGE_ORDER: readonly (ImportType | 'news')[] = [
  'daily-prices',
  'indices',
  'corporate-actions',
  'auctions',
  'curves',
  'news',
  'financial-statements',
  'securities',
  'history',
]

/** Friday of the week of a day: when the weekly curves file is due. */
function fridayOf(day: string): string {
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay()
  return addDays(day, 5 - weekday)
}

/** GET /data/coverage: the files expected for a session and where each one stands. */
export function coverage(date: string, now = Date.now()): CoverageDto {
  const today = toMarketDay(now)
  const imports = importStore.read()
  const items = COVERAGE_ORDER.flatMap((type): CoverageItemDto[] => {
    if (type === 'news') {
      const count = allNews().filter((item) => toMarketDay(item.publishedAt) === date).length
      return [
        {
          type,
          status: count > 0 ? 'published' : 'none',
          published: count,
          lastPublishedAt: null,
          dueOn: null,
          importId: null,
        },
      ]
    }
    const forDay = imports
      .filter((stored) => stored.type === type && stored.sessionDate === date)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    const published = forDay.filter((stored) => stored.status === 'published')
    const pending = forDay.filter(
      (stored) => stored.status === 'ready' || stored.status === 'rolledBack',
    )
    const latest = forDay.find((stored) => stored.status !== 'discarded')
    const { frequency } = importTypeOf(type)
    if ((frequency === 'once' || type === 'securities') && forDay.length === 0) return []
    let dueOn: string | null = null
    if (frequency === 'session' && isSessionDay(date)) dueOn = date
    if (frequency === 'weekly') dueOn = fridayOf(date)
    if (
      frequency === 'auction' &&
      calendar.some((event) => event.type === 'auction' && event.date === date)
    ) {
      dueOn = date
    }
    const status: CoverageItemDto['status'] =
      pending.length > 0
        ? 'checking'
        : published.length > 0
          ? 'published'
          : dueOn === null
            ? 'none'
            : dueOn > date || dueOn >= today
              ? 'expected'
              : 'missing'
    return [
      {
        type,
        status,
        published: published.length,
        lastPublishedAt:
          published
            .map((stored) => stored.publishedAt ?? '')
            .sort()
            .at(-1) ?? null,
        dueOn: status === 'expected' || status === 'missing' ? dueOn : null,
        importId: latest?.id ?? null,
      },
    ]
  })
  return { date, items }
}
