import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRfqDisputeFile, useRfqDisputes } from '@/entities/rfq'
import { DecideCaseDialog, type CaseDecision } from '@/features/decide-rfq-case'
import type { RfqDisputeDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'

/**
 * The participants' disputes on the Admin's RFQ screen (sixth version; ROADMAP decision 54): the
 * open ones first, each with its case, its reason and evidence; Neutralise (the dispute upheld) or
 * Turn down, with a reason, traced in AUDT.
 */
export function DisputesPanel() {
  const { t } = useTranslation()
  const disputes = useRfqDisputes()
  const [decision, setDecision] = useState<CaseDecision | null>(null)
  return (
    <Panel title={t('rfqCompletion.admin.disputes')} code="RFQ CPL">
      <QueryView query={disputes}>
        {(list) =>
          list.length === 0 ? (
            <p className="p-2 font-sans text-data text-secondary">
              {t('rfqCompletion.admin.noDispute')}
            </p>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col overflow-auto p-2">
              {list.map((dispute) => (
                <DisputeItem key={dispute.id} dispute={dispute} onDecide={setDecision} />
              ))}
            </ul>
          )
        }
      </QueryView>
      <DecideCaseDialog decision={decision} onClose={() => setDecision(null)} />
    </Panel>
  )
}

function DisputeItem({
  dispute,
  onDecide,
}: {
  dispute: RfqDisputeDto
  onDecide: (decision: CaseDecision) => void
}) {
  const { t } = useTranslation()
  const format = useFormat()
  const download = useRfqDisputeFile()
  const number = dispute.agreementNumber ?? dispute.requestNumber
  return (
    <li className="flex flex-col gap-1 border-b py-2 last:border-b-0">
      <span className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-label text-secondary tabular-nums">
          {format.date(dispute.raisedAt)}
        </span>
        <Badge tone={dispute.status === 'open' ? 'warning' : 'neutral'}>
          {t(`rfqCompletion.disputeStatus.${dispute.status}`)}
        </Badge>
        <span className="font-sans text-data font-semibold text-primary">
          {`${dispute.trader.name} · ${dispute.trader.organization}`}
        </span>
      </span>
      <span className="font-sans text-data text-primary">
        {[
          number,
          t(`rfqCompletion.roles.${dispute.role}`),
          t(`rfqCompletion.causes.${dispute.cause}`),
          format.date(dispute.occurredAt),
        ].join(' · ')}
      </span>
      <p className="font-sans text-data text-secondary">
        {t('rfqCompletion.admin.raisedBy', { name: dispute.raisedBy.name })} «&nbsp;
        {dispute.reason}&nbsp;»
      </p>
      {dispute.files.length > 0 && (
        <span className="flex flex-wrap gap-2">
          {dispute.files.map((file) => (
            <Button
              key={file.index}
              size="sm"
              variant="link"
              onClick={() =>
                download.mutate({ id: dispute.id, index: file.index, fileName: file.fileName })
              }
            >
              {file.fileName}
            </Button>
          ))}
        </span>
      )}
      {dispute.answer && (
        <p className="font-sans text-label text-secondary">
          {t('rfqCompletion.admin.answer', { answer: dispute.answer })}
        </p>
      )}
      {dispute.status === 'open' && (
        <span className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => onDecide({ kind: 'neutralize', caseId: dispute.caseId, number })}
          >
            {t('rfqCompletion.admin.neutralize')}
          </Button>
          <Button
            size="sm"
            onClick={() => onDecide({ kind: 'reject', disputeId: dispute.id, number })}
          >
            {t('rfqCompletion.admin.reject')}
          </Button>
        </span>
      )}
    </li>
  )
}
