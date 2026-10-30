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
  const day = toMarketDay(publishedAt)
  if (day === toMarketDay(now)) return <>{format.time(publishedAt)}</>
  if (day === toMarketDay(now - DAY_MS)) return <>{t('common.yesterdayShort')}</>
  return <>{format.dayMonth(publishedAt)}</>
}
