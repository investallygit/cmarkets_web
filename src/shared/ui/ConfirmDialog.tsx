import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogBody, DialogFooter } from './Dialog'
import { Button } from './form/Button'
import { Field } from './form/Field'
import { Textarea } from './form/Textarea'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  message?: ReactNode
  confirmLabel: string
  /** danger: a destructive action such as Suspend, Take down or Roll back. */
  tone?: 'primary' | 'danger'
  /** The action needs a reason (spec sections 9 and 13: suspension, rejection, rollback...). */
  requireReason?: boolean
  /** Waiting for the server after the confirmation. */
  busy?: boolean
  /** Receives the trimmed reason, or "" when no reason is asked. */
  onConfirm: (reason: string) => void
}

export function ConfirmDialog({ open, onClose, title, ...form }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} width={420}>
      <ConfirmForm onClose={onClose} {...form} />
    </Dialog>
  )
}

/** Mounted with each opening, so the reason starts empty. */
function ConfirmForm({
  onClose,
  message,
  confirmLabel,
  tone = 'primary',
  requireReason = false,
  busy = false,
  onConfirm,
}: Omit<ConfirmDialogProps, 'open' | 'title'>) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const ready = !requireReason || reason.trim() !== ''

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (ready && !busy) onConfirm(reason.trim())
      }}
    >
      <DialogBody>
        {message && <div className="font-sans text-label">{message}</div>}
        {requireReason && (
          <Field label={t('form.reason')} hint={t('form.reasonRequired')}>
            <Textarea value={reason} onChange={setReason} rows={3} required />
          </Field>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          type="submit"
          variant={tone === 'danger' ? 'danger' : 'primary'}
          disabled={!ready}
          busy={busy}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}
