import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/shared/i18n'
import type { MenuItem } from '@/shared/ui/menu'

const LANGUAGE_NAMES = { fr: 'Français', en: 'English' } as const

/** FR / EN entries of the user menu; the language detector keeps the choice. */
export function useLanguageMenuItems(): MenuItem[] {
  const { t, i18n } = useTranslation()
  return [
    { id: 'language', kind: 'label', label: t('shell.language') },
    ...LANGUAGES.map((language) => ({
      id: `language-${language}`,
      label: LANGUAGE_NAMES[language],
      icon: Languages,
      checked: i18n.resolvedLanguage === language,
      onSelect: () => void i18n.changeLanguage(language),
    })),
  ]
}
