import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveMacroSettings } from '@/entities/platform-settings'
import { isApiError } from '@/shared/api'
import type { MacroSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { CurrencyListEditor } from './CurrencyListEditor'
import { Section } from './Section'

/** CMarket.Api's bounds (spec section 9: the table's currencies, the matrix's). */
const MAX_CROSSES = 20
const MIN_MATRIX = 2
const MAX_MATRIX = 8
const PEGGED: ReadonlySet<string> = new Set(['EUR', 'XAF'])

type Field = 'fxCurrencies' | 'matrixCurrencies'

/**
 * ADMCFG, the macroeconomic and exchange-rate screens (spec section 10, /admin/macro/settings):
 * the currencies of FX's cross rates against the XAF, in the table's order, and those of its
 * matrix, the euro and the franc among them if the Admin wishes. Saved together; each list
 * changed is written to the audit log. ECO's countries and tiles join them with step 40.
 */
export function MacroSettingsForm({ settings }: { settings: MacroSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveMacroSettings()
  const [crosses, setCrosses] = useState<string[]>(settings.fxCurrencies)
  const [matrix, setMatrix] = useState<string[]>(settings.matrixCurrencies)
  const [submitted, setSubmitted] = useState(false)

  const local: Record<Field, string | null> = {
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
    crosses.join() !== settings.fxCurrencies.join() ||
    matrix.join() !== settings.matrixCurrencies.join()

  const reset = () => {
    save.reset()
    setSubmitted(false)
    setCrosses(settings.fxCurrencies)
    setMatrix(settings.matrixCurrencies)
  }

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(
          { fxCurrencies: crosses, matrixCurrencies: matrix },
          {
            onSuccess: () => {
              setSubmitted(false)
              toast.success(t('macroSettings.saved'))
            },
          },
        )
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title={null}>
          <CurrencyListEditor
            title={t('macroSettings.fxCurrencies')}
            hint={t('macroSettings.fxCurrenciesHint')}
            codes={crosses}
            choices={settings.currencies.filter((currency) => !PEGGED.has(currency.code))}
            max={MAX_CROSSES}
            error={error('fxCurrencies')}
            onChange={setCrosses}
          />
        </Section>
        <Section title={null}>
          <CurrencyListEditor
            title={t('macroSettings.matrixCurrencies')}
            hint={t('macroSettings.matrixCurrenciesHint')}
            codes={matrix}
            choices={settings.currencies}
            max={MAX_MATRIX}
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
          {t('macroSettings.save')}
        </Button>
      </footer>
    </form>
  )
}
