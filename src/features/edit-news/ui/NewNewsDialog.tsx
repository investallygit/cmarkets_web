import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateProviderNews } from '@/entities/news'
import { NEWS_TYPES, type NewsType, type ProviderNewsDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'

interface NewNewsDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (item: ProviderNewsDto) => void
}

/** "+ New" of My news: a draft of the type chosen (POST /provider/news, type required). */
export function NewNewsDialog({ open, onClose, onCreated }: NewNewsDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('newsStudio.mine.newTitle')}>
      <NewNewsForm onClose={onClose} onCreated={onCreated} />
    </Dialog>
  )
}

function NewNewsForm({ onClose, onCreated }: Omit<NewNewsDialogProps, 'open'>) {
  const { t } = useTranslation()
  const create = useCreateProviderNews()
  const [type, setType] = useState<NewsType>('article')
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        create.mutate(type, {
          onSuccess: (item) => {
            onCreated(item)
            onClose()
          },
        })
      }}
    >
      <DialogBody className="grid gap-3">
        <Field
          label={t('newsStudio.publishing.type')}
          group
          hint={t('newsStudio.mine.newHint')}
          error={create.error?.message}
        >
          <SegmentedControl
            value={type}
            options={NEWS_TYPES.map((value) => ({ value, label: t(`news.types.${value}`) }))}
            onChange={setType}
            aria-label={t('newsStudio.publishing.type')}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" disabled={create.isPending}>
          {t('newsStudio.mine.create')}
        </Button>
      </DialogFooter>
    </form>
  )
}
