import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { TextInput } from '@/shared/ui/form/TextInput'
import { isLinkAllowed } from './links'

interface LinkDialogProps {
  open: boolean
  onClose: () => void
  /** The link under the cursor, if any. */
  href: string
  onSave: (href: string | null) => void
}

/** "Link" of the toolbar: a web page or an e-mail address on the selected words. */
export function LinkDialog({ open, onClose, href, onSave }: LinkDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('richText.link.title')}>
      <LinkForm href={href} onClose={onClose} onSave={onSave} />
    </Dialog>
  )
}

function LinkForm({ href, onClose, onSave }: Omit<LinkDialogProps, 'open'>) {
  const { t } = useTranslation()
  const [url, setUrl] = useState(href)
  const [submitted, setSubmitted] = useState(false)
  const invalid = submitted && !isLinkAllowed(url)
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(true)
        if (!isLinkAllowed(url)) return
        onSave(url.trim())
        onClose()
      }}
    >
      <DialogBody>
        <Field label={t('richText.link.url')} error={invalid ? t('richText.link.invalid') : null}>
          <TextInput
            value={url}
            onChange={setUrl}
            type="url"
            placeholder="https://"
            autoFocus
            mono
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        {href && (
          <Button
            variant="danger"
            onClick={() => {
              onSave(null)
              onClose()
            }}
          >
            {t('richText.link.remove')}
          </Button>
        )}
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary">
          {t('richText.link.apply')}
        </Button>
      </DialogFooter>
    </form>
  )
}
