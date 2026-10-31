import { clsx } from 'clsx'
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalystDocument } from '@/entities/analyst-request'
import { AnalystDecision } from '@/features/review-analyst-request'
import type { AnalystRequestDto, SignUpDocument } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Panel } from '@/shared/ui/Panel'
import { PdfViewer } from '@/shared/ui/PdfViewer'
import { QueryView } from '@/shared/ui/QueryView'
import { PanelEmpty } from '@/shared/ui/StatusViews'

/**
 * ANLY, one request: who applied, the decision taken, and each supporting document in the PDF
 * viewer, with Approve or Reject while it waits.
 */
export function AnalystRequestPanel({ request }: { request: AnalystRequestDto | null }) {
  const { t } = useTranslation()
  return (
    <Panel
      title={t('panels.analystRequest')}
      code="ANLY"
      options={request && <span className="normal-case">{request.displayName}</span>}
      bodyClassName="flex flex-col"
    >
      {request ? (
        <RequestDetails key={request.id} request={request} />
      ) : (
        <PanelEmpty message={t('analystRequests.choose')} />
      )}
    </Panel>
  )
}

function RequestDetails({ request }: { request: AnalystRequestDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const [kind, setKind] = useState<SignUpDocument | null>(request.documents[0]?.kind ?? null)
  const file = useAnalystDocument(request.id, kind)
  const document = request.documents.find((candidate) => candidate.kind === kind)
  const { decision } = request

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-start gap-3 border-b p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 font-sans text-data">
          <p>
            <span className="text-label font-semibold">{request.displayName}</span>
            <span className="ml-2 text-secondary">
              {request.organization ?? t('accounts.independent')}
            </span>
          </p>
          <p className="text-secondary">{request.email}</p>
          <p className="font-mono text-secondary">
            {t('analystRequests.requested', { date: format.date(request.requestedAt) })}
          </p>
          {decision && (
            <p className={request.status === 'rejected' ? 'text-down' : 'text-up'}>
              {t(
                `analystRequests.decision.${request.status === 'rejected' ? 'rejected' : 'approved'}`,
                {
                  date: format.date(decision.at),
                  name: decision.by,
                },
              )}
              {decision.reason && ` ${decision.reason}`}
            </p>
          )}
        </div>
        {request.status === 'pending' && <AnalystDecision request={request} wide />}
      </div>
      {request.documents.length === 0 ? (
        <PanelEmpty message={t('analystRequests.noDocuments')} />
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t('analystRequests.documentsColumn')}
            className="flex shrink-0 flex-wrap gap-1 border-b px-2 py-1"
          >
            {request.documents.map((candidate) => (
              <button
                key={candidate.kind}
                type="button"
                role="tab"
                aria-selected={candidate.kind === kind}
                onClick={() => setKind(candidate.kind)}
                title={candidate.fileName}
                className={clsx(
                  'inline-flex items-center gap-1 border px-2 py-0.5 font-sans text-data',
                  candidate.kind === kind
                    ? 'border-accent-amber text-primary'
                    : 'text-secondary hover:text-primary',
                )}
              >
                <FileText aria-hidden className="size-3" />
                {t(`analystRequests.documents.${candidate.kind}`)}
                <span className="text-secondary">· {format.fileSize(candidate.size)}</span>
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <QueryView query={file}>
              {(blob) => <PdfViewer file={blob} title={document?.fileName ?? ''} />}
            </QueryView>
          </div>
        </>
      )}
    </>
  )
}
