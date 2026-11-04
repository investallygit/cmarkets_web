import { Plus, X } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIndices } from '@/entities/market'
import {
  PORTFOLIO_CURRENCIES,
  PORTFOLIO_LIMITS,
  useCreatePortfolio,
  useUpdatePortfolio,
  type PortfolioDialogRequest,
} from '@/entities/portfolio'
import { SecurityPicker, useSecurities } from '@/entities/security'
import { useCurrentUser } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { PortfolioDto, PortfolioLimit } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { useMarketDay } from '@/shared/lib/useMarketDay'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  cashWeight,
  hasErrors,
  initialPortfolioForm,
  MAX_NAME_LENGTH,
  newLine,
  toCreateInput,
  toUpdateInput,
  validatePortfolioForm,
  type PortfolioFormError,
  type PortfolioFormState,
} from '../model/portfolioForm'
import { usePortfolioQuota } from '../model/usePortfolioQuota'

/** MCAP is the market's capitalization, not an index a portfolio can be measured against. */
const NOT_A_BENCHMARK = 'MCAP'

interface PortfolioDialogProps {
  request: PortfolioDialogRequest | null
  onClose: () => void
  onSaved?: (portfolio: PortfolioDto) => void
}

/**
 * New portfolio, or its settings: currency, benchmark, limits, a model's allocation, and whether
 * the members of the organisation read it.
 */
export function PortfolioDialog({ request, onClose, onSaved }: PortfolioDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      width={520}
      title={
        request?.mode === 'edit'
          ? t('portfolio.form.editTitle', { name: request.portfolio.name })
          : t('portfolio.form.newTitle')
      }
    >
      {request && <PortfolioForm request={request} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  )
}

