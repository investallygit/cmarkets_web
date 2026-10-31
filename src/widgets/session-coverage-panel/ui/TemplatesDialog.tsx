import { useTranslation } from 'react-i18next'
import { ImportTemplateList } from '@/entities/data-import'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'

/** "Download file templates" of the session coverage (screen 6). */
export function TemplatesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('dataImport.templates.title')} width={720}>
      <DialogBody>
        <p className="font-sans text-data text-secondary">{t('dataImport.templates.intro')}</p>
        <ImportTemplateList />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogFooter>
    </Dialog>
  )
}
