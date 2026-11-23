import type { UseQueryResult } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fieldsOf, withTable } from '@/entities/data-export'
import { DownloadButton, ScheduleExportButton } from '@/features/download-data'
import type {
  ExportDatasetDto,
  ExportFormat,
  ExportFrequency,
  ExportLayout,
  ExportLimitsDto,
  ExportPreviewDto,
  ExportSettingsDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { Panel } from '@/shared/ui/Panel'
import { isExportField } from '../lib/fields'
import { timeZoneOptions } from '../lib/timeZones'
import { SelectionField } from './SelectionField'

interface DownloadSettingsPanelProps {
  dataset: ExportDatasetDto
  limits: ExportLimitsDto
  settings: ExportSettingsDto
  onChange: (settings: ExportSettingsDto) => void
  /** The preview of complete settings, whose estimate the panel says; null otherwise. */
  preview: UseQueryResult<ExportPreviewDto> | null
  /** The settings to download, or null while incomplete. */
  ready: ExportSettingsDto | null
}

/**
 * DL's settings (spec section 9, screen 30): the selection, the period, the frequency, raw or
 * adjusted prices, the fields, the format, the layout, the decimal separator, the time zone; the
 * estimate of the file, then Download. A profile limited to CSV has the other formats locked.
 */
export function DownloadSettingsPanel({
  dataset,
  limits,
  settings,
  onChange,
  preview,
  ready,
}: DownloadSettingsPanelProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const set = (change: Partial<ExportSettingsDto>) => onChange({ ...settings, ...change })
  const estimate = preview?.data?.estimate
  const name = t(`downloads.datasets.${dataset.dataset}.name`)
  const fields = fieldsOf(dataset, settings)
  // A frequency for series of sessions: not the RFQ's agreements, a portfolio's positions or transactions.
  const periodic =
    dataset.dataset !== 'rfq' && settings.table !== 'positions' && settings.table !== 'transactions'

  return (
    <Panel
      title={t('downloads.settingsTitle', { dataset: name })}
      code="DL"
      bodyClassName="overflow-y-auto"
    >
      <div className="grid gap-2.5 p-3">
        {dataset.tables && (
          <Field label={t('downloads.table')} group>
            <SegmentedControl<string>
              value={settings.table ?? dataset.tables[0]?.table ?? null}
              options={dataset.tables.map(({ table }) => ({
                value: table,
                label: t(`downloads.tables.${table as 'positions'}`, { defaultValue: table }),
              }))}
              onChange={(table) => onChange(withTable(settings, dataset, table))}
            />
          </Field>
        )}
        <SelectionField dataset={dataset} settings={settings} onChange={onChange} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label={t('downloads.from')}>
            <DateInput value={settings.from} onChange={(from) => from && set({ from })} />
          </Field>
          <Field label={t('downloads.to')}>
            <DateInput value={settings.to} onChange={(to) => to && set({ to })} />
          </Field>
          {periodic && (
            <Field label={t('downloads.frequency')}>
              <Select<ExportFrequency>
                value={settings.frequency}
                options={(['day', 'week', 'month'] as const).map((value) => ({
                  value,
                  label: t(`downloads.frequencies.${value}`),
                }))}
                onChange={(frequency) => set({ frequency })}
              />
            </Field>
          )}
          {settings.adjusted !== undefined && (
            <Field label={t('downloads.prices')}>
              <Select<'raw' | 'adjusted'>
                value={settings.adjusted ? 'adjusted' : 'raw'}
                options={(['raw', 'adjusted'] as const).map((value) => ({
                  value,
                  label: t(`downloads.priceModes.${value}`),
                }))}
                onChange={(mode) => set({ adjusted: mode === 'adjusted' })}
              />
            </Field>
          )}
        </div>
        <Field label={t('downloads.fieldsLabel')} group>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {fields.map((field) => (
              <Checkbox
                key={field}
                checked={settings.fields.includes(field)}
                label={isExportField(field) ? t(`downloads.fields.${field}`) : field}
                onChange={(checked) =>
                  set({
                    fields: fields.filter((candidate) =>
                      candidate === field ? checked : settings.fields.includes(candidate),
                    ),
                  })
                }
              />
            ))}
          </div>
        </Field>
        <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2">
          <Field
            label={t('downloads.format')}
            hint={limits.csvOnly ? t('downloads.csvOnly') : undefined}
            group
          >
            <SegmentedControl<ExportFormat>
              value={settings.format}
              options={(['csv', 'xlsx', 'json'] as const).map((value) => ({
                value,
                label: value.toUpperCase(),
              }))}
              disabled={limits.csvOnly}
              onChange={(value) => set({ format: value })}
            />
          </Field>
          <Field label={t('downloads.layout')} group>
            <SegmentedControl<ExportLayout>
              value={settings.layout}
              options={(['sheets', 'table'] as const).map((value) => ({
                value,
                label: t(`downloads.layouts.${value}`),
              }))}
              disabled={settings.format !== 'xlsx'}
              onChange={(layout) => set({ layout })}
            />
          </Field>
          <Field label={t('downloads.decimal')} inline>
            <Select<'comma' | 'point'>
              value={settings.decimal}
              options={(['comma', 'point'] as const).map((value) => ({
                value,
                label: t(`downloads.decimals.${value}`),
              }))}
              onChange={(decimal) => set({ decimal })}
              className="w-32"
            />
          </Field>
          <Field label={t('downloads.timeZone')} inline>
            <Select<string>
              value={settings.timeZone}
              options={timeZoneOptions(settings.timeZone)}
              onChange={(timeZone) => set({ timeZone })}
              className="w-48"
            />
          </Field>
        </div>
        <p className="min-h-5 font-sans text-data text-info" aria-live="polite">
          {estimate ? (
            t('downloads.estimate', {
              rows: format.number(estimate.rows, 0),
              size: format.fileSize(estimate.bytes),
            })
          ) : preview?.isError ? (
            <span className="text-down">{preview.error.message}</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <DownloadButton settings={ready && !preview?.isError ? ready : null} />
          <ScheduleExportButton
            settings={ready && !preview?.isError ? ready : null}
            full={limits.schedules !== null && limits.schedulesUsed >= limits.schedules}
          />
          <span className="font-sans text-caption text-secondary">
            {estimate?.background
              ? t('downloads.background', { rows: format.number(limits.immediateRows, 0) })
              : t('downloads.immediate', { rows: format.number(limits.immediateRows, 0) })}
          </span>
        </div>
      </div>
    </Panel>
  )
}
