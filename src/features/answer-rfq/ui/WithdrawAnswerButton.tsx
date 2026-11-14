import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWithdrawRfqAnswer } from '@/entities/rfq'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface WithdrawAnswerButtonProps {
  requestId: string
  responseId: string
  /** "RFQ-261029-0045". */
  number: string
}

/** Withdraws the trader's answer (DELETE /rfq/{id}/responses/{responseId}) after a confirmation. */
export function WithdrawAnswerButton({ requestId, responseId, number }: WithdrawAnswerButtonProps) {
  const { t } = useTranslation()
  const withdraw = useWithdrawRfqAnswer()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        {t('rfqTrading.answer.withdraw')}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('rfqTrading.answer.withdrawTitle')}
        message={t('rfqTrading.answer.withdrawConfirm', { number })}
        confirmLabel={t('rfqTrading.answer.withdraw')}
        tone="danger"
        busy={withdraw.isPending}
        onConfirm={() =>
          withdraw.mutate(
            { id: requestId, responseId },
            {
              onSuccess: () => {
                toast.success(t('rfqTrading.answer.withdrawn', { number }))
                setOpen(false)
              },
              onError: (error) => toast.error(error.message),
            },
          )
        }
      />
    </>
  )
}
