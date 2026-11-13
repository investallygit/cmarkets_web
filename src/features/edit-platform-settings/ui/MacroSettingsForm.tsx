import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMacroNames } from '@/entities/macro'
import { useSaveMacroSettings } from '@/entities/platform-settings'
import { useCurrencyName } from '@/entities/rate'
import { isApiError } from '@/shared/api'
import type { MacroSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { CodeListEditor } from './CodeListEditor'
import { Section, SectionTitle } from './Section'
import { TileIndicatorsEditor } from './TileIndicatorsEditor'

/** CMarket.Api's bounds (spec sections 9 and 10: FX's table and matrix, ECO's countries and tiles). */
const MAX_CROSSES = 20
const MIN_MATRIX = 2
const MAX_MATRIX = 8
const MAX_COUNTRIES = 8
const TILES = 6
const PEGGED: ReadonlySet<string> = new Set(['EUR', 'XAF'])

type Field = 'fxCurrencies' | 'matrixCurrencies' | 'comparisonCountries' | 'tileIndicators'

/**
 * ADMCFG, the macroeconomic and exchange-rate screens (spec section 10, /admin/macro/settings):
 * ECO's comparison countries, in the selector's order, and the indicators of its six tiles; FX's
 * currencies against the XAF, in the table's order, and those of its matrix, the euro and the
 * franc among them if the Admin wishes. Saved together; each list changed is written to the audit log.
 */
export function MacroSettingsForm({ settings }: { settings: MacroSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const currencyName = useCurrencyName()
  const names = useMacroNames()
  const save = useSaveMacroSettings()
  const [countries, setCountries] = useState<string[]>(settings.comparisonCountries)
  const [tiles, setTiles] = useState<string[]>(settings.tileIndicators)
  const [crosses, setCrosses] = useState<string[]>(settings.fxCurrencies)
  const [matrix, setMatrix] = useState<string[]>(settings.matrixCurrencies)
  const [submitted, setSubmitted] = useState(false)

  const local: Record<Field, string | null> = {
    comparisonCountries:
      countries.length > MAX_COUNTRIES ? t('macroSettings.errors.comparisonCountries') : null,
    tileIndicators:
      tiles.length !== TILES || new Set(tiles).size !== TILES
        ? t('macroSettings.errors.tileIndicators')
        : null,
    fxCurrencies:
      crosses.length < 1 || crosses.length > MAX_CROSSES
        ? t('macroSettings.errors.fxCurrencies')
        : null,
    matrixCurrencies:
      matrix.length < MIN_MATRIX || matrix.length > MAX_MATRIX
        ? t('macroSettings.errors.matrixCurrencies')
        : null,
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: Field) => (submitted && local[field]) || server[field]?.[0]
  const changed =
    countries.join() !== settings.comparisonCountries.join() ||
    tiles.join() !== settings.tileIndicators.join() ||
    crosses.join() !== settings.fxCurrencies.join() ||
    matrix.join() !== settings.matrixCurrencies.join()

  const reset = () => {
    save.reset()
    setSubmitted(false)
    setCountries(settings.comparisonCountries)
    setTiles(settings.tileIndicators)
    setCrosses(settings.fxCurrencies)
    setMatrix(settings.matrixCurrencies)
  }
  const currencyChoices = settings.currencies.map((currency) => ({
    code: currency.code,
    name: currencyName(currency),
  }))

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(
          {
            comparisonCountries: countries,
            tileIndicators: tiles,
            fxCurrencies: crosses,
            matrixCurrencies: matrix,
          },
          {
            onSuccess: () => {
              setSubmitted(false)
              toast.success(t('macroSettings.savedAll'))
            },
          },
        )
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title={<SectionTitle>{t('macroSettings.ecoTitle')}</SectionTitle>}>
          <CodeListEditor
            title={t('macroSettings.comparisonCountries')}
            hint={t('macroSettings.comparisonCountriesHint')}
            codes={countries}
            choices={settings.countries.map((country) => ({
              code: country.code,
              name: names.economy(country),
            }))}
            max={MAX_COUNTRIES}
            addLabel={t('macroSettings.addCountry')}
            addToLabel={t('macroSettings.addCountryTo', {
              list: t('macroSettings.comparisonCountries'),
            })}
            error={error('comparisonCountries')}
            onChange={setCountries}
          />
          <p className="font-sans text-data text-secondary">{t('macroSettings.countryLoadNote')}</p>
          <TileIndicatorsEditor
            tiles={tiles}
            choices={settings.indicators.map((indicator) => ({
              code: indicator.id,
              name: names.name(indicator),
            }))}
            error={error('tileIndicators')}
            onChange={setTiles}
          />
        </Section>
        <Section title={<SectionTitle>{t('macroSettings.currenciesTitle')}</SectionTitle>}>
          <CodeListEditor
            title={t('macroSettings.fxCurrencies')}
            hint={t('macroSettings.fxCurrenciesHint')}
            codes={crosses}
            choices={currencyChoices.filter((currency) => !PEGGED.has(currency.code))}
            max={MAX_CROSSES}
            addLabel={t('macroSettings.add')}
            addToLabel={t('macroSettings.addTo', { list: t('macroSettings.fxCurrencies') })}
            error={error('fxCurrencies')}
            onChange={setCrosses}
          />
          <CodeListEditor
            title={t('macroSettings.matrixCurrencies')}
            hint={t('macroSettings.matrixCurrenciesHint')}
            codes={matrix}
            choices={currencyChoices}
            max={MAX_MATRIX}
            addLabel={t('macroSettings.add')}
            addToLabel={t('macroSettings.addTo', { list: t('macroSettings.matrixCurrencies') })}
            error={error('matrixCurrencies')}
            onChange={setMatrix}
          />
          <p className="font-sans text-data text-secondary">{t('macroSettings.loadNote')}</p>
        </Section>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {settings.updatedAt &&
            t('platformSettings.updated', {
              date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
              name: settings.updatedBy ?? '',
            })}
        </span>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
        <Button type="button" disabled={!changed} onClick={reset}>
          {t('platformSettings.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('macroSettings.saveAll')}
        </Button>
      </footer>
    </form>
  )
}