function PortfolioForm({
  request,
  onClose,
  onSaved,
}: Omit<PortfolioDialogProps, 'request'> & { request: PortfolioDialogRequest }) {
  const { t } = useTranslation()
  const format = useFormat()
  const today = useMarketDay()
  const { modelOnly } = usePortfolioQuota()
  const { organization } = useCurrentUser()
  const shareHintId = useId()
  const editing = request.mode === 'edit' ? request.portfolio : null
  const securities = useSecurities({})
  const codes = useMemo(
    () => new Map(securities.data?.map((security) => [security.id, security.code])),
    [securities.data],
  )
  const [form, setForm] = useState(() =>
    initialPortfolioForm(editing, modelOnly, today, (id) => codes.get(id) ?? id),
  )
  const [submitted, setSubmitted] = useState(false)
  const indices = useIndices()
  const create = useCreatePortfolio()
  const update = useUpdatePortfolio(editing?.id ?? '')
  const mutation = editing ? update : create
  const set = (patch: Partial<PortfolioFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const errors = submitted ? validatePortfolioForm(form, today) : {}
  const message = (error: PortfolioFormError | undefined) =>
    error && t(`portfolio.form.errors.${error}`)
  const serverErrors = isApiError(mutation.error, 400) ? (mutation.error.problem.errors ?? {}) : {}
  const serverError = (field: string) => serverErrors[field]?.[0]
  const generalError =
    mutation.error && Object.keys(serverErrors).length === 0 ? mutation.error.message : null
  const benchmarks = (indices.data ?? [])
    .filter((index) => index.code !== NOT_A_BENCHMARK)
    .map((index) => ({ value: index.code, label: `${index.code} · ${index.name}` }))
  const cash = cashWeight(form)

  const submit = () => {
    setSubmitted(true)
    if (hasErrors(validatePortfolioForm(form, today))) return
    const onSuccess = (portfolio: PortfolioDto) => {
      toast.success(
        t(editing ? 'portfolio.form.saved' : 'portfolio.form.created', { name: portfolio.name }),
      )
      onSaved?.(portfolio)
      onClose()
    }
    const inOrganization = organization !== null
    if (editing) update.mutate(toUpdateInput(form, editing.version, inOrganization), { onSuccess })
    else create.mutate(toCreateInput(form, inOrganization), { onSuccess })
  }

  const setLimit = (key: PortfolioLimit, value: number | null) =>
    set({ limits: { ...form.limits, [key]: value } })
  const setLine = (key: string, patch: Partial<PortfolioFormState['lines'][number]>) =>
    set({ lines: form.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)) })

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <Field label={t('portfolio.form.name')} error={message(errors.name) ?? serverError('name')}>
          <TextInput
            value={form.name}
            onChange={(name) => set({ name })}
            maxLength={MAX_NAME_LENGTH}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t('portfolio.form.kind')}
            group
            hint={modelOnly && !editing ? t('portfolio.form.modelOnly') : undefined}
          >
            <SegmentedControl
              value={form.kind}
              disabled={editing !== null || modelOnly}
              options={(['real', 'model'] as const).map((kind) => ({
                value: kind,
                label: t(`portfolio.kinds.${kind}`),
              }))}
              onChange={(kind) => set({ kind })}
            />
          </Field>
          <Field label={t('portfolio.form.currency')} group>
            <SegmentedControl
              value={form.currency}
              disabled={editing !== null}
              options={PORTFOLIO_CURRENCIES.map((currency) => ({
                value: currency,
                label: currency,
              }))}
              onChange={(currency) => set({ currency })}
            />
          </Field>
        </div>
        <p className="font-sans text-data text-secondary">
          {t(form.kind === 'model' ? 'portfolio.form.modelHint' : 'portfolio.form.realHint')}
        </p>
        <Field label={t('portfolio.form.benchmark')} error={serverError('benchmark')}>
          <Select
            value={form.benchmark}
            options={
              benchmarks.length > 0
                ? benchmarks
                : [{ value: form.benchmark, label: form.benchmark }]
            }
            onChange={(benchmark) => set({ benchmark })}
          />
        </Field>

        {form.kind === 'model' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 font-sans text-data text-secondary">
              {t('portfolio.form.allocation')}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t('portfolio.form.notional', { currency: form.currency })}
                error={message(errors.notional) ?? serverError('model.notional')}
              >
                <NumberInput
                  value={form.notional}
                  onChange={(notional) => set({ notional })}
                  decimals={0}
                  highlight
                />
              </Field>
              <Field
                label={t('portfolio.form.startDate')}
                error={message(errors.startDate) ?? serverError('model.startDate')}
              >
                <DateInput
                  value={form.startDate}
                  onChange={(startDate) => set({ startDate })}
                  highlight
                />
              </Field>
            </div>
            <ul className="flex flex-col gap-1.5">
              {form.lines.map((line, index) => {
                const lineErrors = errors.line?.[line.key]
                const lineError =
                  message(lineErrors?.security) ??
                  message(lineErrors?.weightPct) ??
                  serverError(`model.lines[${index}].securityId`) ??
                  serverError(`model.lines[${index}].weightPct`)
                return (
                  <li key={line.key} className="flex flex-col gap-0.5">
                    <div className="grid grid-cols-[minmax(0,1fr)_96px_20px] items-center gap-2">
                      <SecurityPicker
                        value={line.security && (codes.get(line.security.id) ?? line.security.code)}
                        onSelect={(picked) =>
                          setLine(line.key, { security: { id: picked.id, code: picked.code } })
                        }
                        aria-label={t('portfolio.form.lineSecurity', { index: index + 1 })}
                        highlight
                      />
                      <NumberInput
                        value={line.weightPct}
                        onChange={(weightPct) => setLine(line.key, { weightPct })}
                        decimals={1}
                        suffix="%"
                        aria-label={t('portfolio.form.lineWeight', { index: index + 1 })}
                        highlight
                      />
                      <button
                        type="button"
                        aria-label={t('portfolio.form.removeLine', { index: index + 1 })}
                        onClick={() => set({ lines: form.lines.filter((other) => other !== line) })}
                        className="text-secondary hover:text-down"
                      >
                        <X aria-hidden className="size-3.5" />
                      </button>
                    </div>
                    {lineError && <p className="font-sans text-title text-down">{lineError}</p>}
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="info"
                size="sm"
                icon={Plus}
                onClick={() => set({ lines: [...form.lines, newLine()] })}
              >
                {t('portfolio.form.addLine')}
              </Button>
              <span
                className={
                  cash < 0 ? 'font-mono text-data text-down' : 'font-mono text-data text-secondary'
                }
              >
                {t('portfolio.form.cash', { weight: format.percent(cash, 1, false) })}
              </span>
            </div>
            {(errors.lines || serverError('model.lines')) && (
              <p className="font-sans text-title text-down">
                {message(errors.lines) ?? serverError('model.lines')}
              </p>
            )}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-sans text-data text-secondary">
            {t('portfolio.form.limits')}
          </legend>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {PORTFOLIO_LIMITS.map((key) => (
              <Field
                key={key}
                label={t(`portfolio.limits.${key}`)}
                error={message(errors.limits?.[key]) ?? serverError(`limits.${key}`)}
              >
                <NumberInput
                  value={form.limits[key]}
                  onChange={(value) => setLimit(key, value)}
                  decimals={key === 'beta' ? 2 : 1}
                  suffix={t(`portfolio.limitUnits.${key}`)}
                  placeholder={t('portfolio.form.noLimit')}
                />
              </Field>
            ))}
          </div>
        </fieldset>

        {organization && (
          <div className="flex flex-col gap-1">
            <Checkbox
              checked={form.shared}
              onChange={(shared) => set({ shared })}
              label={t('portfolio.form.share', { organization: organization.name })}
              aria-describedby={shareHintId}
            />
            <p id={shareHintId} className="font-sans text-title text-secondary">
              {t('portfolio.form.shareHint')}
            </p>
            {serverError('sharedWithOrganization') && (
              <p className="font-sans text-title text-down">
                {serverError('sharedWithOrganization')}
              </p>
            )}
          </div>
        )}

        {generalError && (
          <p role="alert" className="font-sans text-data text-down">
            {generalError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={mutation.isPending}>
          {editing ? t('common.save') : t('portfolio.form.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
