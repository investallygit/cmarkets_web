import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  isTrade,
  TRANSACTION_TYPES,
  transactionSecurity,
  usePortfolio,
  useRecordTransaction,
  useUpdateTransaction,
  type TransactionDialogRequest,
} from '@/entities/portfolio'
import { SecurityPicker } from '@/entities/security'
import { isApiError } from '@/shared/api'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  estimatedAmount,
  initialTransactionForm,
  SERVER_FIELDS,
  toTransactionInput,
  validateTransactionForm,
  type TransactionFormField,
  type TransactionFormState,
} from '../model/transactionForm'

const MAX_NOTE_LENGTH = 200

interface TransactionDialogProps {
  request: TransactionDialogRequest | null
  onClose: () => void
}

/** "New transaction" side form of screen 5, also used to correct a recorded one. */
export function TransactionDialog({ request, onClose }: TransactionDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      placement="right"
      title={
        request?.transaction
          ? t('portfolio.transactionForm.editTitle')
          : t('portfolio.transactionForm.newTitle')
      }
    >
      {request && <TransactionForm request={request} onClose={onClose} />}
    </Dialog>
  )
}

function TransactionForm({
  request,
  onClose,
}: {
  request: TransactionDialogRequest
  onClose: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const portfolio = usePortfolio(request.portfolioId).data
  const editing = request.transaction
  const [form, setForm] = useState(() => initialTransactionForm(request, today))
  const [submitted, setSubmitted] = useState(false)
  const record = useRecordTransaction(request.portfolioId)
  const update = useUpdateTransaction(request.portfolioId)
  const mutation = editing ? update : record
  const set = (patch: Partial<TransactionFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const errors = submitted ? validateTransactionForm(form, today) : {}
  // The server's 400 errors show under their fields; anything else, such as a 409, below.
  const serverErrors = isApiError(mutation.error, 400) ? (mutation.error.problem.errors ?? {}) : {}
  const serverError = (field: TransactionFormField | 'note' | 'type') =>
    Object.entries(serverErrors).find(([key]) => SERVER_FIELDS[key] === field)?.[1][0]
  const errorOf = (field: TransactionFormField) => {
    const error = errors[field]
    return error ? t(`portfolio.transactionForm.errors.${error}`) : serverError(field)
  }
  const generalError =
    mutation.error && Object.keys(serverErrors).length === 0 ? mutation.error.message : null

  const trade = isTrade(form.type)
  const rule = transactionSecurity(form.type)
  const bond = form.security?.type === 'bond'
  const estimate = estimatedAmount(form)
  const currency = portfolio?.currency ?? ''

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(validateTransactionForm(form, today)).length > 0) return
    const input = toTransactionInput(form, editing?.version)
    const type = t(`portfolio.transactionTypes.${form.type}`)
    const onSuccess = () => {
      toast.success(
        editing
          ? t('portfolio.transactionForm.saved', { type })
          : t('portfolio.transactionForm.recorded', { type }),
      )
      onClose()
    }
    if (editing) update.mutate({ id: editing.id, ...input }, { onSuccess })
    else record.mutate(input, { onSuccess })
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        {portfolio && (
          <p className="font-sans text-data text-secondary">
            {t('portfolio.transactionForm.portfolio', {
              name: portfolio.name,
              currency: portfolio.currency,
            })}
          </p>
        )}
        <Field label={t('portfolio.transactionForm.type')} error={serverError('type')}>
          <Select
            value={form.type}
            options={TRANSACTION_TYPES.map((type) => ({
              value: type,
              label: t(`portfolio.transactionTypes.${type}`),
            }))}
            onChange={(type) => set({ type })}
            highlight
          />
        </Field>
        <Field label={t('portfolio.transactionForm.date')} error={errorOf('date')}>
          <DateInput value={form.date} onChange={(date) => set({ date })} highlight />
        </Field>
        {rule && (
          <Field
            label={
              rule.required
                ? t('portfolio.transactionForm.security')
                : t('portfolio.transactionForm.securityOptional')
            }
            error={errorOf('security')}
          >
            <SecurityPicker
              value={form.security?.code}
              types={rule.types}
              onSelect={(picked) =>
                set({
                  security: {
                    id: picked.id,
                    code: picked.code,
                    type: picked.type,
                    currency: picked.currency,
                  },
                })
              }
              onClear={rule.required ? undefined : () => set({ security: null })}
              highlight
            />
          </Field>
        )}
        {trade ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={
                  bond
                    ? t('portfolio.transactionForm.bonds')
                    : t('portfolio.transactionForm.quantity')
                }
                error={errorOf('quantity')}
              >
                <NumberInput
                  value={form.quantity}
                  onChange={(quantity) => set({ quantity })}
                  decimals={0}
                  highlight
                />
              </Field>
              <Field
                label={
                  bond
                    ? t('portfolio.transactionForm.cleanPrice')
                    : t('portfolio.transactionForm.price')
                }
                error={errorOf('price')}
              >
                <NumberInput
                  value={form.price}
                  onChange={(price) => set({ price })}
                  decimals={bond ? 2 : 0}
                  highlight
                />
              </Field>
            </div>
            <Field label={t('portfolio.transactionForm.fees')} error={errorOf('fees')}>
              <NumberInput
                value={form.fees}
                onChange={(fees) => set({ fees })}
                decimals={0}
                highlight
              />
            </Field>
            {(estimate !== null || bond) && (
              <p className="font-sans text-data text-secondary">
                {estimate === null
                  ? t('portfolio.transactionForm.accruedHint')
                  : t('portfolio.transactionForm.estimate', {
                      amount: format.signed(estimate, 0),
                      currency: form.security?.currency ?? '',
                    })}
              </p>
            )}
          </>
        ) : (
          <Field
            label={t('portfolio.transactionForm.amount', { currency })}
            error={errorOf('amount')}
          >
            <NumberInput
              value={form.amount}
              onChange={(amount) => set({ amount })}
              decimals={currency === 'XAF' ? 0 : 2}
              highlight
            />
          </Field>
        )}
        <Field label={t('portfolio.transactionForm.note')} error={serverError('note')}>
          <TextInput
            value={form.note}
            onChange={(note) => set({ note })}
            maxLength={MAX_NOTE_LENGTH}
          />
        </Field>
        {generalError && (
          <p role="alert" className="font-sans text-data text-down">
            {generalError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={mutation.isPending}>
          {editing ? t('common.save') : t('portfolio.transactionForm.record')}
        </Button>
      </DialogFooter>
    </form>
  )
}
