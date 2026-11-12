import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEtfFacets, useEtfLabels } from '@/entities/etf'
import { useHasPermission } from '@/entities/session'
import {
  ETF_ASSET_CLASSES,
  type EtfAssetClass,
  type EtfFacetDto,
  type EtfGeography,
  type EtfSector,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { MultiSelect } from '@/shared/ui/form/MultiSelect'
import { Select, type SelectOption } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import {
  SHARPE_CHOICES,
  TER_CHOICES,
  toSaved,
  YTD_CHOICES,
  type EtfCriteria,
} from '../model/criteria'
import { useEtfScreenerStore } from '../model/etfScreenerStore'
import { SavedEtfScreens } from './SavedEtfScreens'
import { SaveEtfScreenDialog } from './SaveEtfScreenDialog'

/** The values a filter finds, and the one chosen when a saved screen holds another. */
function valuesOf<T extends string>(
  facets: readonly EtfFacetDto<T>[] | undefined,
  current: T | null,
): T[] {
  const values = (facets ?? []).map((facet) => facet.value)
  return current !== null && !values.includes(current) ? [...values, current] : values
}

/** "> 8%" and "All": a threshold's choices, the current one kept when a saved screen holds another. */
function thresholdOptions(
  choices: readonly number[],
  current: number | null,
  label: (value: number) => string,
  all: string,
) {
  const values =
    current !== null && !choices.includes(current)
      ? [...choices, current].sort((a, b) => a - b)
      : choices
  return [
    { value: '', label: all },
    ...values.map((value) => ({ value: String(value), label: label(value) })),
  ]
}

const numberOf = (value: string) => (value === '' ? null : Number(value))

/**
 * Screen 15, criteria: the drop-downs of the mockup, active ones with an amber border, the
 * geographies several at once, then the three boxes. RUN sends GET /etfs; SAVE keeps the criteria
 * under a name (/analysis/etf-screens).
 */
export function EtfCriteriaPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const labels = useEtfLabels()
  const draft = useEtfScreenerStore((state) => state.draft)
  const applied = useEtfScreenerStore((state) => state.applied)
  const screenId = useEtfScreenerStore((state) => state.screenId)
  const { setDraft, run, reset, load } = useEtfScreenerStore.getState()
  const facets = useEtfFacets()
  // "Read" accounts (Journalist, CEO, News provider) screen without saving (spec section 12).
  const canSave = useHasPermission('analysis:save')
  const [saving, setSaving] = useState(false)
  const update = (change: Partial<EtfCriteria>) => setDraft({ ...draft, ...change })
  const changed = JSON.stringify(draft) !== JSON.stringify(applied)
  const all = t('etfScreener.all')

  const assetClassOptions: SelectOption<string>[] = [
    { value: '', label: all },
    ...ETF_ASSET_CLASSES.map((value: EtfAssetClass) => ({
      value,
      label: labels.assetClass(value),
    })),
  ]
  const textOptions = (
    values: readonly string[],
    label: (value: string) => string = (value) => value,
  ) => [{ value: '', label: all }, ...values.map((value) => ({ value, label: label(value) }))]
  const geographyOptions = valuesOf(facets.data?.geographies, null)
    .concat(
      draft.geographies.filter(
        (value) => !facets.data?.geographies.some((facet) => facet.value === value),
      ),
    )
    .map((value: EtfGeography) => ({ value, label: labels.geography(value) }))
  const sectorValues = valuesOf<EtfSector>(facets.data?.sectors, draft.sector)

  return (
    <Panel
      title={t('etfScreener.criteria')}
      code="ETFS"
      options={
        canSave && (
          <button
            type="button"
            onClick={() => setSaving(true)}
            className="panel-no-drag uppercase hover:text-primary"
          >
            {t('etfScreener.save')}
          </button>
        )
      }
      bodyClassName="flex flex-col"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault()
          run()
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2">
          <Field label={t('etfScreener.fields.assetClass')}>
            <Select
              value={draft.assetClass ?? ''}
              options={assetClassOptions}
              onChange={(value) => update({ assetClass: (value || null) as EtfAssetClass | null })}
              highlight={draft.assetClass !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.subCategory')}>
            <Select
              value={draft.subCategory ?? ''}
              options={textOptions(valuesOf(facets.data?.subCategories, draft.subCategory))}
              onChange={(value) => update({ subCategory: value || null })}
              highlight={draft.subCategory !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.geography')}>
            <MultiSelect
              values={draft.geographies}
              options={geographyOptions}
              onChange={(geographies) => update({ geographies })}
              placeholder={all}
              highlight={draft.geographies.length > 0}
            />
          </Field>
          <Field label={t('etfScreener.fields.sector')}>
            <Select
              value={draft.sector ?? ''}
              options={textOptions(sectorValues, (value) => labels.sector(value as EtfSector))}
              onChange={(value) => update({ sector: (value || null) as EtfSector | null })}
              highlight={draft.sector !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.provider')}>
            <Select
              value={draft.provider ?? ''}
              options={textOptions(valuesOf(facets.data?.providers, draft.provider))}
              onChange={(value) => update({ provider: value || null })}
              highlight={draft.provider !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.exchange')}>
            <Select
              value={draft.exchange ?? ''}
              options={textOptions(
                valuesOf(facets.data?.exchanges, draft.exchange),
                labels.exchange,
              )}
              onChange={(value) => update({ exchange: value || null })}
              highlight={draft.exchange !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.ytdMin')}>
            <Select
              value={draft.ytdMin === null ? '' : String(draft.ytdMin)}
              options={thresholdOptions(
                YTD_CHOICES,
                draft.ytdMin,
                (value) => t('etfScreener.above', { value: format.percent(value, 0, false) }),
                all,
              )}
              onChange={(value) => update({ ytdMin: numberOf(value) })}
              highlight={draft.ytdMin !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.sharpeMin')}>
            <Select
              value={draft.sharpeMin === null ? '' : String(draft.sharpeMin)}
              options={thresholdOptions(
                SHARPE_CHOICES,
                draft.sharpeMin,
                (value) => t('etfScreener.above', { value: format.number(value, 1) }),
                all,
              )}
              onChange={(value) => update({ sharpeMin: numberOf(value) })}
              highlight={draft.sharpeMin !== null}
            />
          </Field>
          <Field label={t('etfScreener.fields.terMax')}>
            <Select
              value={draft.terMax === null ? '' : String(draft.terMax)}
              options={thresholdOptions(
                TER_CHOICES,
                draft.terMax,
                (value) => t('etfScreener.below', { value: format.percent(value, 2, false) }),
                all,
              )}
              onChange={(value) => update({ terMax: numberOf(value) })}
              highlight={draft.terMax !== null}
            />
          </Field>
          <div className="flex flex-col gap-1.5 pt-1">
            <Checkbox
              checked={draft.ucitsOnly}
              onChange={(ucitsOnly) => update({ ucitsOnly })}
              label={t('etfScreener.fields.ucitsOnly')}
            />
            <Checkbox
              checked={draft.accumulatingOnly}
              onChange={(accumulatingOnly) => update({ accumulatingOnly })}
              label={t('etfScreener.fields.accumulatingOnly')}
            />
            <Checkbox
              checked={draft.hedgedOnly}
              onChange={(hedgedOnly) => update({ hedgedOnly })}
              label={t('etfScreener.fields.hedgedOnly')}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t p-2">
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" variant="primary" size="lg">
              {t('etfScreener.run')}
            </Button>
            <Button size="lg" onClick={reset}>
              {t('etfScreener.reset')}
            </Button>
          </div>
          {changed && (
            <p className="font-sans text-title text-warning">{t('etfScreener.notRun')}</p>
          )}
          {canSave && <SavedEtfScreens loadedId={screenId} onLoad={load} />}
        </div>
      </form>
      <SaveEtfScreenDialog
        open={canSave && saving}
        onClose={() => setSaving(false)}
        criteria={toSaved(draft)}
        onSaved={(screen) => useEtfScreenerStore.setState({ screenId: screen.id })}
      />
    </Panel>
  )
}
