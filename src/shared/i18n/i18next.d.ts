import 'i18next'
import type en from './locales/en.json'

// Typed translation keys: t('panels.indices') is checked at compile time.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
  }
}
