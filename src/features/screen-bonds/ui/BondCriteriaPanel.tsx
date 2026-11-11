import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBondScreenerFacets } from '@/entities/bond'
import { useHasPermission } from '@/entities/session'
import {
  BOND_MARKETS,
  COUPON_TYPES,
  type BondMarket,
  type CouponType,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Select, type SelectOption } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import {
  CATEGORY_GROUP_KEYS,
  DURATION_CHOICES,
  isRunnable,
  maturityChoices,
  rangeValue,
  RATING_CHOICES,
  readRange,
  toSaved,
  YTM_CHOICES,
  type BondCriteria,
  type CategoryGroup,
} from '../model/criteria'
import { thisYear, useBondScreenerStore } from '../model/bondScreenerStore'
import { SavedBondScreens } from './SavedBondScreens'
import { SaveBondScreenDialog } from './SaveBondScreenDialog'

/** A choice of a drop-down, and the current value when a saved screen holds another one. */
function withCurrent(options: SelectOption<string>[], value: string, label: string) {
  return options.some((option) => option.value === value) ? options : [...options, { value, label }]
}

const toggle = <T,>(values: readonly T[], value: T, checked: boolean, order: readonly T[]) =>
  order.filter((item) => (item === value ? checked : values.includes(item)))

/**
 * Screen 17, criteria: the issue category and the market ticked, then the drop-downs, active
 * ones with an amber border. RUN sends GET /bonds/screener; SAVE keeps the criteria under a
 * name (/analysis/bond-screens).
 */
