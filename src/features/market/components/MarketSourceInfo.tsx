import { useTranslation } from 'react-i18next'
import { useFormat } from '@/shared/i18n'
import { useMarketStatus } from '../api'
import { useLastLiveUpdate } from '../live/hooks'

/** "Source: BVMAC · BEAC · last update 10:42:14": the update time is always visible (spec section 2). */
export function MarketSourceInfo() {
  const { t } = useTranslation()
  const format = useFormat()
  const { data } = useMarketStatus()
  const liveUpdate = useLastLiveUpdate()
  if (!data) return null
  // Both are ISO 8601 UTC strings, so they compare as text.
  const lastUpdate = liveUpdate && liveUpdate > data.asOf ? liveUpdate : data.asOf

  return (
    <span className="truncate text-secondary">
      {t('shell.source')}: {data.sources.join(' · ')} · {t('shell.lastUpdate')}{' '}
      {format.time(lastUpdate, true)}
    </span>
  )
}
