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
/** The completion ratios' window (sixth version, ROADMAP decision 52). */
const MAX_COMPLETION_MONTHS = 24
/** The SVTs' window (RfqSettings.SetApprovalWindow): 15 to 240 minutes, a cut-off from 08:00 to 20:00. */
const MIN_WINDOW = 15
const MAX_WINDOW = 240

/** A face amount the API takes (RfqSettings): XAF 1 million to 10 billion, in whole francs. */
const isAmount = (value: number | null) =>
  value !== null && value >= MIN_AMOUNT && value <= MAX_AMOUNT && Number.isInteger(value)

/** "16:00:00" as the API writes a time, "16:00" as the time input does. */
const hhmm = (time: string) => time.slice(0, 5)

/** A row of the list as edited: its id once saved, the bank's name, the counts once saved. */
interface SvtRow extends LicensedSvtInput {
  key: string
  accounts: number
  links: number
}

/**
 * ADMCFG, the RFQ (spec section 10, /admin/rfq/svt; ROADMAP step 43): its switch, off until the
 * BEAC confirms the module's status (decision 24), the minimum trading amount, how long a link's
 * confirmation holds, the SVTs' approval window with its cut-off and the next business day's
 * deadline (step 45), the CMarket curve fed by the concluded agreements from a face amount (step 49,
 * decision 27), and the licensed SVTs with their back offices' addresses; a bank added by its name,
 * none taken off (unticked instead). Saved together, each value changed in the audit log.
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
  const [windowMinutes, setWindowMinutes] = useState<number | null>(settings.approvalWindowMinutes)
  const [cutOff, setCutOff] = useState(hhmm(settings.cutOffTime))
  const [nextDay, setNextDay] = useState(hhmm(settings.nextDayDeadline))
  const [feedsCurve, setFeedsCurve] = useState(settings.curveFeedEnabled)
  const [curveMinimum, setCurveMinimum] = useState<number | null>(settings.curveFeedMinimum)
  const [completionMonths, setCompletionMonths] = useState<number | null>(
    settings.completionWindowMonths,
  )
  const [rows, setRows] = useState<SvtRow[]>(initial)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const local = {
    minimumTradingAmount: isAmount(amount) ? null : t('rfqSettings.errors.amount'),
    linkValidityMonths:
      months === null || months < 1 || months > MAX_MONTHS || !Number.isInteger(months)
        ? t('rfqSettings.errors.months')
        : null,
    approvalWindowMinutes:
      windowMinutes === null ||
      windowMinutes < MIN_WINDOW ||
      windowMinutes > MAX_WINDOW ||
      !Number.isInteger(windowMinutes)
        ? t('rfqSettings.errors.window')
        : null,
    cutOffTime:
      !/^\d\d:\d\d$/.test(cutOff) || cutOff < '08:00' || cutOff > '20:00'
        ? t('rfqSettings.errors.cutOff')
        : null,
    nextDayDeadline:
      !/^\d\d:\d\d$/.test(nextDay) || nextDay < '07:00' || nextDay >= cutOff
        ? t('rfqSettings.errors.nextDay')
        : null,
    curveFeedMinimum: isAmount(curveMinimum) ? null : t('rfqSettings.errors.curveFeedMinimum'),
    completionWindowMonths:
      completionMonths === null ||
      completionMonths < 1 ||
      completionMonths > MAX_COMPLETION_MONTHS ||
      !Number.isInteger(completionMonths)
        ? t('rfqSettings.errors.completionWindow')
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
    windowMinutes !== settings.approvalWindowMinutes ||
    cutOff !== hhmm(settings.cutOffTime) ||
    nextDay !== hhmm(settings.nextDayDeadline) ||
    feedsCurve !== settings.curveFeedEnabled ||
    curveMinimum !== settings.curveFeedMinimum ||
    completionMonths !== settings.completionWindowMonths ||
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
    setWindowMinutes(settings.approvalWindowMinutes)
    setCutOff(hhmm(settings.cutOffTime))
    setNextDay(hhmm(settings.nextDayDeadline))
    setFeedsCurve(settings.curveFeedEnabled)
    setCurveMinimum(settings.curveFeedMinimum)
    setCompletionMonths(settings.completionWindowMonths)
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
            approvalWindowMinutes: windowMinutes ?? 0,
            cutOffTime: `${cutOff}:00`,
            nextDayDeadline: `${nextDay}:00`,
            curveFeedEnabled: feedsCurve,
            curveFeedMinimum: curveMinimum ?? 0,
            completionWindowMonths: completionMonths ?? 0,
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
        <Section title={t('rfqSettings.window')}>
          <p className="font-sans text-data text-secondary">{t('rfqSettings.windowHint')}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t('rfqSettings.windowMinutes')} error={error('approvalWindowMinutes')}>
              <NumberInput
                value={windowMinutes}
                onChange={setWindowMinutes}
                decimals={0}
                highlight
              />
            </Field>
            <Field label={t('rfqSettings.cutOffTime')} error={error('cutOffTime')}>
              <TextInput type="time" value={cutOff} onChange={setCutOff} mono />
            </Field>
            <Field label={t('rfqSettings.nextDayDeadline')} error={error('nextDayDeadline')}>
              <TextInput type="time" value={nextDay} onChange={setNextDay} mono />
            </Field>
          </div>
        </Section>
        <Section title={t('rfqSettings.curve')}>
          <Switch
            checked={feedsCurve}
            onChange={setFeedsCurve}
            label={t('rfqSettings.curveFeed')}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('rfqSettings.curveFeedMinimum')} error={error('curveFeedMinimum')}>
              <NumberInput
                value={curveMinimum}
                onChange={setCurveMinimum}
                decimals={0}
                suffix="XAF"
                highlight
              />
            </Field>
          </div>
          <p className="font-sans text-data text-secondary">{t('rfqSettings.curveFeedHint')}</p>
        </Section>
        <Section title={t('rfqSettings.completion')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label={t('rfqSettings.completionWindow')}
              error={error('completionWindowMonths')}
            >
              <NumberInput
                value={completionMonths}
                onChange={setCompletionMonths}
                decimals={0}
                highlight
              />
            </Field>
          </div>
          <p className="font-sans text-data text-secondary">{t('rfqSettings.completionHint')}</p>
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
