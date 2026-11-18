import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AGREEMENT_STATUSES,
  EMAIL_STATUSES,
  FACE_UNIT,
  useAgreementFilters,
  useDeleteAgreementFilter,
  useRfqAgreementOptions,
  withoutBlanks,
} from '@/entities/rfq-agreement'
import type {
  RfqAgreementCriteria,
  RfqAgreementRole,
  RfqInstrument,
  RfqSide,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { MultiSelect } from '@/shared/ui/form/MultiSelect'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'
import { ScrollArea } from '@/shared/ui/ScrollArea'
import { toast } from '@/shared/ui/toast'
import { SaveFilterDialog } from './SaveFilterDialog'

/** From where the agreements are read: the side, the role and the SVT filter read accordingly. */
export type AgreementReader = 'party' | 'svt' | 'admin'

interface AgreementFiltersPanelProps {
  /** The filters the list shows. */
  applied: RfqAgreementCriteria
  onApply: (criteria: RfqAgreementCriteria) => void
  reader: AgreementReader
}

/**
 * Screen 23's filters (spec: "Free search (agreement number, security, counterparty), period,
 * status, e-mail status, side, security type (BTA, OTA), issuing country, security, SVT (own or the
 * counterparty's), role (requester or responder), trader, minimum and maximum face amount; Apply,
 * Save filter, Reset"), with the user's saved filters. The Admin, no party, filters neither side
 * nor role (ROADMAP decision 26). What the selects offer comes from the reader's agreements.
 */
export function AgreementFiltersPanel({ applied, onApply, reader }: AgreementFiltersPanelProps) {
  const { t } = useTranslation()
  // Reset empties the fields even when nothing was applied yet (B83).
  const [resets, setResets] = useState(0)
  return (
    <Panel
      title={t('panels.rfqAgreementFilters')}
      code="RFQ AGR"
      options={
        <button
          type="button"
          onClick={() => {
            setResets((count) => count + 1)
            onApply({})
          }}
          className="panel-no-drag inline-flex h-6 items-center uppercase hover:text-primary"
        >
          {t('rfqAgreements.filters.reset')}
        </button>
      }
      bodyClassName="flex flex-col"
    >
      <SavedFilters onLoad={onApply} />
      {/* A new draft whenever the applied filters change, or Reset is pressed. */}
      <FiltersForm
        key={`${JSON.stringify(applied)}:${resets}`}
        applied={applied}
        onApply={onApply}
        reader={reader}
      />
    </Panel>
  )
}

function FiltersForm({ applied, onApply, reader }: AgreementFiltersPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const options = useRfqAgreementOptions()
  const [draft, setDraft] = useState<RfqAgreementCriteria>(applied)
  const [saving, setSaving] = useState<RfqAgreementCriteria | null>(null)
  const set = (change: Partial<RfqAgreementCriteria>) =>
    setDraft((current) => ({ ...current, ...change }))
  const all = t('rfqAgreements.filters.all')
  const periodError =
    draft.from && draft.to && draft.from > draft.to
      ? t('rfqAgreements.filters.periodInOrder')
      : undefined
  const faceError =
    draft.minFace !== undefined && draft.maxFace !== undefined && draft.minFace > draft.maxFace
      ? t('rfqAgreements.filters.facesInOrder')
      : undefined
  const millions = (value: number | undefined) =>
    value === undefined ? null : Math.round((value / FACE_UNIT) * 100) / 100
  const francs = (value: number | null) => (value === null ? undefined : value * FACE_UNIT)

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        if (!periodError && !faceError) onApply(withoutBlanks(draft))
      }}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-2">
          <Field label={t('rfqAgreements.filters.search')}>
            <TextInput
              value={draft.q ?? ''}
              onChange={(q) => set({ q })}
              placeholder={t('rfqAgreements.filters.searchPlaceholder')}
            />
          </Field>
          <Field label={t('rfqAgreements.filters.period')} group error={periodError}>
            <div className="grid grid-cols-2 gap-2">
              <DateInput
                value={draft.from ?? null}
                onChange={(from) => set({ from: from ?? undefined })}
                aria-label={t('rfqAgreements.filters.from')}
                highlight={draft.from !== undefined}
              />
              <DateInput
                value={draft.to ?? null}
                onChange={(to) => set({ to: to ?? undefined })}
                aria-label={t('rfqAgreements.filters.to')}
                highlight={draft.to !== undefined}
              />
            </div>
          </Field>
          <Field label={t('rfqAgreements.filters.status')}>
            <MultiSelect
              values={draft.status ?? []}
              options={AGREEMENT_STATUSES.map((value) => ({
                value,
                label: t(`rfqTrading.agreementStatus.${value}`),
              }))}
              onChange={(status) => set({ status })}
              placeholder={all}
              highlight={(draft.status ?? []).length > 0}
            />
          </Field>
          <Field label={t('rfqAgreements.filters.emailStatus')}>
            <MultiSelect
              values={draft.emailStatus ?? []}
              options={EMAIL_STATUSES.map((value) => ({
                value,
                label: t(`rfqAgreements.emailStatus.${value}`),
              }))}
              onChange={(emailStatus) => set({ emailStatus })}
              placeholder={all}
              highlight={(draft.emailStatus ?? []).length > 0}
            />
          </Field>
          {reader !== 'admin' && (
            <Field label={t('rfqAgreements.filters.side')}>
              <Select<RfqSide | ''>
                value={draft.side ?? ''}
                options={[
                  { value: '', label: all },
                  { value: 'buy', label: t('rfqTrading.side.buy') },
                  { value: 'sell', label: t('rfqTrading.side.sell') },
                ]}
                onChange={(side) => set({ side: side || undefined })}
                highlight={draft.side !== undefined}
              />
            </Field>
          )}
          <Field label={t('rfqAgreements.filters.type')}>
            <Select<RfqInstrument | ''>
              value={draft.type ?? ''}
              options={[
                { value: '', label: t('rfqAgreements.filters.typeAll') },
                { value: 'BTA', label: 'BTA' },
                { value: 'OTA', label: 'OTA' },
              ]}
              onChange={(type) => set({ type: type || undefined })}
              highlight={draft.type !== undefined}
            />
          </Field>
          <Field label={t('rfqAgreements.filters.country')}>
            <Select
              value={draft.country ?? ''}
              options={[
                { value: '', label: all },
                ...(options.data?.countries ?? []).map((code) => ({
                  value: code,
                  label: format.country(code),
                })),
              ]}
              onChange={(country) => set({ country: country || undefined })}
              highlight={draft.country !== undefined}
            />
          </Field>
          <Field label={t('rfqAgreements.filters.security')}>
            <Select
              value={draft.securityId ?? ''}
              options={[
                { value: '', label: all },
                ...(options.data?.securities ?? []).map((security) => ({
                  value: security.id,
                  label: security.code,
                })),
              ]}
              onChange={(securityId) => set({ securityId: securityId || undefined })}
              highlight={draft.securityId !== undefined}
            />
          </Field>
          <Field
            label={
              reader === 'party'
                ? t('rfqAgreements.filters.svt')
                : t('rfqAgreements.filters.svtAny')
            }
          >
            <Select
              value={draft.svtId ?? ''}
              options={[
                { value: '', label: all },
                ...(options.data?.svts ?? []).map((svt) => ({ value: svt.id, label: svt.name })),
              ]}
              onChange={(svtId) => set({ svtId: svtId || undefined })}
              highlight={draft.svtId !== undefined}
            />
          </Field>
          {reader !== 'admin' && (
            <Field label={t('rfqAgreements.filters.role')}>
              <Select<RfqAgreementRole | ''>
                value={draft.role ?? ''}
                options={[
                  { value: '', label: t('rfqAgreements.filters.roleAll') },
                  { value: 'requester', label: t('rfqAgreements.role.requester') },
                  { value: 'responder', label: t('rfqAgreements.role.responder') },
                ]}
                onChange={(role) => set({ role: role || undefined })}
                highlight={draft.role !== undefined}
              />
            </Field>
          )}
          <Field label={t('rfqAgreements.filters.trader')}>
            <Select
              value={draft.traderId ?? ''}
              options={[
                { value: '', label: all },
                ...(options.data?.traders ?? []).map((trader) => ({
                  value: trader.id,
                  label: `${trader.name} · ${trader.organization}`,
                })),
              ]}
              onChange={(traderId) => set({ traderId: traderId || undefined })}
              highlight={draft.traderId !== undefined}
            />
          </Field>
          <Field label={t('rfqAgreements.filters.face')} group error={faceError}>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                value={millions(draft.minFace)}
                onChange={(value) => set({ minFace: francs(value) })}
                decimals={2}
                placeholder={t('rfqAgreements.filters.min')}
                aria-label={t('rfqAgreements.filters.min')}
                highlight={draft.minFace !== undefined}
              />
              <NumberInput
                value={millions(draft.maxFace)}
                onChange={(value) => set({ maxFace: francs(value) })}
                decimals={2}
                placeholder={t('rfqAgreements.filters.max')}
                aria-label={t('rfqAgreements.filters.max')}
                highlight={draft.maxFace !== undefined}
              />
            </div>
          </Field>
        </div>
      </ScrollArea>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t p-2">
        <Button type="submit" variant="primary" disabled={Boolean(periodError ?? faceError)}>
          {t('rfqAgreements.filters.apply')}
        </Button>
        <Button type="button" onClick={() => setSaving(withoutBlanks(draft))}>
          {t('rfqAgreements.filters.save')}
        </Button>
      </div>
      <SaveFilterDialog criteria={saving} onClose={() => setSaving(null)} />
    </form>
  )
}

