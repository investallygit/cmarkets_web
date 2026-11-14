import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import type { CommodityFrequency } from '@/shared/api/contracts'
import { FREQUENCY_LETTERS } from '../lib/commodityValues'

const TONES: Record<CommodityFrequency, string> = {
  daily: 'border-info text-info',
  weekly: 'border-warning text-warning',
  monthly: 'border-border text-secondary',
}

/** The list's badge (spec section 9): D daily in blue, W weekly in yellow, M monthly in grey. */
export function FrequencyBadge({ frequency }: { frequency: CommodityFrequency }) {
  const { t } = useTranslation()
  return (
    <span
      title={t(`commodities.frequencies.${frequency}`)}
      className={clsx(
        'inline-flex h-4 w-5 shrink-0 items-center justify-center border font-mono text-title font-semibold',
        TONES[frequency],
      )}
    >
      <span aria-hidden>{FREQUENCY_LETTERS[frequency]}</span>
      <span className="sr-only">{t(`commodities.frequencies.${frequency}`)}</span>
    </span>
  )
}
