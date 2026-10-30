import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { useNow } from '@/shared/lib/useNow'

/** Session clock in Douala time (spec section 8). */
export function SessionClock() {
  const { t } = useTranslation()
  const format = useFormat()
  const now = useNow(1000)
  return (
    <span className="font-sans text-label uppercase">
      {t('shell.clockCity')}{' '}
      <span className="font-mono tabular-nums">{format.time(now, true)}</span>
    </span>
  )
}
