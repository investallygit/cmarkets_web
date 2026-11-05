import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDismissReports } from '@/entities/moderation'
import type { ReportedItemDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * Dismiss the reports of a profile or a conversation: nothing breaks the rules, the reports are
 * closed and their senders are not told. Suspending the account, in its actions, closes them too.
 */
export function ReportDecision({ item }: { item: Pick<ReportedItemDto, 'type' | 'id' | 'title'> }) {
  const { t } = useTranslation()
  const dismiss = useDismissReports()
  const [asking, setAsking] = useState(false)
  const close = () => {
    dismiss.reset()
    setAsking(false)
  }

  return (
    <>
      <Button variant="success" onClick={() => setAsking(true)}>
        {t('directoryReports.dismiss')}
      </Button>
      <ConfirmDialog
        open={asking}
        title={t('directoryReports.dismissTitle', { name: item.title })}
        message={
          <>
            {t('directoryReports.dismissMessage')}
            {dismiss.error && (
              <span role="alert" className="mt-2 block text-down">
                {dismiss.error.message}
              </span>
            )}
          </>
        }
        confirmLabel={t('directoryReports.dismiss')}
        busy={dismiss.isPending}
        onConfirm={() =>
          dismiss.mutate(
            { type: item.type, id: item.id },
            {
              onSuccess: () => {
                close()
                toast.success(t('directoryReports.dismissed'))
              },
            },
          )
        }
        onClose={close}
      />
    </>
  )
}
