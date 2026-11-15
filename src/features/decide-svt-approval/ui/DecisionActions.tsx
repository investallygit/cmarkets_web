import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApproveAgreement } from '@/entities/rfq'
import type { SvtApprovalDetailDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'
import { RejectDialog } from './RejectDialog'

/**
 * Screen 27's "Approve agreement" and "Reject (reason required)" (spec section 9; API
 * /svt/approvals/{id}/approve and /reject), as the API allows the reader: an authorised approver of
 * the bank on a pending approval; under four eyes, the first approver waits for another.
 */
export function DecisionActions({ detail }: { detail: SvtApprovalDetailDto }) {
  const { t } = useTranslation()
  const approve = useApproveAgreement()
  const [rejecting, setRejecting] = useState(false)
  const number = detail.agreement.number
  const pending = detail.mine.status === 'pending' && detail.agreement.status === 'awaitingSvt'
  if (!pending) return null

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="success"
        size="lg"
        icon={Check}
        disabled={!detail.canApprove}
        busy={approve.isPending}
        onClick={() =>
          approve.mutate(detail.agreement.id, {
            onSuccess: (decided) =>
              toast.success(
                t(
                  decided.agreement.status === 'concluded'
                    ? 'svt.decide.concluded'
                    : decided.mine.status === 'pending'
                      ? 'svt.decide.firstApproval'
                      : 'svt.decide.approved',
                  { number },
                ),
              ),
            onError: (error) => toast.error(error.message),
          })
        }
      >
        {t('svt.decide.approve')}
      </Button>
      <Button
        variant="danger"
        icon={X}
        disabled={!detail.canReject}
        onClick={() => setRejecting(true)}
      >
        {t('svt.decide.reject')}
      </Button>
      {!detail.canReject ? (
        <p className="font-sans text-data text-secondary">{t('svt.decide.notApprover')}</p>
      ) : (
        !detail.canApprove && (
          <p className="font-sans text-data text-secondary">{t('svt.decide.secondEyes')}</p>
        )
      )}
      <RejectDialog
        agreementId={rejecting ? detail.agreement.id : null}
        number={number}
        onClose={() => setRejecting(false)}
      />
    </div>
  )
}
