import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { useMarketStatus } from '../api'

/** "MARKET OPEN" / "MARKET CLOSED" in the top bar. */
export function MarketStatusBadge() {
  const { t } = useTranslation()
  const { data } = useMarketStatus()
  if (!data) return null
  const open = data.status === 'open'
  return (
    <span
      className={clsx(
        'inline-flex h-6 items-center border px-3 font-sans text-title font-semibold tracking-title uppercase',
        open ? 'border-up bg-up/10 text-up' : 'text-secondary',
      )}
    >
      {open ? t('shell.marketOpen') : t('shell.marketClosed')}
    </span>
  )
}
