import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApproveAnalyst, useRejectAnalyst } from '@/entities/analyst-request'
import type { AnalystRequestDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface AnalystDecisionProps {
  request: Pick<AnalystRequestDto, 'id' | 'displayName' | 'accountType'>
  /** Wide buttons side by side, as in the screen 9 mockup, or the default size. */
  wide?: boolean
}

/**
 * Approve or Reject the status request of an Analyst, a Journalist or a CEO (screen 9): approved,
 * the account gets the VERIFIED badge and an analyst may publish; rejected, with the reason the
 * user is told.
 */
export function AnalystDecision({ request, wide = false }: AnalystDecisionProps) {
  const { t } = useTranslation()
  const approve = useApproveAnalyst()
  const reject = useRejectAnalyst()
  const [asking, setAsking] = useState<'approve' | 'reject' | null>(null)
  const name = request.displayName
  const type = t(`accountTypes.${request.accountType}`)
  const close = () => {
    approve.reset()
    reject.reset()
    setAsking(null)
  }
  const failure = (approve.error ?? reject.error)?.message

  return (
    <div className={clsx('flex gap-2', wide && 'shrink-0')}>
      <Button
        variant="success"
        className={clsx(wide && 'w-28')}
        onClick={() => setAsking('approve')}
      >
        {t('analystRequests.approve')}
      </Button>
      <Button variant="danger" className={clsx(wide && 'w-28')} onClick={() => setAsking('reject')}>
        {t('analystRequests.reject')}
      </Button>
      <ConfirmDialog
        open={asking !== null}
        onClose={close}
        title={
          asking === 'reject'
            ? t('analystRequests.rejectTitle', { name })
            : t('analystRequests.approveTitle', { name })
        }
        message={
          <>
            {asking === 'reject'
              ? t(`analystRequests.rejectMessages.${request.accountType}`)
              : t(`analystRequests.approveMessages.${request.accountType}`, { name })}
            {failure && (
              <span role="alert" className="mt-2 block text-down">
                {failure}
              </span>
            )}
          </>
        }
        confirmLabel={
          asking === 'reject' ? t('analystRequests.reject') : t('analystRequests.approve')
        }
        tone={asking === 'reject' ? 'danger' : 'primary'}
        requireReason={asking === 'reject'}
        busy={approve.isPending || reject.isPending}
        onConfirm={(reason) => {
          const onSuccess = () => {
            toast.success(
              asking === 'reject'
                ? t('analystRequests.rejected', { name })
                : t('analystRequests.approved', { name, type }),
            )
            setAsking(null)
          }
          if (asking === 'reject') reject.mutate({ id: request.id, reason }, { onSuccess })
          else approve.mutate(request.id, { onSuccess })
        }}
      />
    </div>
  )
}
