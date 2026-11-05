import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import { PROFILE_LANGUAGES } from '@/entities/profile'
import { useFormat } from '@/shared/i18n'
import { useField } from '@/shared/ui/form/fieldContext'

interface LanguagePickerProps {
  value: string[]
  onChange: (languages: string[]) => void
}

/** The languages spoken, picked from a short list by pressing them; at least one. */
export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const format = useFormat()
  const field = useField()
  // A language a profile already had stays offered, even outside the list.
  const languages = [
    ...PROFILE_LANGUAGES,
    ...value.filter((code) => !PROFILE_LANGUAGES.includes(code)),
  ]
  return (
    <div
      role="group"
      aria-labelledby={field?.labelId}
      aria-describedby={field?.describedBy}
      className="flex flex-wrap gap-1.5"
    >
      {languages.map((code) => {
        const chosen = value.includes(code)
        return (
          <button
            key={code}
            type="button"
            aria-pressed={chosen}
            onClick={() =>
              onChange(chosen ? value.filter((other) => other !== code) : [...value, code])
            }
            className={clsx(
              'inline-flex h-6 items-center gap-1 border px-2 font-sans text-data',
              chosen
                ? 'border-accent-amber bg-selected text-primary'
                : 'text-secondary hover:text-primary',
            )}
          >
            {chosen && <Check aria-hidden className="size-3 text-accent-amber" />}
            {format.language(code)}
          </button>
        )
      })}
    </div>
  )
}
