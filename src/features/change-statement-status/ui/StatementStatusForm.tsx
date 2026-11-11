import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  secondAdminOf,
  StatementStatusBadge,
  useChangeStatementStatus,
  usePaymentSettings,
} from '@/entities/news-statement'
import { isApiError } from '@/shared/api'
import {
  STATEMENT_PAYMENT_METHODS,
  type NewsStatementDto,
  type StatementPaymentMethod,
  type StatementStatus,
  type StatementStatusWriteDto,
} from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { needsPayment, statusChoices } from '../lib/statusOptions'

/**
 * The statement's status picked by hand (spec, screen 18, "Manual status change"): the new status
 * with what it needs, the reason always, the payment's date, method and reference for Paid. A
 * change a second Admin must confirm is kept for them: the statement shows it waiting.
 */
export function StatementStatusForm({ statement }: { statement: NewsStatementDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const settings = usePaymentSettings()
  const change = useChangeStatementStatus()
  const [status, setStatus] = useState<StatementStatus | ''>('')
  const [reason, setReason] = useState('')
  const [paidAt, setPaidAt] = useState<string | null>(() => format.day(new Date()))
  const [method, setMethod] = useState<StatementPaymentMethod>('transfer')
  const [reference, setReference] = useState('')

  const hint = (value: StatementStatus) =>
    value === 'approved'
      ? t('mediaPayments.statusHints.approved', {
          amount: format.number(settings.data?.fourEyesThreshold ?? 300_000, 0),
        })
      : t(`mediaPayments.statusHints.${value}`)
  const options = [
    { value: '' as const, label: t('mediaPayments.statement.choose') },
    ...statusChoices(statement.status).map((value) => ({
      value,
      label: `${t(`mediaPayments.statuses.${value}`)} — ${hint(value)}`,
    })),
  ]
  const payment = needsPayment(status)
  const ready =
    status !== '' &&
    reason.trim() !== '' &&
    (!payment || (paidAt !== null && reference.trim() !== ''))
  const server = isApiError(change.error, 400) ? (change.error.problem.errors ?? {}) : {}

  const apply = () => {
    if (status === '') return
    const body: StatementStatusWriteDto =
      payment && paidAt !== null
        ? { status, reason: reason.trim(), paidAt, method, reference: reference.trim() }
        : { status, reason: reason.trim() }
    change.mutate(
      { id: statement.id, change: body },
      {
        onSuccess: (updated) => {
          toast.success(
            t('mediaPayments.statement.applied', {
              status: t(`mediaPayments.statuses.${updated.status}`),
            }),
          )
          setStatus('')
          setReason('')
          setReference('')
        },
        onError: (error) => {
          if (!secondAdminOf(error)) return
          toast.info(t('mediaPayments.statement.asked'))
          setStatus('')
          setReason('')
        },
      },
    )
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (ready) apply()
      }}
    >
      <p className="flex items-center gap-2 font-sans text-data text-secondary">
        {t('mediaPayments.statement.current')} <StatementStatusBadge status={statement.status} />
      </p>
      <Field label={t('mediaPayments.statement.newStatus')} error={server.status?.[0]}>
        <Select value={status} options={options} onChange={setStatus} highlight />
      </Field>
      {payment && (
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label={t('mediaPayments.statement.paidOn')} error={server.paidAt?.[0]}>
            <DateInput value={paidAt} onChange={setPaidAt} highlight />
          </Field>
          <Field label={t('mediaPayments.statement.method')}>
            <Select
              value={method}
              options={STATEMENT_PAYMENT_METHODS.map((value) => ({
                value,
                label: t(`mediaPayments.statement.methods.${value}`),
              }))}
              onChange={setMethod}
              highlight
            />
          </Field>
          <Field label={t('mediaPayments.statement.reference')} error={server.reference?.[0]}>
            <TextInput value={reference} onChange={setReference} mono highlight />
          </Field>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Field
          label={t('mediaPayments.statement.reason')}
          error={server.reason?.[0]}
          className="min-w-0 flex-1"
        >
          <TextInput value={reason} onChange={setReason} maxLength={500} />
        </Field>
        <Button type="submit" disabled={!ready} busy={change.isPending}>
          {t('mediaPayments.statement.apply')}
        </Button>
      </div>
      {change.error && !isApiError(change.error, 400) && !secondAdminOf(change.error) && (
        <p role="alert" className="font-sans text-data text-down">
          {change.error.message}
        </p>
      )}
    </form>
  )
}
