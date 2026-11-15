import { Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveDailyReportSettings } from '@/entities/rfq-report'
import { isApiError } from '@/shared/api'
import type { DailyReportSettingsDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Switch } from '@/shared/ui/form/Switch'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import {
  formOf,
  hasErrors,
  inputOf,
  MAX_COPIES,
  settingsErrors,
  type SettingsError,
  type SettingsForm,
} from '../lib/settingsForm'

interface DailyReportSettingsDialogProps {
  open: boolean
  onClose: () => void
  settings: DailyReportSettingsDto
}

/**
 * Screen 24's settings (the Admin's): the send time of each business day, the BEAC's address, the
 * copies, the nil report; saved at the version read, the change audited by the API.
 */
export function DailyReportSettingsDialog({
  open,
  onClose,
  settings,
}: DailyReportSettingsDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('rfqReports.settings.dialog')} width={460}>
      {open && <SettingsFormBody settings={settings} onClose={onClose} />}
    </Dialog>
  )
}

function SettingsFormBody({
  settings,
  onClose,
}: {
  settings: DailyReportSettingsDto
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<SettingsForm>(() => formOf(settings))
  // The copies have no id of their own: each line gets one while the dialog is open.
  const nextId = useRef(settings.copies.length)
  const [copyIds, setCopyIds] = useState(() => settings.copies.map((_, index) => index))
  const [submitted, setSubmitted] = useState(false)
  const save = useSaveDailyReportSettings()
  const errors = settingsErrors(form)
  const shown = (error: SettingsError | undefined) =>
    submitted && error ? t(`rfqReports.settings.errors.${error}`) : undefined
  const set = (changes: Partial<SettingsForm>) => setForm((current) => ({ ...current, ...changes }))
  const setCopy = (index: number, value: string) =>
    set({ copies: form.copies.map((copy, at) => (at === index ? value : copy)) })

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (hasErrors(errors)) return
        save.mutate(inputOf(form, settings.version), {
          onSuccess: () => {
            toast.success(t('rfqReports.settings.saved'))
            onClose()
          },
          onError: (error) => {
            if (isApiError(error, 409)) {
              toast.error(t('rfqReports.settings.changed'))
              onClose()
            }
          },
        })
      }}
    >
      <DialogBody className="flex flex-col gap-3">
        <p className="font-sans text-data text-secondary">{t('rfqReports.settings.agree')}</p>
        <Field label={t('rfqReports.settings.time')} error={shown(errors.sendTime)}>
          <TextInput
            value={form.sendTime}
            onChange={(sendTime) => set({ sendTime })}
            mono
            inputMode="numeric"
            placeholder="18:00"
          />
        </Field>
        <Field label={t('rfqReports.settings.beacAddress')} error={shown(errors.beacAddress)}>
          <TextInput
            value={form.beacAddress}
            onChange={(beacAddress) => set({ beacAddress })}
            type="email"
            autoComplete="off"
          />
        </Field>
        <Field
          label={t('rfqReports.settings.copies')}
          hint={t('rfqReports.settings.copiesHint')}
          error={shown(errors.list)}
          group
        >
          <ul className="flex flex-col gap-1.5">
            {form.copies.map((copy, index) => (
              <li key={copyIds[index]} className="flex items-start gap-1.5">
                <Field
                  label={t('rfqReports.settings.copyAddress', { index: index + 1 })}
                  error={shown(errors.copies[index])}
                  className="min-w-0 flex-1"
                >
                  <TextInput
                    value={copy}
                    onChange={(value) => setCopy(index, value)}
                    type="email"
                    autoComplete="off"
                  />
                </Field>
                <Button
                  variant="secondary"
                  icon={X}
                  aria-label={t('rfqReports.settings.removeCopy', { index: index + 1 })}
                  className="mt-5"
                  onClick={() => {
                    set({ copies: form.copies.filter((_, at) => at !== index) })
                    setCopyIds(copyIds.filter((_, at) => at !== index))
                  }}
                />
              </li>
            ))}
          </ul>
          <div>
            <Button
              variant="link"
              icon={Plus}
              disabled={form.copies.length >= MAX_COPIES}
              onClick={() => {
                set({ copies: [...form.copies, ''] })
                setCopyIds([...copyIds, nextId.current++])
              }}
            >
              {t('rfqReports.settings.addCopy')}
            </Button>
          </div>
        </Field>
        <Switch
          checked={form.nilReport}
          onChange={(nilReport) => set({ nilReport })}
          label={t('rfqReports.settings.nilReportLabel')}
        />
        {save.error && !isApiError(save.error, 409) && (
          <p role="alert" className="font-sans text-data text-down">
            {save.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={save.isPending}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
