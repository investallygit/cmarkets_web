import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/shared/ui/form/Select'
import { SectionTitle } from './Section'

/** A code the list may hold, with its name in the user's language. */
export interface CodeChoice {
  code: string
  name: string
}

interface CodeListEditorProps {
  title: string
  hint: string
  /** The list, in the order the screen shows it. */
  codes: readonly string[]
  /** The codes it may hold, in the order the select offers them. */
  choices: readonly CodeChoice[]
  max: number
  /** The select's first line: "Add a currency", "Add a country". */
  addLabel: string
  /** The select's name: "Add a currency to “Cross-rate matrix”". */
  addToLabel: string
  error?: string | null
  onChange: (codes: string[]) => void
}

const ICON_BUTTON =
  'flex size-6 items-center justify-center text-secondary disabled:opacity-40 disabled:hover:text-secondary'

/**
 * An ordered list of codes (ADMCFG: FX's currencies, ECO's countries): each with its name, moved up
 * or down, removed; one added from those it does not hold yet, at its end.
 */
export function CodeListEditor({
  title,
  hint,
  codes,
  choices,
  max,
  addLabel,
  addToLabel,
  error,
  onChange,
}: CodeListEditorProps) {
  const { t } = useTranslation()
  const hintId = useId()
  const byCode = new Map(choices.map((choice) => [choice.code, choice]))
  const remaining = choices.filter((choice) => !codes.includes(choice.code))
  const move = (index: number, step: -1 | 1) => {
    const next = [...codes]
    ;[next[index], next[index + step]] = [next[index + step], next[index]]
    onChange(next)
  }

  return (
    <fieldset aria-describedby={hintId} className="flex flex-col gap-2">
      <legend className="mb-2">
        <SectionTitle>{title}</SectionTitle>
      </legend>
      {codes.length > 0 && (
        <ol className="flex flex-col border">
          {codes.map((code, index) => (
            <li key={code} className="flex h-7 items-center gap-2 px-2 even:bg-row-alt">
              <span className="w-9 shrink-0 font-mono text-data text-accent-amber">{code}</span>
              <span className="min-w-0 flex-1 truncate font-sans text-data text-primary">
                {byCode.get(code)?.name ?? code}
              </span>
              <button
                type="button"
                aria-label={t('macroSettings.moveUp', { currency: code })}
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className={clsx(ICON_BUTTON, 'hover:text-primary')}
              >
                <ArrowUp aria-hidden className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={t('macroSettings.moveDown', { currency: code })}
                disabled={index === codes.length - 1}
                onClick={() => move(index, 1)}
                className={clsx(ICON_BUTTON, 'hover:text-primary')}
              >
                <ArrowDown aria-hidden className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={t('macroSettings.remove', { currency: code })}
                onClick={() => onChange(codes.filter((candidate) => candidate !== code))}
                className={clsx(ICON_BUTTON, 'hover:text-down')}
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ol>
      )}
      <Select
        value=""
        options={[
          { value: '', label: addLabel },
          ...remaining.map((choice) => ({
            value: choice.code,
            label: `${choice.code} · ${choice.name}`,
          })),
        ]}
        onChange={(code) => code && onChange([...codes, code])}
        disabled={codes.length >= max || remaining.length === 0}
        aria-label={addToLabel}
        className="w-72 max-w-full"
      />
      <p id={hintId} className="font-sans text-data text-secondary">
        {hint}
      </p>
      {error && (
        <p role="alert" className="font-sans text-data text-down">
          {error}
        </p>
      )}
    </fieldset>
  )
}
