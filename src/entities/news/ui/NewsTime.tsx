import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { toMarketDay } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'

const DAY_MS = 86_400_000

/** When a news item came out: the time today, "Yest.", then the day and month. */
export function NewsTime({ publishedAt }: { publishedAt: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const now = useNow(60_000)
  // Today and yesterday where the user is.
  const day = toMarketDay(publishedAt, format.timeZone)
  if (day === toMarketDay(now, format.timeZone)) return <>{format.time(publishedAt)}</>
  if (day === toMarketDay(now - DAY_MS, format.timeZone)) return <>{t('common.yesterdayShort')}</>
  return <>{format.dayMonth(publishedAt)}</>
}
