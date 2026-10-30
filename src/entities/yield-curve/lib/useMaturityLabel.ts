import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

/** 0.25 -> "3M", 2 -> "2Y" ("2A" in French), as on the axis of the screen 4 mockup. */
export function useMaturityLabel(): (years: number) => string {
  const { t } = useTranslation()
  return useCallback(
    (years) =>
      years < 1
        ? t('curves.months', { count: Math.round(years * 12) })
        : t('curves.years', { count: years }),
    [t],
  )
}
