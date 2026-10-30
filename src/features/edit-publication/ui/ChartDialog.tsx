import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FROZEN_CHART_PERIODS, FROZEN_CHART_TYPES, useFreezeChart } from '@/entities/publication'
import { SecurityPicker } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { FrozenChartDto, FrozenChartPeriod, FrozenChartType } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { TextInput } from '@/shared/ui/form/TextInput'

interface ChartDialogProps {
  open: boolean
  onClose: () => void
  publicationId: string
  /** The company of the publication, chosen first. */
  security: { id: string; code: string } | null
  onInsert: (chart: FrozenChartDto) => void
}

/**
 * "CMarket chart" of the toolbar (screen 7): a security, a period and a type; the server copies
 * the prices of today into the publication, so the chart never moves afterwards.
 */
export function ChartDialog({ open, onClose, ...chart }: ChartDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('studio.chart.title')}>
      <ChartForm {...chart} onClose={onClose} />
    </Dialog>
  )
}

function ChartForm({
  publicationId,
  security: initial,
  onInsert,
  onClose,
}: Omit<ChartDialogProps, 'open'>) {
  const { t } = useTranslation()
  const freeze = useFreezeChart(publicationId)
  const [security, setSecurity] = useState(initial)
  const [period, setPeriod] = useState<FrozenChartPeriod>('1Y')
  const [type, setType] = useState<FrozenChartType>('line')
  const [title, setTitle] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const placeholder = security
    ? t('studio.chart.defaultTitle', { code: security.code, period })
    : ''
  const errors = isApiError(freeze.error, 400) ? (freeze.error.problem.errors ?? {}) : {}

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!security) return
        freeze.mutate(
          { securityId: security.id, period, type, title: title.trim() || placeholder },
          {
            onSuccess: (chart) => {
              onInsert(chart)
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <Field
          label={t('studio.chart.security')}
          error={
            (submitted && !security && t('studio.chart.securityRequired')) ||
            errors.securityId?.[0] ||
            null
          }
        >
          <SecurityPicker
            value={security?.code ?? null}
            onSelect={(picked) => setSecurity({ id: picked.id, code: picked.code })}
            onClear={() => setSecurity(null)}
            highlight={Boolean(security)}
          />
        </Field>
        <Field label={t('studio.chart.period')} group>
          <SegmentedControl
            value={period}
            options={FROZEN_CHART_PERIODS.map((value) => ({ value, label: value }))}
            onChange={setPeriod}
          />
        </Field>
        <Field label={t('studio.chart.type')} group>
          <SegmentedControl
            value={type}
            options={FROZEN_CHART_TYPES.map((value) => ({
              value,
              label: t(`studio.chart.types.${value}`),
            }))}
            onChange={setType}
          />
        </Field>
        <Field label={t('studio.chart.caption')} error={errors.title?.[0] ?? null}>
          <TextInput value={title} onChange={setTitle} placeholder={placeholder} maxLength={80} />
        </Field>
        <p className="font-sans text-data text-secondary">{t('studio.chart.frozen')}</p>
        {freeze.error && !isApiError(freeze.error, 400) && (
          <p role="alert" className="font-sans text-label text-down">
            {freeze.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={freeze.isPending}>
          {t('studio.chart.insert')}
        </Button>
      </DialogFooter>
    </form>
  )
}
