import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NEWS_LIMITS, useWithdrawProviderNews } from '@/entities/news'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'
import { useNewsDraftStore } from '../model/newsDraftStore'

/**
 * "Withdraw" in the publishing panel's title bar, for a published or scheduled item: the dialog asks
 * its reason (spec section 16); the item leaves the feed and stops collecting clicks.
 */
export function WithdrawNewsButton() {
  const { t } = useTranslation()
  const status = useNewsDraftStore((state) => state.draft?.item.status)
  const [open, setOpen] = useState(false)
  if (status !== 'published' && status !== 'scheduled' && status !== 'pending') return null
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="panel-no-drag text-down uppercase hover:underline"
      >
        {t('newsStudio.publishing.withdraw')}
      </button>
      <WithdrawDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/** Withdraw, with its reason (spec section 16): the item leaves the feed and stops collecting clicks. */
function WithdrawDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const headline = useNewsDraftStore((state) => state.draft?.form.headline ?? '')
  return (
    <Dialog open={open} onClose={onClose} title={t('newsStudio.withdraw.title', { headline })}>
      <WithdrawForm onClose={onClose} />
    </Dialog>
  )
}

function WithdrawForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const withdraw = useWithdrawProviderNews()
  const [reason, setReason] = useState('')
  const draft = useNewsDraftStore((state) => state.draft)
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        if (!draft || !reason.trim()) return
        withdraw.mutate(
          { id: draft.newsId, reason: reason.trim() },
          {
            onSuccess: (item) => {
              useNewsDraftStore.getState().saved(item.id, item)
              toast.success(t('newsStudio.withdraw.done'))
              onClose()
            },
          },
        )
      }}
    >
      <DialogBody className="grid gap-3">
        <p className="font-sans text-label text-secondary">{t('newsStudio.withdraw.intro')}</p>
        <Field label={t('newsStudio.withdraw.reason')} error={withdraw.error?.message}>
          <Textarea
            value={reason}
            onChange={setReason}
            rows={3}
            maxLength={NEWS_LIMITS.withdrawalReason}
            autoFocus
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="danger" disabled={!reason.trim() || withdraw.isPending}>
          {t('newsStudio.withdraw.confirm')}
        </Button>
      </DialogFooter>
    </form>
  )
}
