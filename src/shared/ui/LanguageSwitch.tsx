import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_NAMES, LANGUAGES } from '@/shared/i18n'

/**
 * FR / EN before login, on the brand navy: the login pages and the home page. Once logged in, the
 * language is part of the profile (CFG).
 */
export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  return (
    <div role="group" aria-label={t('shell.language')} className="flex gap-1">
      {LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          // "fr" and "en" are spelt out; the language's own name is read instead.
          aria-label={LANGUAGE_NAMES[language]}
          aria-pressed={i18n.resolvedLanguage === language}
          onClick={() => void i18n.changeLanguage(language)}
          className={clsx(
            'h-6 px-2 font-sans text-title font-semibold tracking-title uppercase',
            i18n.resolvedLanguage === language
              ? 'bg-brand-green text-brand-navy'
              : 'text-secondary hover:text-primary',
          )}
        >
          {language}
        </button>
      ))}
    </div>
  )
}
