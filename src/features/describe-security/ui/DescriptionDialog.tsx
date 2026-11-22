import { useTranslation } from 'react-i18next'
import { useDescriptionVersions } from '@/entities/security'
import type { DescribedObject } from '@/shared/api/contracts'
import { Dialog } from '@/shared/ui/Dialog'
import { QueryView } from '@/shared/ui/QueryView'
import { DescriptionForm } from './DescriptionForm'

interface DescriptionDialogProps {
  open: boolean
  onClose: () => void
  type: DescribedObject
  id: string
  /** Code shown in the title and the confirmation. */
  code: string
}

/**
 * DES's "Edit" (spec section 9, screen 2, fifth version): the form of CORR in a dialog, for those
 * who may write descriptions, an Analyst of CMarket (ROADMAP decision 40).
 */
export function DescriptionDialog({ open, onClose, type, id, code }: DescriptionDialogProps) {
  const { t } = useTranslation()
  const versions = useDescriptionVersions(type, open ? id : null)
  return (
    <Dialog open={open} onClose={onClose} title={t('description.editTitle', { code })} width={640}>
      <QueryView query={versions}>
        {(data) => (
          <DescriptionForm key={data.objectId} versions={data} code={code} onSaved={onClose} />
        )}
      </QueryView>
    </Dialog>
  )
}
