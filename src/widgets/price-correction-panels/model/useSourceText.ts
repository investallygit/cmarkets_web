import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { StoredPriceDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'

/** Where a stored session came from: a file, the initial history, or a correction. */
export function useSourceText() {
  const { t } = useTranslation()
  const format = useFormat()
  return useCallback(
    (price: StoredPriceDto) =>
      price.source === 'correction' && price.correctedAt
        ? t('corrections.sources.correctedAt', {
            when: `${format.dayMonth(price.correctedAt)} ${format.time(price.correctedAt)}`,
          })
        : t(`corrections.sources.${price.source}`),
    [t, format],
  )
}
