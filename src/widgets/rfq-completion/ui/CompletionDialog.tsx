import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRfqCompletion } from '@/entities/rfq'
import { DisputeCaseDialog } from '@/features/dispute-rfq-case'
import type { RfqCompletionCaseDto } from '@/shared/api/contracts'
import { Dialog, DialogBody } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { QueryView } from '@/shared/ui/QueryView'
import { CompletionDetailView } from './CompletionDetailView'

/**
 * "My completion" opened from the blotter (ROADMAP step 62): the trader's own ratios (or its
 * organisation's, `traderId` left out), their failures by cause and the cases, each failure of
 * its own disputed with the Admin.
 */
export function CompletionDialog({
  organizationId,
  traderId,
  onClose,
}: {
  /** The organisation read; null closes the dialog. */
  organizationId: string | null
  traderId?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const detail = useRfqCompletion(organizationId, traderId ? { traderId } : {})
  const [disputed, setDisputed] = useState<RfqCompletionCaseDto | null>(null)
  return (
    <>
      <Dialog
        open={organizationId !== null && disputed === null}
        onClose={onClose}
        title={t('rfqCompletion.detail.title')}
        width={620}
      >
        <DialogBody>
          <QueryView query={detail}>
            {(data) => (
              <CompletionDetailView
                detail={data}
                action={(failure) =>
                  failure.mayDispute && (
                    <Button size="sm" onClick={() => setDisputed(failure)}>
                      {t('rfqCompletion.dispute.open')}
                    </Button>
                  )
                }
              />
            )}
          </QueryView>
        </DialogBody>
      </Dialog>
      <DisputeCaseDialog failure={disputed} onClose={() => setDisputed(null)} />
    </>
  )
}
