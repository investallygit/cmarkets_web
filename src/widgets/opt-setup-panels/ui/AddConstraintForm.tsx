import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  editSetup,
  setGroup,
  updateItem,
  useOptimizer,
  useOptimizerTexts,
} from '@/entities/optimizer'
import type { OptAssetClass, OptGroupScope } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'

type Scope = 'security' | OptGroupScope

/** The keys a constraint may name: the universe's securities, classes, countries and currencies. */
export type ConstraintKeys = Readonly<Record<Scope, readonly string[]>>

const SCOPES: readonly Scope[] = ['security', 'assetClass', 'country', 'currency']

/** "+ Add a constraint": on a security, a class, a country or a currency, a minimum or a maximum. */
export function AddConstraintForm({ keys, onDone }: { keys: ConstraintKeys; onDone: () => void }) {
  const { t } = useTranslation()
  const texts = useOptimizerTexts()
  const groups = useOptimizer((state) => state.setup.groups)
  const [scope, setScope] = useState<Scope>('assetClass')
  const [key, setKey] = useState('')
  const [bound, setBound] = useState<'min' | 'max'>('max')
  const [value, setValue] = useState<number | null>(null)
  const options = keys[scope]
  const chosen = options.includes(key) ? key : (options[0] ?? '')
  const label = (candidate: string) =>
    scope === 'security'
      ? texts.code(candidate)
      : texts.group(scope, scope === 'assetClass' ? (candidate as OptAssetClass) : candidate)

  const add = () => {
    if (!chosen || value === null) return
    if (scope === 'security')
      editSetup((setup) =>
        updateItem(
          setup,
          chosen,
          bound === 'max' ? { maxWeightPct: value } : { minWeightPct: value },
        ),
      )
    else {
      const existing = groups.find((group) => group.scope === scope && group.key === chosen)
      editSetup((setup) =>
        setGroup(setup, scope, chosen, {
          minPct: bound === 'min' ? value : (existing?.minPct ?? null),
          maxPct: bound === 'max' ? value : (existing?.maxPct ?? null),
        }),
      )
    }
    onDone()
  }

  return (
    <fieldset className="mt-1 space-y-1 border p-2">
      <legend className="px-1 text-secondary">{t('opt.objective.addTitle')}</legend>
      <div className="flex flex-wrap items-center gap-1">
        <Select<Scope>
          value={scope}
          options={SCOPES.map((value) => ({ value, label: t(`opt.objective.scopes.${value}`) }))}
          onChange={setScope}
          aria-label={t('opt.objective.scopeLabel')}
        />
        <Select<string>
          value={chosen}
          options={options.map((value) => ({ value, label: label(value) }))}
          onChange={setKey}
          aria-label={t('opt.objective.keyLabel')}
        />
        <Select<'min' | 'max'>
          value={bound}
          options={(['max', 'min'] as const).map((value) => ({
            value,
            label: t(`opt.objective.bounds.${value}`),
          }))}
          onChange={setBound}
          aria-label={t('opt.objective.boundLabel')}
        />
        <NumberInput
          value={value}
          onChange={setValue}
          suffix="%"
          aria-label={t('opt.objective.valueLabel')}
          className="w-20"
        />
      </div>
      <div className="flex justify-end gap-1">
        <Button variant="secondary" size="sm" onClick={onDone}>
          {t('opt.objective.cancel')}
        </Button>
        <Button variant="primary" size="sm" disabled={!chosen || value === null} onClick={add}>
          {t('opt.objective.add')}
        </Button>
      </div>
    </fieldset>
  )
}
