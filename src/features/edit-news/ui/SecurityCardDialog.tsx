import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SecurityPicker } from '@/entities/security'
import type { SecuritySearchItemDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'

interface SecurityCardDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (security: SecuritySearchItemDto) => void
}

/** "CMarket security" of the toolbar: a security of the master list, whose card the body shows. */
export function SecurityCardDialog({ open, onClose, onInsert }: SecurityCardDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('newsStudio.security.title')}>
      <SecurityCardForm onClose={onClose} onInsert={onInsert} />
    </Dialog>
  )
}

function SecurityCardForm({ onClose, onInsert }: Omit<SecurityCardDialogProps, 'open'>) {
  const { t } = useTranslation()
  const [security, setSecurity] = useState<SecuritySearchItemDto | null>(null)
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (!security) return
        onInsert(security)
        onClose()
      }}
    >
      <DialogBody>
        <Field label={t('newsStudio.security.pick')}>
          <SecurityPicker
            value={security && `${security.code} — ${security.name}`}
            onSelect={setSecurity}
            onClear={() => setSecurity(null)}
            autoFocus
            aria-label={t('newsStudio.security.pick')}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={!security}>
          {t('newsStudio.security.insert')}
        </Button>
      </DialogFooter>
    </form>
  )
}
