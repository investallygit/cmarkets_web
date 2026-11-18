import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCancelRfq, useConfirmRfq } from '@/entities/rfq'
import { isApiError } from '@/shared/api'
import type { RfqRequestDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * "Confirm selection (3 agreements)" (spec, screen 22; API POST /rfq/{id}/confirm): the requester
 * confirms the selection at the version it was shown; when an answer changed meanwhile the server
 * refuses (409) and the screen shows the selection again, to be confirmed anew. No manual picking.
 * The hub's RfqConfirmed may read the request again before the answer comes: this button then
 * leaves the screen, and mutate's own callbacks with it. The request's promise still says how it
 * went (as the SVTs' decisions do).
 */
export function ConfirmSelectionButton({ request }: { request: RfqRequestDto }) {
  const { t } = useTranslation()
  const confirm = useConfirmRfq()
  const allocation = request.allocation
  const count = allocation?.agreements ?? 0
  return (
    <Button
      variant="primary"
      busy={confirm.isPending}
      disabled={!allocation || count === 0}
      onClick={() =>
        allocation &&
        void confirm.mutateAsync({ id: request.id, allocationVersion: allocation.version }).then(
          (confirmed) =>
            toast.success(
              t('rfqTrading.myRequest.confirmed', {
                number: confirmed.number,
                count: confirmed.agreements.length,
              }),
            ),
          (error: Error) =>
            isApiError(error, 409) && error.problem.title === 'Selection changed'
              ? toast.error(t('rfqTrading.myRequest.changed'))
              : toast.error(error.message),
        )
      }
    >
      {t('rfqTrading.myRequest.confirm', { count })}
    </Button>
  )
}

/**
 * "Cancel request" (API POST /rfq/{id}/cancel): off the board, no agreement, after a confirmation.
 * Its toast follows the request's promise too: the hub's RfqClosed may take the button away first.
 */
export function CancelRfqButton({ request }: { request: RfqRequestDto }) {
  const { t } = useTranslation()
  const cancel = useCancelRfq()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t('rfqTrading.myRequest.cancel')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('rfqTrading.myRequest.cancelTitle')}
        message={t('rfqTrading.myRequest.cancelConfirm', { number: request.number })}
        confirmLabel={t('rfqTrading.myRequest.cancel')}
        tone="danger"
        busy={cancel.isPending}
        onConfirm={() =>
          void cancel.mutateAsync(request.id).then(
            () => {
              toast.success(t('rfqTrading.myRequest.cancelled', { number: request.number }))
              setOpen(false)
            },
            (error: Error) => toast.error(error.message),
          )
        }
      />
    </>
  )
}
