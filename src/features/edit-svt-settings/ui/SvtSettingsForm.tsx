import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveSvtSettings } from '@/entities/rfq'
import { useMe } from '@/entities/session'
import { isApiError } from '@/shared/api'
import type { SvtSettingsDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { NumberInput } from '@/shared/ui/form/NumberInput'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { Switch } from '@/shared/ui/form/Switch'
import { toast } from '@/shared/ui/toast'

/** CMarket.Api's bounds (SvtSettings): from XAF 1 million to 10 trillion, in whole francs. */
const MIN_THRESHOLD = 1_000_000
const MAX_AMOUNT = 10_000_000_000_000

const wholeAmount = (value: number | null, min: number) =>
  value !== null && value >= min && value <= MAX_AMOUNT && Number.isInteger(value)

/**
 * Screen 27's "Approval settings", the bank's part (PUT /svt/settings): the four-eyes threshold, the
 * authorised approvers among its SVT accounts (every one, or those ticked, the saver among them),
 * the default client limit a link's confirmation offers, the approval requests by e-mail and SMS
 * (on screen always). The window and the cut-off are the Admin's.
 */
export function SvtSettingsForm({
  settings,
  onDone,
}: {
  settings: SvtSettingsDto
  onDone: () => void
}) {
  const { t } = useTranslation()
  const me = useMe()
  const save = useSaveSvtSettings()
  const [threshold, setThreshold] = useState<number | null>(settings.fourEyesThreshold)
  const [mode, setMode] = useState<'all' | 'listed'>(settings.allApprove ? 'all' : 'listed')
  const [approvers, setApprovers] = useState<ReadonlySet<string>>(
    () =>
      new Set(
        settings.approvers.filter((approver) => approver.authorised).map((approver) => approver.id),
      ),
  )
  const [noDefault, setNoDefault] = useState(settings.defaultClientLimit === null)
  const [limit, setLimit] = useState<number | null>(settings.defaultClientLimit)
  const [email, setEmail] = useState(settings.notifyByEmail)
  const [sms, setSms] = useState(settings.notifyBySms)
  const [submitted, setSubmitted] = useState(false)

  const myId = me.data?.id
  const local = {
    fourEyesThreshold: wholeAmount(threshold, MIN_THRESHOLD)
      ? null
      : t('svt.settings.errors.threshold'),
    defaultClientLimit: noDefault || wholeAmount(limit, 1) ? null : t('svt.settings.errors.limit'),
    approverIds:
      mode === 'listed' && (approvers.size === 0 || (myId !== undefined && !approvers.has(myId)))
        ? t('svt.settings.errors.approvers')
        : null,
  }
  const server = isApiError(save.error, 400) ? (save.error.problem.errors ?? {}) : {}
  const error = (field: keyof typeof local) => (submitted && local[field]) || server[field]?.[0]
  const toggle = (id: string, on: boolean) =>
    setApprovers((current) => {
      const next = new Set(current)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <form
      noValidate
      aria-label={t('svt.settings.edit')}
      className="flex flex-col gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (Object.values(local).some(Boolean)) return
        save.mutate(
          {
            fourEyesThreshold: threshold ?? 0,
            approverIds: mode === 'all' ? [] : [...approvers],
            defaultClientLimit: noDefault ? null : limit,
            notifyByEmail: email,
            notifyBySms: sms,
          },
          {
            onSuccess: () => {
              toast.success(t('svt.settings.saved'))
              onDone()
            },
          },
        )
      }}
    >
      <Field
        label={t('svt.settings.threshold')}
        hint={t('svt.settings.thresholdHint')}
        error={error('fourEyesThreshold')}
      >
        <NumberInput
          value={threshold}
          onChange={setThreshold}
          decimals={0}
          suffix="XAF"
          highlight
        />
      </Field>
      <Field label={t('svt.settings.approvers')} group error={error('approverIds')}>
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'all', label: t('svt.settings.everyAccount') },
            { value: 'listed', label: t('svt.settings.listedOnly') },
          ]}
        />
        {mode === 'listed' && (
          <ul className="mt-1.5 flex flex-col gap-1">
            {settings.approvers.map((approver) => (
              <li key={approver.id}>
                <Checkbox
                  checked={approvers.has(approver.id)}
                  onChange={(on) => toggle(approver.id, on)}
                  label={approver.name}
                />
              </li>
            ))}
          </ul>
        )}
      </Field>
      <Field
        label={t('svt.settings.defaultLimitField')}
        hint={t('svt.settings.defaultLimitHint')}
        error={error('defaultClientLimit')}
      >
        <div className="flex flex-col gap-1.5">
          <Checkbox
            checked={noDefault}
            onChange={setNoDefault}
            label={t('svt.settings.noDefault')}
          />
          {!noDefault && (
            <NumberInput value={limit} onChange={setLimit} decimals={0} suffix="XAF" />
          )}
        </div>
      </Field>
      <div className="flex flex-col gap-1.5">
        <p className="font-sans text-data text-secondary">{t('svt.settings.onScreen')}</p>
        <Switch checked={email} onChange={setEmail} label={t('svt.settings.notifyByEmail')} />
        <Switch checked={sms} onChange={setSms} label={t('svt.settings.notifyBySms')} />
      </div>
      {save.error && !isApiError(save.error, 400) && (
        <p role="alert" className="font-sans text-data text-down">
          {save.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onDone}>
          {t('svt.settings.cancel')}
        </Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('svt.settings.save')}
        </Button>
      </div>
    </form>
  )
}