export function BondCriteriaPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const draft = useBondScreenerStore((state) => state.draft)
  const applied = useBondScreenerStore((state) => state.applied)
  const screenId = useBondScreenerStore((state) => state.screenId)
  const { setDraft, run, reset, load } = useBondScreenerStore.getState()
  const facets = useBondScreenerFacets()
  // "Read" accounts (Journalist, CEO, News provider) screen without saving (spec section 12).
  const canSave = useHasPermission('analysis:save')
  const [saving, setSaving] = useState(false)
  const update = (change: Partial<BondCriteria>) => setDraft({ ...draft, ...change })
  const changed = JSON.stringify(draft) !== JSON.stringify(applied)
  const runnable = isRunnable(draft)
  const all = t('bondScreener.all')

  const percent = (value: number) =>
    t('bondScreener.above', { value: format.percent(value, 2, false) })
  const ytmOptions = withCurrent(
    [
      { value: '', label: all },
      ...YTM_CHOICES.map((value) => ({ value: String(value), label: percent(value) })),
    ],
    draft.ytmMin === null ? '' : String(draft.ytmMin),
    draft.ytmMin === null ? all : percent(draft.ytmMin),
  )
  const rangeLabel = (min: number | null, max: number | null) =>
    max === null
      ? t('bondScreener.atLeast', { value: format.number(min ?? 0, 0) })
      : t('bondScreener.between', { min: format.number(min ?? 0, 0), max: format.number(max, 0) })
  const durationValue = rangeValue(draft.durationMin, draft.durationMax)
  const durationOptions = withCurrent(
    [
      { value: '', label: all },
      ...DURATION_CHOICES.map(([min, max]) => ({
        value: rangeValue(min, max),
        label: rangeLabel(min, max),
      })),
    ],
    durationValue,
    rangeLabel(draft.durationMin, draft.durationMax),
  )
  const yearsLabel = (from: number | null, to: number | null) =>
    to === null ? t('bondScreener.fromYear', { year: from }) : `${from ?? '…'} – ${to}`
  const maturityValue = rangeValue(draft.maturityFrom, draft.maturityTo)
  const maturityOptions = withCurrent(
    [
      { value: '', label: all },
      ...maturityChoices(thisYear()).map(([from, to]) => ({
        value: rangeValue(from, to),
        label: yearsLabel(from, to),
      })),
    ],
    maturityValue,
    yearsLabel(draft.maturityFrom, draft.maturityTo),
  )
  const codes = (values: readonly string[] | undefined, current: string | null) =>
    [...new Set([...(values ?? []), ...(current ? [current] : [])])].sort()
  const countryOptions = [
    { value: '', label: all },
    ...codes(facets.data?.countries, draft.country).map((code) => ({
      value: code,
      label: format.country(code),
    })),
  ]
  const currencyOptions = [
    { value: '', label: all },
    ...codes(facets.data?.currencies, draft.currency).map((code) => ({ value: code, label: code })),
  ]
  const ratingOptions = withCurrent(
    [
      { value: '', label: all },
      ...RATING_CHOICES.map((rating) => ({
        value: rating,
        label:
          rating === 'BBB-'
            ? t('bondScreener.investmentGrade', { rating })
            : t('bondScreener.orBetter', { rating }),
      })),
    ],
    draft.ratingMin ?? '',
    t('bondScreener.orBetter', { rating: draft.ratingMin ?? '' }),
  )
  const couponOptions: SelectOption<string>[] = [
    { value: '', label: all },
    ...COUPON_TYPES.map((type) => ({ value: type, label: t(`bondScreener.couponTypes.${type}`) })),
  ]

  return (
    <Panel
      title={t('bondScreener.criteria')}
      code="BS"
      options={
        canSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('bondScreener.save')}
          </button>
        )
      }
      bodyClassName="flex flex-col"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          if (runnable) run()
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2">
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 font-sans text-data text-secondary">
              {t('bondScreener.fields.category')}
            </legend>
            {CATEGORY_GROUP_KEYS.map((group: CategoryGroup) => (
              <Checkbox
                key={group}
                checked={draft.categories.includes(group)}
                onChange={(checked) =>
                  update({
                    categories: toggle(draft.categories, group, checked, CATEGORY_GROUP_KEYS),
                  })
                }
                label={t(`bondScreener.categoryGroups.${group}`)}
              />
            ))}
          </fieldset>
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 font-sans text-data text-secondary">
              {t('bondScreener.fields.market')}
            </legend>
            {BOND_MARKETS.map((market: BondMarket) => (
              <Checkbox
                key={market}
                checked={draft.markets.includes(market)}
                onChange={(checked) =>
                  update({ markets: toggle(draft.markets, market, checked, BOND_MARKETS) })
                }
                label={t(`bondScreener.marketChoices.${market}`)}
              />
            ))}
          </fieldset>
          <Field label={t('bondScreener.fields.ytmMin')}>
            <Select
              value={draft.ytmMin === null ? '' : String(draft.ytmMin)}
              options={ytmOptions}
              onChange={(value) => update({ ytmMin: value === '' ? null : Number(value) })}
              highlight={draft.ytmMin !== null}
            />
          </Field>
          <Field label={t('bondScreener.fields.duration')}>
            <Select
              value={durationValue}
              options={durationOptions}
              onChange={(value) => {
                const [durationMin, durationMax] = readRange(value)
                update({ durationMin, durationMax })
              }}
              highlight={durationValue !== ''}
            />
          </Field>
          <Field label={t('bondScreener.fields.maturity')}>
            <Select
              value={maturityValue}
              options={maturityOptions}
              onChange={(value) => {
                const [maturityFrom, maturityTo] = readRange(value)
                update({ maturityFrom, maturityTo })
              }}
              highlight={maturityValue !== ''}
            />
          </Field>
          <Field label={t('bondScreener.fields.country')}>
            <Select
              value={draft.country ?? ''}
              options={countryOptions}
              onChange={(value) => update({ country: value || null })}
              highlight={draft.country !== null}
            />
          </Field>
          <Field label={t('bondScreener.fields.currency')}>
            <Select
              value={draft.currency ?? ''}
              options={currencyOptions}
              onChange={(value) => update({ currency: value || null })}
              highlight={draft.currency !== null}
            />
          </Field>
          <Field label={t('bondScreener.fields.ratingMin')}>
            <Select
              value={draft.ratingMin ?? ''}
              options={ratingOptions}
              onChange={(value) => update({ ratingMin: value || null })}
              highlight={draft.ratingMin !== null}
            />
          </Field>
          <Field label={t('bondScreener.fields.couponType')}>
            <Select
              value={draft.couponType ?? ''}
              options={couponOptions}
              onChange={(value) => update({ couponType: (value || null) as CouponType | null })}
              highlight={draft.couponType !== null}
            />
          </Field>
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" variant="primary" size="lg" disabled={!runnable}>
              {t('bondScreener.run')}
            </Button>
            <Button size="lg" onClick={reset}>
              {t('bondScreener.reset')}
            </Button>
          </div>
          {!runnable && (
            <p className="font-sans text-title text-warning">{t('bondScreener.tickOne')}</p>
          )}
          {changed && runnable && (
            <p className="font-sans text-title text-warning">{t('bondScreener.notRun')}</p>
          )}
          {canSave && <SavedBondScreens loadedId={screenId} onLoad={load} />}
        </div>
      </form>
      <SaveBondScreenDialog
        open={canSave && saving}
        onClose={() => setSaving(false)}
        criteria={toSaved(draft)}
        onSaved={(screen) => useBondScreenerStore.setState({ screenId: screen.id })}
      />
    </Panel>
  )
}
