import { useTranslation } from 'react-i18next'
import { useDocumentFile, useDocuments, type DocumentQuery } from '@/entities/document'
import { Panel } from '@/shared/ui/Panel'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

interface DocumentViewerPanelProps {
  /** The query of the list next to it, whose cache gives the title. */
  query: DocumentQuery
  documentId: string | null
}

/** The selected document in the embedded PDF viewer. API /documents/{id}/file. */
export function DocumentViewerPanel({ query, documentId }: DocumentViewerPanelProps) {
  const { t } = useTranslation()
  const document = useDocuments(query).data?.items.find((item) => item.id === documentId)
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
