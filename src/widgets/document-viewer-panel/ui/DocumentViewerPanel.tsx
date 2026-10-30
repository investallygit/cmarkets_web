import { useTranslation } from 'react-i18next'
import { useDocumentFile, useDocuments } from '@/entities/document'
import { Panel } from '@/shared/ui/Panel'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface DocumentViewerPanelProps {
  securityId: string
  documentId: string | null
}

/** Screen 2, DOC tab: the selected document in the embedded PDF viewer. API /documents/{id}/file. */
export function DocumentViewerPanel({ securityId, documentId }: DocumentViewerPanelProps) {
  const { t } = useTranslation()
  // Same query as the list next to it: the title comes from the cache.
  const document = useDocuments({ securityId }).data?.items.find((item) => item.id === documentId)
  const file = useDocumentFile(documentId)
  const title = document?.title ?? t('panels.document')

  return (
    <Panel title={title} code="DOC">
      {documentId ? (
        <QueryView query={file}>{(blob) => <PdfViewer file={blob} title={title} />}</QueryView>
      ) : (
        <PanelEmpty message={t('documents.select')} />
      )}
    </Panel>
  )
}
