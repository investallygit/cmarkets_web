import { useTranslation } from 'react-i18next'
import { useDocumentFile } from '@/entities/document'
import { useIndexDocuments } from '@/entities/market'
import { Panel } from '@/shared/ui/Panel'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/** Screen 31's DOC tab: the document chosen in the embedded PDF viewer. API /documents/{id}/file. */
export function IndexDocumentViewer({
  code,
  documentId,
}: {
  code: string
  documentId: string | null
}) {
  const { t } = useTranslation()
  const document = useIndexDocuments(code).data?.find((item) => item.id === documentId)
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
