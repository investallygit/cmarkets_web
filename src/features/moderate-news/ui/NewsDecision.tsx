import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApproveNews, useRetypeNews, useTakeDownNews } from '@/entities/moderation'
import type { ModeratedNewsDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

type Decision = 'approve' | 'keep' | 'takedown' | 'retype'

/**
 * The moderator's decisions on a news item (NEWS, MOD; spec section 10): one waiting is approved
 * (live now, or at its newspaper's time), a reported one kept (its reports closed); either is
 * taken down with the reason its newspaper reads; an ARTICLE becomes a FLASH, or back.
 */
export function NewsDecision({ item }: { item: ModeratedNewsDto }) {
  const { t } = useTranslation()
  const approve = useApproveNews()
  const takeDown = useTakeDownNews()
  const retype = useRetypeNews()
  const [asking, setAsking] = useState<Decision | null>(null)
  const pending = item.status === 'pending'
  const live = item.status === 'published' || item.status === 'scheduled'
  const toFlash = item.type === 'article'
  const busy = approve.isPending || takeDown.isPending || retype.isPending
  const failure = (approve.error ?? takeDown.error ?? retype.error)?.message
  const close = () => {
    approve.reset()
    takeDown.reset()
    retype.reset()
    setAsking(null)
  }
  if (!pending && !live) return null

  const titles: Record<Decision, string> = {
    approve: t('newsModeration.approveTitle'),
    keep: t('newsModeration.keepTitle'),
    takedown: t('newsModeration.takeDownTitle'),
    retype: t('newsModeration.retypeTitle'),
  }
  const messages: Record<Decision, string> = {
    approve: t('newsModeration.approveMessage'),
    keep: t('newsModeration.keepMessage'),
    takedown: t('newsModeration.takeDownMessage'),
    retype: toFlash ? t('newsModeration.toFlashMessage') : t('newsModeration.toArticleMessage'),
  }
  const labels: Record<Decision, string> = {
    approve: t('newsModeration.approve'),
    keep: t('newsModeration.keep'),
    takedown: t('newsModeration.takeDown'),
    retype: toFlash ? t('newsModeration.toFlash') : t('newsModeration.toArticle'),
  }

  const confirm = (reason: string) => {
    const done = (message: string) => () => {
      toast.success(message)
      setAsking(null)
    }
    switch (asking) {
      case 'approve':
        approve.mutate(item.id, {
          onSuccess: (approved) =>
            done(
              approved.status === 'scheduled'
                ? t('newsModeration.approvedScheduled')
                : t('newsModeration.approved'),
            )(),
        })
        break
      case 'keep':
        approve.mutate(item.id, { onSuccess: done(t('newsModeration.kept')) })
        break
      case 'takedown':
        takeDown.mutate({ id: item.id, reason }, { onSuccess: done(t('newsModeration.takenDown')) })
        break
      case 'retype':
        retype.mutate(
          { id: item.id, type: toFlash ? 'flash' : 'article' },
          { onSuccess: done(t('newsModeration.retyped')) },
        )
        break
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending ? (
        <Button variant="success" onClick={() => setAsking('approve')}>
          {labels.approve}
        </Button>
      ) : (
        item.reports.length > 0 && (
          <Button variant="success" onClick={() => setAsking('keep')}>
            {labels.keep}
          </Button>
        )
      )}
      <Button variant="danger" onClick={() => setAsking('takedown')}>
        {labels.takedown}
      </Button>
      <Button onClick={() => setAsking('retype')}>{labels.retype}</Button>
      <ConfirmDialog
        open={asking !== null}
        onClose={close}
        title={asking ? titles[asking] : ''}
        message={
          <>
            <span className="mb-2 block font-semibold">{item.headline}</span>
            {asking && messages[asking]}
            {failure && (
              <span role="alert" className="mt-2 block text-down">
                {failure}
              </span>
            )}
          </>
        }
        confirmLabel={asking ? labels[asking] : ''}
        tone={asking === 'takedown' ? 'danger' : 'primary'}
        requireReason={asking === 'takedown'}
        busy={busy}
        onConfirm={confirm}
      />
    </div>
  )
}
