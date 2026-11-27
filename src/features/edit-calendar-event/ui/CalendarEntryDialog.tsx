import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSaveCalendarEntry } from '@/entities/calendar-event'
import { SecurityPicker } from '@/entities/security'
import { isApiError } from '@/shared/api'
import type { CalendarEntryDto } from '@/shared/api/contracts'
import { CEMAC_COUNTRIES } from '@/shared/config/countries'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { DateInput } from '@/shared/ui/form/DateInput'
import { Field } from '@/shared/ui/form/Field'
import { Select } from '@/shared/ui/form/Select'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'
import { ENTRY_TYPES, eventForm, eventInput, type EventForm } from '../model/eventForm'

interface CalendarEntryDialogProps {
  open: boolean
  /** The event corrected; null for a new one. */
  entry: CalendarEntryDto | null
  today: string
  onClose: () => void
}

/**
 * CORR: an event of the calendar entered by hand (screen 32, sixth version; ROADMAP decision 57):
 * its day and time in Douala, its type, its title and detail, its security or its state; "announced
 * date" on CAL until confirmed.
 */
export function CalendarEntryDialog({ open, entry, today, onClose }: CalendarEntryDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={entry ? t('calendar.corr.edit', { title: entry.title }) : t('calendar.corr.formTitle')}
      width={560}
    >
      {open && (
        <EventFormBody key={entry?.id ?? 'new'} entry={entry} today={today} onClose={onClose} />
      )}
    </Dialog>
  )
}

function EventFormBody({
  entry,
  today,
  onClose,
}: {
  entry: CalendarEntryDto | null
  today: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const save = useSaveCalendarEntry()
  const [form, setForm] = useState<EventForm>(() => eventForm(entry, today))
  const [submitted, setSubmitted] = useState(false)
  const { missing, input } = eventInput(form)
  const serverErrors = isApiError(save.error, 400) ? save.error.problem.errors : undefined
  const otherError = save.error && !isApiError(save.error, 400) ? save.error.message : undefined
  const error = (key: keyof EventForm, server: string = key) =>
    (submitted && missing.includes(key)
      ? t(`calendar.corr.errors.${key === 'time' ? 'time' : 'required'}`)
      : undefined) ?? serverErrors?.[server]?.[0]
  const set = (change: Partial<EventForm>) => setForm((current) => ({ ...current, ...change }))
  const label = (key: keyof EventForm) => t(`calendar.corr.fields.${key}`)

  return (
    <form
      noValidate
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!input) return
        save.mutate(
          { id: entry?.id ?? null, entry: input },
          {
            onSuccess: (saved) => {
              toast.success(t('calendar.corr.saved', { title: saved.title }))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={label('date')} error={error('date')}>
            <DateInput value={form.date} onChange={(date) => set({ date })} />
          </Field>
          <Field label={label('time')} hint={t('calendar.corr.timeHint')} error={error('time')}>
            <TextInput
              value={form.time}
              onChange={(time) => set({ time })}
              mono
              placeholder="10:00"
            />
          </Field>
          <Field label={label('type')} error={serverErrors?.type?.[0]}>
            <Select
              value={form.type}
              options={ENTRY_TYPES.map((type) => ({
                value: type,
                label: t(`calendar.types.${type}`),
              }))}
              onChange={(type) => set({ type })}
            />
          </Field>
          <Field label={label('country')} error={serverErrors?.country?.[0]}>
            <Select
              value={form.country}
              options={[
                { value: '', label: t('calendar.corr.zone') },
                ...CEMAC_COUNTRIES.map((code) => ({ value: code, label: format.country(code) })),
              ]}
              onChange={(country: string) => set({ country })}
            />
          </Field>
          <Field label={label('title')} error={error('title')} className="sm:col-span-2">
            <TextInput value={form.title} onChange={(title) => set({ title })} maxLength={120} />
          </Field>
          <Field
            label={label('detail')}
            error={serverErrors?.detail?.[0]}
            className="sm:col-span-2"
          >
            <TextInput
              value={form.detail}
              onChange={(detail) => set({ detail })}
              maxLength={200}
              placeholder={t('calendar.corr.detailHint')}
            />
          </Field>
          <Field
            label={label('security')}
            error={serverErrors?.securityId?.[0]}
            className="sm:col-span-2"
          >
            <SecurityPicker
              value={form.security?.code}
              onSelect={(picked) => set({ security: { id: picked.id, code: picked.code } })}
              onClear={() => set({ security: null })}
            />
          </Field>
          <Checkbox
            className="sm:col-span-2"
            checked={form.confirmed}
            onChange={(confirmed) => set({ confirmed })}
            label={t('calendar.corr.confirmed')}
          />
        </div>
        {otherError && (
          <p role="alert" className="font-sans text-data text-down">
            {otherError}
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
