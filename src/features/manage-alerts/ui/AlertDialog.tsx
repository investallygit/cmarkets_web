import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAlerts,
  useCreateAlert,
  useUpdateAlert,
  type AlertDialogRequest,
} from '@/entities/alert'
import { usePortfolios } from '@/entities/portfolio'
import { priceDecimals, useQuote } from '@/entities/quote'
import { SecurityPicker, useSecurityProfile } from '@/entities/security'
import { useCurrentUser } from '@/entities/session'
import type { AlertDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import {
  ALERT_CHANNELS,
  ALERT_TYPES,
  initialAlertForm,
  needsSecurity,
  toAlertInput,
  validateAlertForm,
  type AlertFormError,
  type AlertFormState,
} from '../model/alertForm'

interface AlertDialogProps {
  request: AlertDialogRequest | null
  onClose: () => void
}

/** Creates or edits an alert of one of the six types of spec section 5. */
export function AlertDialog({ request, onClose }: AlertDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={request !== null}
      onClose={onClose}
      title={request?.alert ? t('alerts.editTitle') : t('alerts.newTitle')}
      width={460}
    >
      {request && <AlertForm request={request} onClose={onClose} />}
    </Dialog>
  )
}

/** Mounted with each opening, so a new alert starts from the defaults. */
function AlertForm({ request, onClose }: { request: AlertDialogRequest; onClose: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const user = useCurrentUser()
  const editing: AlertDto | undefined = request.alert
  // The code of a security given by id (right-click menu) comes with its profile.
  const givenId = request.alert ? undefined : request.securityId
  const given = useSecurityProfile(givenId).data
  const [form, setForm] = useState(() => initialAlertForm(editing))
  const [submitted, setSubmitted] = useState(false)
  const alerts = useAlerts()
  const portfolios = usePortfolios({ enabled: form.type === 'portfolio' })
  const create = useCreateAlert()
  const update = useUpdateAlert()
  const mutation = editing ? update : create

  // Until the user picks another one, the security given by the menu stands, by id.
  const security = form.security ?? (givenId ? { id: givenId, code: given?.code ?? givenId } : null)
  const current: AlertFormState = { ...form, security }
  const errors = submitted ? validateAlertForm(current) : {}
  const set = (patch: Partial<AlertFormState>) => setForm((previous) => ({ ...previous, ...patch }))

  const quota = user.quotas.alerts
  const used = alerts.data?.length ?? 0
  const quotaReached = !editing && quota !== null && used >= quota

  const submit = () => {
    setSubmitted(true)
    if (quotaReached || Object.keys(validateAlertForm(current)).length > 0) return
    const input = toAlertInput(current)
    const onSuccess = () => {
      toast.success(editing ? t('alerts.saved') : t('alerts.created'))
      onClose()
    }
    if (editing) update.mutate({ id: editing.id, ...input }, { onSuccess })
    else create.mutate(input, { onSuccess })
  }

  const errorText = (error: AlertFormError | undefined) => error && t(`alerts.errors.${error}`)

  const countryOptions = (allLabel: string) => [
    { value: '', label: allLabel },
    ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
  ]

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <p className="font-sans text-data text-secondary">
          {quota === null
            ? t('alerts.quotaUnlimited', { used })
            : t('alerts.quotaUsed', {
                used,
                quota,
                type: t(`accountTypes.${user.accountType}`),
              })}
        </p>
        {quotaReached && (
          <p
            role="alert"
            className="border border-warning/50 bg-warning/10 p-2 font-sans text-data text-warning"
          >
            {t('alerts.quotaReached', { quota })}
          </p>
        )}

        <Field label={t('alerts.type')}>
          <Select
            value={form.type}
            options={ALERT_TYPES.map((type) => ({ value: type, label: t(`alerts.types.${type}`) }))}
            onChange={(type) => set({ type })}
          />
        </Field>

        {form.type === 'publication' && (
          <Field label={t('alerts.publicationAbout')} group>
            <SegmentedControl
              value={form.about}
              options={(['analysts', 'security', 'country'] as const).map((about) => ({
                value: about,
                label: t(`alerts.about.${about}`),
              }))}
              onChange={(about) => set({ about })}
            />
          </Field>
        )}

        {needsSecurity(current) && (
          <Field label={t('alerts.security')} error={errorText(errors.security)}>
            <SecurityPicker
              value={security?.code}
              onSelect={(picked) => set({ security: { id: picked.id, code: picked.code } })}
              highlight
            />
          </Field>
        )}

        {form.type === 'price' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('alerts.metric')} group>
                <SegmentedControl
                  value={form.metric}
                  options={[
                    { value: 'price', label: t('alerts.metrics.price') },
                    { value: 'changePct', label: t('alerts.metrics.changePct') },
                  ]}
                  onChange={(metric) => set({ metric, threshold: null })}
                />
              </Field>
              <Field label={t('alerts.direction')} group>
                <SegmentedControl
                  value={form.direction}
                  options={[
                    { value: 'above', label: t('alerts.directionOptions.above'), tone: 'up' },
                    { value: 'below', label: t('alerts.directionOptions.below'), tone: 'down' },
                  ]}
                  onChange={(direction) => set({ direction })}
                />
              </Field>
            </div>
            <Field
              label={t('alerts.threshold')}
              error={errorText(errors.threshold)}
              hint={security && <LastQuoteHint securityId={security.id} />}
            >
              <NumberInput
                value={form.threshold}
                onChange={(threshold) => set({ threshold })}
                decimals={2}
                suffix={form.metric === 'changePct' ? '%' : undefined}
                highlight
              />
            </Field>
          </>
        )}

        {form.type === 'volume' && (
          <Field
            label={t('alerts.multiple')}
            hint={t('alerts.multipleHint')}
            error={errorText(errors.multiple)}
          >
            <NumberInput
              value={form.multiple}
              onChange={(multiple) => set({ multiple })}
              decimals={1}
              suffix="×"
              highlight
            />
          </Field>
        )}

        {form.type === 'auction' && (
          <Field label={t('alerts.country')}>
            <Select
              value={form.country}
              options={countryOptions(t('alerts.allCountries'))}
              onChange={(country) => set({ country })}
            />
          </Field>
        )}

        {form.type === 'publication' && form.about === 'country' && (
          <Field label={t('alerts.country')} error={errorText(errors.country)}>
            <Select
              value={form.country}
              options={countryOptions(t('alerts.chooseCountry'))}
              onChange={(country) => set({ country })}
            />
          </Field>
        )}

        {form.type === 'portfolio' && (
          <Field label={t('alerts.portfolio')} hint={t('alerts.portfolioHint')}>
            <Select
              value={form.portfolioId}
              options={[
                { value: '', label: t('alerts.allPortfolios') },
                ...(portfolios.data ?? []).map((portfolio) => ({
                  value: portfolio.id,
                  label: portfolio.name,
                })),
              ]}
              onChange={(portfolioId) => set({ portfolioId })}
            />
          </Field>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 font-sans text-data text-secondary">
            {t('alerts.channels')}
          </legend>
          <div className="flex gap-5">
            {ALERT_CHANNELS.map((channel) => (
              <Checkbox
                key={channel}
                checked={form.channels.includes(channel)}
                onChange={(checked) =>
                  set({
                    channels: checked
                      ? [...form.channels, channel]
                      : form.channels.filter((value) => value !== channel),
                  })
                }
                label={t(`alerts.channelNames.${channel}`)}
              />
            ))}
          </div>
          {errors.channels && (
            <p className="font-sans text-title text-down">{t('alerts.errors.channels')}</p>
          )}
        </fieldset>

        <Checkbox
          checked={form.enabled}
          onChange={(enabled) => set({ enabled })}
          label={t('alerts.enabled')}
        />

        {mutation.error && (
          <p role="alert" className="font-sans text-data text-down">
            {mutation.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={mutation.isPending} disabled={quotaReached}>
          {editing ? t('common.save') : t('alerts.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** "Last 52,500 · +1.15% today", to help set the threshold. */
function LastQuoteHint({ securityId }: { securityId: string }) {
  const { t } = useTranslation()
  const format = useFormat()
  const quote = useQuote(securityId).data
  const profile = useSecurityProfile(securityId).data
  if (!quote || !profile) return null
  return t('alerts.lastQuote', {
    last: format.number(quote.last, priceDecimals(profile.type, profile.currency)),
    change: format.percent(quote.changePct),
  })
}
