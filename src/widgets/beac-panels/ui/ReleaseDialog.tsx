import { useTranslation } from 'react-i18next'
import { useDocumentFile } from '@/entities/document'
import { Dialog, DialogBody } from '@/shared/ui/Dialog'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'

interface ReleaseDialogProps {
  /** The library's document of the release; null closes the dialog. */
  documentId: string | null
  title: string
  onClose: () => void
}

/** A meeting's release kept in the library, in the PDF viewer (API /documents/{id}/file). */
export function ReleaseDialog({ documentId, title, onClose }: ReleaseDialogProps) {
  const { t } = useTranslation()
  const file = useDocumentFile(documentId)
  return (
    <Dialog
      open={documentId !== null}
      onClose={onClose}
      title={title || t('panels.document')}
      width={880}
    >
      <DialogBody>
        <div className="h-[70vh]">
          <QueryView query={file}>{(blob) => <PdfViewer file={blob} title={title} />}</QueryView>
        </div>
      </DialogBody>
    </Dialog>
  )
}
