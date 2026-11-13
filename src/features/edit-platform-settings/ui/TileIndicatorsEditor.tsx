import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/shared/ui/form/Select'
import type { CodeChoice } from './CodeListEditor'
import { SectionTitle } from './Section'

interface TileIndicatorsEditorProps {
  /** Six indicator codes, in the tiles' order. */
  tiles: readonly string[]
  /** The 37 indicators ECO offers. */
  choices: readonly CodeChoice[]
  error?: string | null
  onChange: (tiles: string[]) => void
}

/** ADMCFG, ECO's six key indicator tiles (spec section 10, "tile indicators"): an indicator each, in order. */
export function TileIndicatorsEditor({
  tiles,
  choices,
  error,
  onChange,
}: TileIndicatorsEditorProps) {
  const { t } = useTranslation()
  const hintId = useId()
  const options = choices.map((choice) => ({ value: choice.code, label: choice.name }))

  return (
    <fieldset aria-describedby={hintId} className="flex flex-col gap-2">
      <legend className="mb-2">
        <SectionTitle>{t('macroSettings.tileIndicators')}</SectionTitle>
      </legend>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tiles.map((indicator, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-14 shrink-0 font-sans text-data text-secondary">
              {t('macroSettings.tile', { position: index + 1 })}
            </span>
            <Select
              value={indicator}
              options={options}
              onChange={(code) =>
                onChange(tiles.map((current, position) => (position === index ? code : current)))
              }
              aria-label={t('macroSettings.tile', { position: index + 1 })}
              className="min-w-0 flex-1"
            />
          </li>
        ))}
      </ol>
      <p id={hintId} className="font-sans text-data text-secondary">
        {t('macroSettings.tileIndicatorsHint')}
      </p>
      {error && (
        <p role="alert" className="font-sans text-data text-down">
          {error}
        </p>
      )}
    </fieldset>
  )
}
