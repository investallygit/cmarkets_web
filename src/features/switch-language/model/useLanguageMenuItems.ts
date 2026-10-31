import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { profileOf, useCurrentUser, useUpdateProfile } from '@/entities/session'
import { LANGUAGE_NAMES, LANGUAGES } from '@/shared/i18n'
import type { MenuItem } from '@/shared/ui/menu'

/** FR / EN entries of the user menu: the screen changes at once, and the profile keeps it. */
export function useLanguageMenuItems(): MenuItem[] {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const { mutate: updateProfile } = useUpdateProfile()
  return [
    { id: 'language', kind: 'label', label: t('shell.language') },
    ...LANGUAGES.map((language) => ({
      id: `language-${language}`,
      label: LANGUAGE_NAMES[language],
      icon: Languages,
      checked: i18n.resolvedLanguage === language,
      onSelect: () => {
        void i18n.changeLanguage(language)
        if (user.language !== language) updateProfile({ ...profileOf(user), language })
      },
    })),
  ]
}