/** The user's saved filters: one picked is applied; the one picked can be deleted. */
function SavedFilters({ onLoad }: { onLoad: (criteria: RfqAgreementCriteria) => void }) {
  const { t } = useTranslation()
  const filters = useAgreementFilters()
  const remove = useDeleteAgreementFilter()
  const [picked, setPicked] = useState('')
  const saved = filters.data ?? []
  const current = saved.find((filter) => filter.id === picked)
  if (saved.length === 0) return null
  return (
    <Field label={t('rfqAgreements.filters.saved')} className="shrink-0 border-b p-2">
      <div className="flex gap-1">
        <Select
          value={picked}
          options={[
            { value: '', label: t('rfqAgreements.filters.savedPick') },
            ...saved.map((filter) => ({ value: filter.id, label: filter.name })),
          ]}
          onChange={(id) => {
            setPicked(id)
            const filter = saved.find((candidate) => candidate.id === id)
            if (filter) onLoad(withoutBlanks(filter.criteria))
          }}
          className="min-w-0 flex-1"
        />
        {current && (
          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            aria-label={t('rfqAgreements.filters.deleteSaved', { name: current.name })}
            title={t('rfqAgreements.filters.deleteSaved', { name: current.name })}
            busy={remove.isPending}
            onClick={() =>
              remove.mutate(current.id, {
                onSuccess: () => {
                  toast.success(t('rfqAgreements.filters.deleted', { name: current.name }))
                  setPicked('')
                },
              })
            }
          />
        )}
      </div>
    </Field>
  )
}
