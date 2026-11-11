import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  monthsUpTo,
  shiftMonth,
  usePaymentTermsHistory,
  useSavePaymentTerms,
} from '@/entities/news-statement'
import { isApiError } from '@/shared/api'
import type { SourcePaymentTermsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Select } from '@/shared/ui/form/Select'
import { toast } from '@/shared/ui/toast'
import { termsBody, termsErrors, termsForm } from '../lib/terms'

/**
 * A partner newspaper's payment settings (spec, screen 18, "Payment settings"): the rate per
 * unique click and the monthly cap (or none) from a month on, this one by default. Each change is
 * a new version; the statements not approved yet of its months are computed again.
 */
export function PaymentTermsForm({ terms }: { terms: SourcePaymentTermsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSavePaymentTerms()
  const history = usePaymentTermsHistory(terms.sourceId)
  const [form, setForm] = useState(() => termsForm(terms))
  const [submitted, setSubmitted] = useState(false)
  const local = termsErrors(form)
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  // From six months back (the statements not approved yet) to a year ahead, the latest last.
  const months = monthsUpTo(shiftMonth(terms.month, 12), 19).reverse()

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (local.ratePerClick || local.monthlyCap) return
        save.mutate(
          { sourceId: terms.sourceId, terms: termsBody(form) },
          {
            onSuccess: (saved) => {
              setSubmitted(false)
              toast.success(
                t('mediaPayments.terms.saved', {
                  month: format.month(saved.version.effectiveFrom),
                  count: saved.recomputed,
                }),
              )
            },
          },
        )
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-x-3 gap-y-2">
        <Field
          inline
          label={t('mediaPayments.terms.rate')}
          error={
            (submitted && local.ratePerClick && t('mediaPayments.terms.errors.rate')) ||
            server.ratePerClick?.[0]
          }
          className="col-span-2"
        >
          <NumberInput
            value={form.ratePerClick}
            onChange={(ratePerClick) => setForm({ ...form, ratePerClick })}
            decimals={0}
            highlight
          />
        </Field>
        <Field
          inline
          label={t('mediaPayments.terms.cap')}
          error={
            (submitted && local.monthlyCap && t('mediaPayments.terms.errors.cap')) ||
            server.monthlyCap?.[0]
          }
          className="col-span-2"
        >
          <NumberInput
            value={form.noCap ? null : form.monthlyCap}
            onChange={(monthlyCap) => setForm({ ...form, monthlyCap })}
            decimals={0}
            disabled={form.noCap}
            highlight={!form.noCap}
          />
        </Field>
        <Field inline label={t('mediaPayments.terms.effectiveFrom')} className="col-span-2">
          <Select
            value={form.effectiveFrom}
            options={months.map((month) => ({ value: month, label: format.month(month) }))}
            onChange={(effectiveFrom) => setForm({ ...form, effectiveFrom })}
            highlight
          />
        </Field>
        <Checkbox
          checked={form.noCap}
          onChange={(noCap) => setForm({ ...form, noCap })}
          label={t('mediaPayments.terms.noCap')}
        />
        <Button type="submit" variant="secondary" busy={save.isPending}>
          {t('mediaPayments.terms.save')}
        </Button>
      </div>
      <p className="font-sans text-caption text-secondary">{t('mediaPayments.terms.note')}</p>
      {save.error && !isApiError(save.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {save.error.message}
        </p>
      )}
      {history.data && history.data.length > 0 && (
        <div className="font-sans text-caption text-secondary">
          <p className="font-semibold uppercase">{t('mediaPayments.terms.history')}</p>
          <ul>
            {history.data.map((version) => (
              <li key={version.id}>
                {t('mediaPayments.terms.version', {
                  month: format.month(version.effectiveFrom),
                  rate: format.number(version.ratePerClick, 0),
                  cap:
                    version.monthlyCap === null
                      ? t('mediaPayments.terms.uncapped')
                      : t('mediaPayments.terms.capOf', {
                          cap: format.number(version.monthlyCap, 0),
                        }),
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
