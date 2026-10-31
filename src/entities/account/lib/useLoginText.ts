import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'

const DAY_MS = 86_400_000

/** "Today 10:41", "Yesterday" or the date of a login, as in the screen 9 mockup. */
export function useLoginText() {
  const { t } = useTranslation()
  const format = useFormat()
  const now = useNow(60_000)
  return (at: string | null) => {
    if (!at) return t('accounts.never')
    const day = format.date(at)
    if (day === format.date(now)) return t('accounts.todayAt', { time: format.time(at) })
    if (day === format.date(now - DAY_MS)) return t('accounts.yesterday')
    return day
  }
}
