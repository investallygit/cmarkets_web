import { useTranslation } from 'react-i18next'
import { formatTime, MARKET_TIME_ZONE } from '@/shared/lib/format'
import { useNow } from '@/shared/lib/useNow'

/** Session clock in Douala time (spec section 8), whatever the user's time zone. */
export function SessionClock() {
  const { t } = useTranslation()
  const now = useNow(1000)
  return (
    <span className="font-sans text-label uppercase">
      {t('shell.clockCity')}{' '}
      <span className="font-mono tabular-nums">{formatTime(now, MARKET_TIME_ZONE, true)}</span>
    </span>
  )
}
