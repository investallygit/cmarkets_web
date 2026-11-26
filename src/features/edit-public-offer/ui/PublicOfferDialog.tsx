import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSavePublicOffer } from '@/entities/auction'
import { isApiError } from '@/shared/api'
import type { PublicOfferDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
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
import { offerForm, offerInput, type OfferForm } from '../model/offerForm'

interface PublicOfferDialogProps {
  open: boolean
  /** The issue changed; null for a new one. */
  offer: PublicOfferDto | null
  onClose: () => void
}

/**
 * CORR: a public bond issue of APE (screen 33, sixth version; ROADMAP decision 58), which the spec
 * gives no file for: the issuer and its kind, the state, the amount sought, the coupon, the
 * maturity, the subscription period, the arranger, the amount raised once closed, withdrawn.
 */
export function PublicOfferDialog({ open, offer, onClose }: PublicOfferDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        offer
          ? t('auctionMarket.corr.edit', { issuer: offer.issuer })
          : t('auctionMarket.corr.formTitle')
      }
      width={560}
    >
      {open && <OfferFormBody key={offer?.id ?? 'new'} offer={offer} onClose={onClose} />}
    </Dialog>
  )
}

function OfferFormBody({ offer, onClose }: { offer: PublicOfferDto | null; onClose: () => void }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSavePublicOffer()
  const [form, setForm] = useState<OfferForm>(() => offerForm(offer))
  const [submitted, setSubmitted] = useState(false)
  const { missing, input } = offerInput(form)
  const serverErrors = isApiError(save.error, 400) ? save.error.problem.errors : undefined
  const otherError = save.error && !isApiError(save.error, 400) ? save.error.message : undefined
  const error = (key: keyof OfferForm) =>
    (submitted && missing.includes(key) ? t('auctionMarket.corr.required') : undefined) ??
    serverErrors?.[key]?.[0]
  const set = (change: Partial<OfferForm>) => setForm((current) => ({ ...current, ...change }))
  const label = (key: keyof OfferForm) => t(`auctionMarket.corr.fields.${key}`)

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!input) return
        save.mutate(
          { id: offer?.id ?? null, offer: input },
          {
            onSuccess: (saved) => {
              toast.success(t('auctionMarket.corr.saved', { issuer: saved.issuer }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={label('issuer')} error={error('issuer')} className="sm:col-span-2">
            <TextInput value={form.issuer} onChange={(issuer) => set({ issuer })} maxLength={120} />
          </Field>
          <Field label={label('issuerKind')} group>
            <SegmentedControl
              value={form.issuerKind}
              options={(['sovereign', 'company'] as const).map((kind) => ({
                value: kind,
                label: t(`auctionMarket.offers.kinds.${kind}`),
              }))}
              onChange={(issuerKind) => set({ issuerKind })}
            />
          </Field>
          <Field label={label('country')} error={serverErrors?.country?.[0]}>
            <Select
              value={form.country}
              options={CEMAC_COUNTRIES.map((code) => ({
                value: code,
                label: format.country(code),
              }))}
              onChange={(country: string) => set({ country })}
            />
          </Field>
          <Field label={label('amountSought')} error={error('amountSought')}>
            <NumberInput
              value={form.amountSought}
              onChange={(amountSought) => set({ amountSought })}
              decimals={0}
            />
          </Field>
          <Field label={label('couponPct')} error={error('couponPct')}>
            <NumberInput
              value={form.couponPct}
              onChange={(couponPct) => set({ couponPct })}
              decimals={2}
              suffix="%"
            />
          </Field>
          <Field label={label('subscriptionStart')} error={error('subscriptionStart')}>
            <DateInput
              value={form.subscriptionStart}
              onChange={(subscriptionStart) => set({ subscriptionStart })}
            />
          </Field>
          <Field label={label('subscriptionEnd')} error={error('subscriptionEnd')}>
            <DateInput
              value={form.subscriptionEnd}
              onChange={(subscriptionEnd) => set({ subscriptionEnd })}
            />
          </Field>
          <Field label={label('maturityDate')} error={error('maturityDate')}>
            <DateInput
              value={form.maturityDate}
              onChange={(maturityDate) => set({ maturityDate })}
            />
          </Field>
          <Field label={label('arranger')} error={error('arranger')}>
            <TextInput
              value={form.arranger}
              onChange={(arranger) => set({ arranger })}
              maxLength={120}
            />
          </Field>
          <Field label={label('amountRaised')} error={serverErrors?.amountRaised?.[0]}>
            <NumberInput
              value={form.amountRaised}
              onChange={(amountRaised) => set({ amountRaised })}
              decimals={0}
            />
          </Field>
          <div className="flex items-end">
            <Checkbox
              checked={form.withdrawn}
              onChange={(withdrawn) => set({ withdrawn })}
              label={label('withdrawn')}
            />
          </div>
        </div>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {t('auctionMarket.corr.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('auctionMarket.corr.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
