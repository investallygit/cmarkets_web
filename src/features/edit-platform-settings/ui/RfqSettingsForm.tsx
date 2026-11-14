import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isEmailAddress } from '@/entities/session'
import { useSaveRfqSettings } from '@/entities/platform-settings'
import { isApiError } from '@/shared/api'
import type { LicensedSvtInput, RfqAdminSettingsDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { Switch } from '@/shared/ui/form/Switch'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { Section } from './Section'

/** CMarket.Api's bounds (RfqSettings, LicensedSvt). */
const MIN_AMOUNT = 1_000_000
const MAX_AMOUNT = 10_000_000_000
const MAX_MONTHS = 36

/** A row of the list as edited: its id once saved, the bank's name, the counts once saved. */
interface SvtRow extends LicensedSvtInput {
  key: string
  accounts: number
  links: number
}

/**
 * ADMCFG, the RFQ (spec section 10, /admin/rfq/svt; ROADMAP step 43): its switch, off until the
 * BEAC confirms the module's status (decision 24), the minimum trading amount, how long a link's
 * confirmation holds, and the licensed SVTs with their back offices' addresses; a bank added by its
 * name, none taken off (unticked instead). Saved together, each value changed in the audit log.
 */
export function RfqSettingsForm({ settings }: { settings: RfqAdminSettingsDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveRfqSettings()
  const initial = (): SvtRow[] =>
    settings.svts.map((svt) => ({
      key: svt.id,
      id: svt.id,
      name: svt.name,
      backOfficeEmail: svt.backOfficeEmail,
      active: svt.active,
      accounts: svt.accounts,
      links: svt.links,
    }))
  const [enabled, setEnabled] = useState(settings.enabled)
  const [amount, setAmount] = useState<number | null>(settings.minimumTradingAmount)
  const [months, setMonths] = useState<number | null>(settings.linkValidityMonths)
  const [rows, setRows] = useState<SvtRow[]>(initial)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const local = {
    minimumTradingAmount:
      amount === null || amount < MIN_AMOUNT || amount > MAX_AMOUNT || !Number.isInteger(amount)
        ? t('rfqSettings.errors.amount')
        : null,
    linkValidityMonths:
      months === null || months < 1 || months > MAX_MONTHS || !Number.isInteger(months)
        ? t('rfqSettings.errors.months')
        : null,
    svts: rows.some((row) => !isEmailAddress(row.backOfficeEmail))
      ? t('rfqSettings.errors.email')
      : null,
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: keyof typeof local) => (submitted && local[field]) || server[field]?.[0]
  const changed =
    enabled !== settings.enabled ||
    amount !== settings.minimumTradingAmount ||
    months !== settings.linkValidityMonths ||
    JSON.stringify(rows.map(({ id, backOfficeEmail, active }) => [id, backOfficeEmail, active])) !==
      JSON.stringify(
        settings.svts.map(({ id, backOfficeEmail, active }) => [id, backOfficeEmail, active]),
      )

  const setRow = (key: string, change: Partial<SvtRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))
  const canAdd = newName.trim().length > 0 && isEmailAddress(newEmail)
  const add = () => {
    if (!canAdd) return
    setRows((current) => [
      ...current,
      {
        key: `new-${current.length}-${newName.trim()}`,
        id: null,
        name: newName.trim(),
        backOfficeEmail: newEmail.trim(),
        active: true,
        accounts: 0,
        links: 0,
      },
    ])
    setNewName('')
    setNewEmail('')
  }
  const reset = () => {
    save.reset()
    setSubmitted(false)
    setEnabled(settings.enabled)
    setAmount(settings.minimumTradingAmount)
    setMonths(settings.linkValidityMonths)
    setRows(initial())
  }

  return (
    <form
      noValidate
      className="flex h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean) || !changed) return
        save.mutate(
          {
            enabled,
            minimumTradingAmount: amount ?? 0,
            linkValidityMonths: months ?? 0,
            svts: rows.map(({ id, name, backOfficeEmail, active }) => ({
              id,
              name: id ? null : name,
              backOfficeEmail: backOfficeEmail.trim(),
              active,
            })),
          },
          {
            onSuccess: () => {
              setSubmitted(false)
              toast.success(t('rfqSettings.saved'))
            },
          },
        )
      }}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <Section title={t('rfqSettings.title')}>
          <Switch checked={enabled} onChange={setEnabled} label={t('rfqSettings.enabled')} />
          <p className="font-sans text-data text-secondary">{t('rfqSettings.enabledHint')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={t('rfqSettings.minimumTradingAmount')}
              error={error('minimumTradingAmount')}
            >
              <NumberInput
                value={amount}
                onChange={setAmount}
                decimals={0}
                suffix="XAF"
                highlight
              />
            </Field>
            <Field label={t('rfqSettings.linkValidity')} error={error('linkValidityMonths')}>
              <NumberInput value={months} onChange={setMonths} decimals={0} highlight />
            </Field>
          </div>
          <p className="font-sans text-data text-secondary">
            {t('rfqSettings.minimumTradingAmountHint')}
          </p>
        </Section>
        <Section title={t('rfqSettings.svts')}>
          <p className="font-sans text-data text-secondary">{t('rfqSettings.svtsHint')}</p>
          <table className="w-full font-sans text-data">
            <thead className="text-left text-label text-secondary">
              <tr>
                <th className="py-1 pr-2 font-normal">{t('rfqSettings.bank')}</th>
                <th className="py-1 pr-2 font-normal">{t('rfqSettings.backOffice')}</th>
                <th className="py-1 pr-2 font-normal">{t('rfqSettings.active')}</th>
                <th className="py-1 pr-2 text-right font-normal">{t('rfqSettings.accounts')}</th>
                <th className="py-1 text-right font-normal">{t('rfqSettings.links')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t">
                  <td className="py-1 pr-2 text-primary">{row.name}</td>
                  <td className="py-1 pr-2">
                    <TextInput
                      type="email"
                      value={row.backOfficeEmail}
                      onChange={(value) => setRow(row.key, { backOfficeEmail: value })}
                      aria-label={`${t('rfqSettings.backOffice')} · ${row.name ?? ''}`}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <Checkbox
                      checked={row.active}
                      onChange={(active) => setRow(row.key, { active })}
                      aria-label={`${t('rfqSettings.active')} · ${row.name ?? ''}`}
                    />
                  </td>
                  <td className="py-1 pr-2 text-right font-mono tabular-nums">{row.accounts}</td>
                  <td className="py-1 text-right font-mono tabular-nums">{row.links}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {error('svts') && (
            <p role="alert" className="font-sans text-data text-down">
              {error('svts')}
            </p>
          )}
          <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Field label={t('rfqSettings.newBank')}>
              <TextInput value={newName} onChange={setNewName} />
            </Field>
            <Field label={t('rfqSettings.backOffice')}>
              <TextInput type="email" value={newEmail} onChange={setNewEmail} />
            </Field>
            <Button type="button" variant="info" icon={Plus} disabled={!canAdd} onClick={add}>
              {t('rfqSettings.addBank')}
            </Button>
          </div>
        </Section>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-2">
        <span className="mr-auto font-sans text-data text-secondary">
          {settings.updatedAt &&
            t('platformSettings.updated', {
              date: `${format.date(settings.updatedAt)} ${format.time(settings.updatedAt)}`,
              name: settings.updatedBy ?? '',
            })}
        </span>
        {save.error && !isApiError(save.error, 400) && (
          <span role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </span>
        )}
        <Button type="button" disabled={!changed} onClick={reset}>
          {t('platformSettings.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={!changed} busy={save.isPending}>
          {t('rfqSettings.save')}
        </Button>
      </footer>
    </form>
  )
}
