import { useTranslation } from 'react-i18next'
import { useCancelStatementRequest, useConfirmStatementRequest } from '@/entities/news-statement'
import { useCurrentUser } from '@/entities/session'
import type { NewsStatementDto, StatementRequestDto } from '@/shared/api/contracts'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/**
 * A change waiting for a second Admin: what, why, who asked; another Admin confirms it, either
 * drops it (spec, screen 18: "a second Admin must confirm").
 */
export function StatementRequest({
  statement,
  request,
}: {
  statement: NewsStatementDto
  request: StatementRequestDto
}) {
  const { t } = useTranslation()
  const me = useCurrentUser()
  const confirm = useConfirmStatementRequest()
  const cancel = useCancelStatementRequest()
  const status = t(`mediaPayments.statuses.${request.status}`)
  const failed = confirm.error ?? cancel.error

  return (
    <div
      role="status"
      className="flex flex-col gap-2 border border-warning/50 bg-warning/10 p-2 font-sans text-data"
    >
      <p className="font-semibold text-warning">
        {t('mediaPayments.statement.waiting', { status })} ·{' '}
        {t(`mediaPayments.statement.why.${request.why}`)}
      </p>
      <p className="text-secondary">
        {t('mediaPayments.statement.waitingBy', {
          name: request.requestedBy?.displayName ?? '—',
          reason: request.reason,
        })}
      </p>
      <div className="flex gap-2">
        {request.requestedBy?.id !== me.id && (
          <Button
            size="sm"
            busy={confirm.isPending}
            onClick={() =>
              confirm.mutate(
                { id: statement.id, requestId: request.id },
                {
                  onSuccess: (updated) =>
                    toast.success(
                      t('mediaPayments.statement.confirmed', {
                        status: t(`mediaPayments.statuses.${updated.status}`),
                      }),
                    ),
                },
              )
            }
          >
            {t('mediaPayments.statement.confirm')}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          busy={cancel.isPending}
          onClick={() =>
            cancel.mutate(
              { id: statement.id, requestId: request.id },
              { onSuccess: () => toast.info(t('mediaPayments.statement.dropped')) },
            )
          }
        >
          {t('mediaPayments.statement.cancel')}
        </Button>
      </div>
      {failed && (
        <p role="alert" className="text-down">
          {failed.message}
        </p>
      )}
    </div>
  )
}
