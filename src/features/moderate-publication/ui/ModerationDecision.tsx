import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApprovePublication, useTakeDownPublication } from '@/entities/moderation'
import type { ModerationItemDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

interface ModerationDecisionProps {
  item: Pick<ModerationItemDto, 'publicationId' | 'kind' | 'title'>
  /** Opens the publication to read it first. */
  onOpen?: () => void
  /** Links in a line, "Open · Approve · Take down" (screen 9), or buttons. */
  variant?: 'links' | 'buttons'
}

/**
 * Approve or Take down (screen 9): approved, a publication waiting goes live, a reported one
 * stays and its reports are closed; taken down, with the reason the analyst reads, its buyers
 * keep the version they bought (spec section 13).
 */
export function ModerationDecision({ item, onOpen, variant = 'links' }: ModerationDecisionProps) {
  const { t } = useTranslation()
  const approve = useApprovePublication()
  const takeDown = useTakeDownPublication()
  const [asking, setAsking] = useState<'approve' | 'takedown' | null>(null)
  const close = () => {
    approve.reset()
    takeDown.reset()
    setAsking(null)
  }
  const failure = (approve.error ?? takeDown.error)?.message
  const links = variant === 'links'
  const separator = links && <span className="text-secondary">·</span>

  return (
    <div className={clsx('flex shrink-0 items-center', links ? 'gap-1.5' : 'gap-2')}>
      {onOpen && (
        <>
          <Button
            variant={links ? 'link' : 'info'}
            size={links ? 'sm' : 'md'}
            onClick={onOpen}
            className={clsx(links && 'px-0')}
          >
            {t('moderation.open')}
          </Button>
          {separator}
        </>
      )}
      <Button
        variant={links ? 'link' : 'success'}
        size={links ? 'sm' : 'md'}
        className={clsx(links && 'px-0')}
        onClick={() => setAsking('approve')}
      >
        {t('moderation.approve')}
      </Button>
      {separator}
      <Button
        variant={links ? 'link' : 'danger'}
        size={links ? 'sm' : 'md'}
        className={clsx(links && 'px-0')}
        onClick={() => setAsking('takedown')}
      >
        {t('moderation.takeDown')}
      </Button>
      <ConfirmDialog
        open={asking !== null}
        onClose={close}
        title={asking === 'takedown' ? t('moderation.takeDownTitle') : t('moderation.approveTitle')}
        message={
          <>
            <span className="mb-2 block font-semibold">{item.title}</span>
            {asking === 'takedown'
              ? t('moderation.takeDownMessage')
              : item.kind === 'pending'
                ? t('moderation.approvePendingMessage')
                : t('moderation.approveReportedMessage')}
            {failure && (
              <span role="alert" className="mt-2 block text-down">
                {failure}
              </span>
            )}
          </>
        }
        confirmLabel={asking === 'takedown' ? t('moderation.takeDown') : t('moderation.approve')}
        tone={asking === 'takedown' ? 'danger' : 'primary'}
        requireReason={asking === 'takedown'}
        busy={approve.isPending || takeDown.isPending}
        onConfirm={(reason) => {
          const onSuccess = () => {
            toast.success(
              asking === 'takedown'
                ? t('moderation.takenDown')
                : item.kind === 'pending'
                  ? t('moderation.published')
                  : t('moderation.kept'),
            )
            setAsking(null)
          }
          if (asking === 'takedown') {
            takeDown.mutate({ id: item.publicationId, reason }, { onSuccess })
          } else approve.mutate(item.publicationId, { onSuccess })
        }}
      />
    </div>
  )
}
