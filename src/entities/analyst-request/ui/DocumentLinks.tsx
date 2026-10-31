import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { AnalystRequestDto, SignUpDocument } from '@/shared/api/contracts'

interface DocumentLinksProps {
  request: Pick<AnalystRequestDto, 'documents'>
  onOpen: (kind: SignUpDocument) => void
}

/** "Documents: CV, ID, licence", each opening the file sent at sign-up (screen 9 mockup). */
export function DocumentLinks({ request, onOpen }: DocumentLinksProps) {
  const { t } = useTranslation()
  if (request.documents.length === 0) {
    return <span className="text-secondary">{t('analystRequests.noDocuments')}</span>
  }
  return (
    <span>
      {t('analystRequests.documentsLabel')}{' '}
      {request.documents.map((document, index) => (
        <Fragment key={document.kind}>
          {index > 0 && ', '}
          <button
            type="button"
            title={document.fileName}
            onClick={() => onOpen(document.kind)}
            className="text-info hover:underline"
          >
            {t(`analystRequests.documents.${document.kind}`)}
          </button>
        </Fragment>
      ))}
    </span>
  )
}
