import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateExportSchedule } from '@/entities/data-export'
import type { ExportScheduleFrequency, ExportSettingsDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Checkbox } from '@/shared/ui/form/Checkbox'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { toast } from '@/shared/ui/toast'

interface ScheduleExportButtonProps {
  /** Null while the settings lack a selection, a field or a period. */
  settings: ExportSettingsDto | null
  /** The profile holds no more scheduled exports. */
  full: boolean
}

/**
 * DL's Schedule (spec section 9, screen 30: "Scheduled exports: daily, weekly or monthly, placed
 * in My downloads and e-mailed if requested"): the settings of the file made again at 06:00 in
 * Douala, over a period of the same length ending that day (ROADMAP decision 48).
 */
export function ScheduleExportButton({ settings, full }: ScheduleExportButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [frequency, setFrequency] = useState<ExportScheduleFrequency>('weekly')
  const [email, setEmail] = useState(true)
  const create = useCreateExportSchedule()

  return (
    <>
      <Button
        icon={CalendarClock}
        disabled={settings === null || full}
        onClick={() => setOpen(true)}
      >
        {t('downloads.schedule.open')}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('downloads.schedule.title')}
        width={440}
      >
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault()
            if (!settings) return
            create.mutate(
              { settings, frequency, email },
              {
                onSuccess: (schedule) => {
                  toast.success(t('downloads.schedule.saved', { summary: schedule.summary }))
                  setOpen(false)
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }}
        >
          <DialogBody className="grid gap-3">
            <Field label={t('downloads.schedule.frequency')} group>
              <SegmentedControl<ExportScheduleFrequency>
                value={frequency}
                options={(['daily', 'weekly', 'monthly'] as const).map((value) => ({
                  value,
                  label: t(`downloads.schedule.frequencies.${value}`),
                }))}
                onChange={setFrequency}
              />
            </Field>
            <Checkbox checked={email} onChange={setEmail} label={t('downloads.schedule.email')} />
            <p className="font-sans text-caption text-secondary">{t('downloads.schedule.note')}</p>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" busy={create.isPending}>
              {t('downloads.schedule.save')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
