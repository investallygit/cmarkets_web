import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdateProfileFields } from '@/entities/session'
import { LANGUAGE_NAMES, LANGUAGES } from '@/shared/i18n'
import type { MenuItem } from '@/shared/ui/menu'

/**
 * FR / EN entries of the user menu: the screen changes at once, and the profile keeps it, the rest
 * of the profile as the server holds it (B100).
 */
export function useLanguageMenuItems(): MenuItem[] {
  const { t, i18n } = useTranslation()
  const { mutate: updateProfile } = useUpdateProfileFields()
  return [
    { id: 'language', kind: 'label', label: t('shell.language') },
    ...LANGUAGES.map((language) => ({
      id: `language-${language}`,
      label: LANGUAGE_NAMES[language],
      icon: Languages,
      checked: i18n.resolvedLanguage === language,
      radio: true,
      onSelect: () => {
        void i18n.changeLanguage(language)
        updateProfile({ language })
      },
    })),
  ]
}
