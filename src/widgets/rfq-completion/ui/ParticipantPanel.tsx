import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminRfqCompletion } from '@/entities/rfq'
import { DecideCaseDialog, type CaseDecision } from '@/features/decide-rfq-case'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { CompletionDetailView } from './CompletionDetailView'

/**
 * A participant's ratios and cases as the Admin reads them (ROADMAP decision 54): a failure
 * counted may be neutralised without a dispute, for a platform incident the Admin confirms.
 */
export function ParticipantPanel({ organizationId }: { organizationId: string | null }) {
  const { t } = useTranslation()
  const detail = useAdminRfqCompletion(organizationId)
  const [decision, setDecision] = useState<CaseDecision | null>(null)
  return (
    <Panel title={t('rfqCompletion.admin.participant')}>
      {organizationId === null ? (
        <p className="p-2 font-sans text-data text-secondary">
          {t('rfqCompletion.admin.pickParticipant')}
        </p>
      ) : (
        <QueryView query={detail}>
          {(data) => (
            <div className="min-h-0 flex-1 overflow-auto p-2">
              <CompletionDetailView
                detail={data}
                action={(failure) =>
                  failure.outcome === 'failure' &&
                  !failure.neutralized && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setDecision({
                          kind: 'neutralize',
                          caseId: failure.id,
                          number: failure.agreementNumber ?? failure.requestNumber,
                        })
                      }
                    >
                      {t('rfqCompletion.admin.neutralize')}
                    </Button>
                  )
                }
              />
            </div>
          )}
        </QueryView>
      )}
      <DecideCaseDialog decision={decision} onClose={() => setDecision(null)} />
    </Panel>
  )
}
