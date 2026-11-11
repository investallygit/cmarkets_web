import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePaymentSettings, useSavePaymentSettings } from '@/entities/news-statement'
import { isApiError } from '@/shared/api'
import type { NewsPaymentSettingsDto, NewsPaymentSettingsWriteDto } from '@/shared/api/contracts'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { TextInput } from '@/shared/ui/form/TextInput'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/**
 * MPAY's "Global settings" (spec, screen 18): a new newspaper's rate and cap, the minimum payment
 * (less is carried over), the four-eyes threshold, the days to dispute, when the statements are
 * computed (a day and a time of Douala), the anti-fraud thresholds.
 */
export function PaymentSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const settings = usePaymentSettings()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('mediaPayments.settings.title')}
      placement="right"
      width={420}
    >
      {open && (
        <QueryView query={settings}>
          {(current) => <SettingsForm settings={current} onSaved={onClose} />}
        </QueryView>
      )}
    </Dialog>
  )
}

type Numbers = Omit<NewsPaymentSettingsWriteDto, 'calculationTime'>

const FIELDS: readonly {
  key: keyof Numbers
  label:
    | 'mediaPayments.settings.defaultRate'
    | 'mediaPayments.settings.defaultCap'
    | 'mediaPayments.settings.minimum'
    | 'mediaPayments.settings.fourEyes'
    | 'mediaPayments.settings.disputeWindow'
    | 'mediaPayments.settings.calculationDay'
    | 'mediaPayments.settings.spikeFactor'
    | 'mediaPayments.settings.sharedAccounts'
  decimals: number
}[] = [
  { key: 'defaultRatePerClick', label: 'mediaPayments.settings.defaultRate', decimals: 0 },
  { key: 'defaultMonthlyCap', label: 'mediaPayments.settings.defaultCap', decimals: 0 },
  { key: 'minimumPayment', label: 'mediaPayments.settings.minimum', decimals: 0 },
  { key: 'fourEyesThreshold', label: 'mediaPayments.settings.fourEyes', decimals: 0 },
  { key: 'disputeWindowDays', label: 'mediaPayments.settings.disputeWindow', decimals: 0 },
  { key: 'calculationDay', label: 'mediaPayments.settings.calculationDay', decimals: 0 },
  { key: 'spikeFactor', label: 'mediaPayments.settings.spikeFactor', decimals: 1 },
  { key: 'sharedAddressAccounts', label: 'mediaPayments.settings.sharedAccounts', decimals: 0 },
]

function SettingsForm({
  settings,
  onSaved,
}: {
  settings: NewsPaymentSettingsDto
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const save = useSavePaymentSettings()
  const [numbers, setNumbers] = useState<Record<keyof Numbers, number | null>>({
    defaultRatePerClick: settings.defaultRatePerClick,
    defaultMonthlyCap: settings.defaultMonthlyCap,
    minimumPayment: settings.minimumPayment,
    fourEyesThreshold: settings.fourEyesThreshold,
    disputeWindowDays: settings.disputeWindowDays,
    calculationDay: settings.calculationDay,
    spikeFactor: settings.spikeFactor,
    sharedAddressAccounts: settings.sharedAddressAccounts,
  })
  const [time, setTime] = useState(settings.calculationTime)
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const missing = FIELDS.some(({ key }) => key !== 'defaultMonthlyCap' && numbers[key] === null)

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (missing) return
        save.mutate(
          {
            defaultRatePerClick: numbers.defaultRatePerClick ?? 0,
            defaultMonthlyCap: numbers.defaultMonthlyCap,
            minimumPayment: numbers.minimumPayment ?? 0,
            fourEyesThreshold: numbers.fourEyesThreshold ?? 0,
            disputeWindowDays: numbers.disputeWindowDays ?? 0,
            calculationDay: numbers.calculationDay ?? 0,
            calculationTime: time.trim(),
            spikeFactor: numbers.spikeFactor ?? 0,
            sharedAddressAccounts: numbers.sharedAddressAccounts ?? 0,
          },
          {
            onSuccess: () => {
              toast.success(t('mediaPayments.settings.saved'))
              onSaved()
            },
          },
        )
      }}
    >
      {FIELDS.map(({ key, label, decimals }) => (
        <Field key={key} label={t(label)} error={server[key]?.[0]}>
          <NumberInput
            value={numbers[key]}
            onChange={(value) => setNumbers({ ...numbers, [key]: value })}
            decimals={decimals}
            highlight
          />
        </Field>
      ))}
      <Field
        label={t('mediaPayments.settings.calculationTime')}
        error={server.calculationTime?.[0]}
      >
        <TextInput value={time} onChange={setTime} mono highlight placeholder="02:00" />
      </Field>
      {save.error && (
        <p role="alert" className="font-sans text-data text-down">
          {isApiError(save.error, 400) ? t('mediaPayments.settings.invalid') : save.error.message}
        </p>
      )}
      <Button type="submit" busy={save.isPending} disabled={missing}>
        {t('mediaPayments.settings.save')}
      </Button>
    </form>
  )
}
