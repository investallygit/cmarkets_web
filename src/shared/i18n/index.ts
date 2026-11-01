import i18n, { type ParseKeys } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en'
import fr from './locales/fr'

/** French and English; every UI string lives in ./locales (spec section 7). */
export const LANGUAGES = ['fr', 'en'] as const
export type Language = (typeof LANGUAGES)[number]
/** Each language in its own words, as language menus name them. */
export const LANGUAGE_NAMES: Record<Language, string> = { fr: 'Français', en: 'English' }
export type TranslationKey = ParseKeys
/** Screen ids that have a title and a menu label in the translation files. */
export type ScreenTextKey = keyof typeof en.screens
/** Panels named in the translation files: the layout menu shows a hidden one back by its name. */
export type PanelNameKey = keyof typeof en.panels

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    supportedLngs: [...LANGUAGES],
    fallbackLng: 'en',
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'cmarket.language',
      caches: ['localStorage'],
    },
  })

export { useFormat, useLocale } from './useFormat'
