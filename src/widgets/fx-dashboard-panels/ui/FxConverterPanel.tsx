import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFxConversion, useXafCrosses } from '@/entities/rate'
import type { FxConversionDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'

/** The mockup's: 10,000,000 XAF into dollars. */
const DEFAULT_AMOUNT = 10_000_000
const FRANC = 'XAF'
const EURO = 'EUR'
const MISSING = '—'

/**
 * Screen 26, the converter (spec section 9): an amount, its currency and the target's, the
 * franc, the euro or a currency of the table; the result at the day's reference rates, and the
 * rate applied ("For EUR, conversion always uses the fixed parity"). Asked once the amount stops
 * changing; the last result stays meanwhile. API /fx/convert.
 */
export function FxConverterPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const amountId = useId()
  const crosses = useXafCrosses()
  const [amount, setAmount] = useState<number | null>(DEFAULT_AMOUNT)
  const [from, setFrom] = useState(FRANC)
  const [chosenTarget, setTarget] = useState<string | null>(null)
  const codes = useMemo(
    () => [FRANC, EURO, ...(crosses.data?.crosses.map((cross) => cross.currency) ?? [])],
    [crosses.data],
  )
  // The dollar as the mockup, or the table's first currency when the Admin left it out.
  const to = chosenTarget ?? crosses.data?.crosses.at(0)?.currency ?? EURO
  const options = codes.map((code) => ({ value: code, label: code }))
  const conversion = useFxConversion(useDebouncedValue(amount, 300), from, to)
  const result = conversion.data

  return (
    <Panel title={t('panels.fxConverter')} code="FX">
      <div className="flex flex-col gap-2 p-3 font-sans text-data">
        <label htmlFor={amountId} className="text-secondary">
          {t('fx.amount')}
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
          {/* Francs are whole, as the mockup writes 10,000,000; the other currencies have cents. */}
          <NumberInput
            id={amountId}
            value={amount}
            onChange={setAmount}
            decimals={from === FRANC ? 0 : 2}
            highlight
          />
          <Select
            value={from}
            options={options}
            onChange={setFrom}
            aria-label={t('fx.fromCurrency')}
          />
        </div>
        <span aria-hidden className="text-secondary">
          =
        </span>
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
          <output
            htmlFor={amountId}
            aria-label={t('fx.result')}
            className="flex h-7 items-center justify-end border bg-app px-2 font-mono text-data font-semibold text-up tabular-nums"
          >
            {amount === null || !result ? MISSING : format.number(result.result, 2)}
          </output>
          <Select
            value={to}
            options={options}
            onChange={setTarget}
            aria-label={t('fx.toCurrency')}
          />
        </div>
        {conversion.isError ? (
          <p role="alert" className="text-down">
            {conversion.error.message}
          </p>
        ) : (
          result && <RateApplied conversion={result} />
        )}
        <p className="text-secondary">{t('fx.euroAtParity')}</p>
      </div>
    </Panel>
  )
}

/**
 * The rate applied as the mockup writes it: the foreign currency's value in the other, "1 USD =
 * 604.68 XAF (ECB reference of 28/10/2026)", whichever way the conversion goes; the parity said.
 */
function RateApplied({ conversion }: { conversion: FxConversionDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  if (conversion.from === conversion.to) return null
  if (conversion.fixedParity) return <p className="text-secondary">{t('fx.parityApplied')}</p>
  const inverted = conversion.from === FRANC
  const [base, quote] = inverted
    ? [conversion.to, conversion.from]
    : [conversion.from, conversion.to]
  const rate = inverted ? 1 / conversion.rate : conversion.rate
  const decimals = quote === FRANC ? 2 : 4
  return (
    <p className="text-secondary">
      {t('fx.rateApplied', {
        base,
        quote,
        rate: format.number(rate, decimals),
        date: conversion.date ? format.isoDate(conversion.date) : '',
      })}
    </p>
  )
}
