import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { MeDto } from '@/shared/api/contracts'
import { setDisplayTimeZone } from '@/shared/lib/displayTimeZone'

/**
 * The profile's language and time zone apply once /me is known, and again when the user changes
 * them: the profile follows the user from one device to the next.
 */
export function useProfilePreferences(me: MeDto | undefined): void {
  const { i18n } = useTranslation()
  const language = me?.language
  const timeZone = me?.timeZone

  useEffect(() => {
    if (language && i18n.resolvedLanguage !== language) void i18n.changeLanguage(language)
  }, [language, i18n])

  useEffect(() => {
    if (timeZone) setDisplayTimeZone(timeZone)
  }, [timeZone])
}
