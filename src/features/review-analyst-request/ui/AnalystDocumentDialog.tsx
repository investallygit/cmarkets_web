import { useTranslation } from 'react-i18next'
import { useAnalystDocument } from '@/entities/analyst-request'
import type { SignUpDocument } from '@/shared/api/contracts'
import { Dialog } from '@/shared/ui/Dialog'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'

export interface OpenDocument {
  requestId: string
  kind: SignUpDocument
  fileName: string
}

/** A document sent with an Analyst sign-up, in the browser's PDF viewer. */
export function AnalystDocumentDialog({
  document,
  onClose,
}: {
  document: OpenDocument | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const file = useAnalystDocument(document?.requestId ?? null, document?.kind ?? null)
  return (
    <Dialog
      open={document !== null}
      onClose={onClose}
      title={
        document ? `${t(`analystRequests.documents.${document.kind}`)} · ${document.fileName}` : ''
      }
      width={760}
    >
      <div className="h-[70vh]">
        <QueryView query={file}>
          {(blob) => <PdfViewer file={blob} title={document?.fileName ?? ''} />}
        </QueryView>
      </div>
    </Dialog>
  )
}
