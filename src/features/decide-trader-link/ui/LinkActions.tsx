import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeclineLink, useRevokeLink } from '@/entities/svt-link'
import type { TraderLinkDto } from '@/shared/api/contracts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { toast } from '@/shared/ui/toast'

/** Declines a trader's request (POST /svt/links/{id}/decline): the trader reads it in "My SVTs". */
export function DeclineLinkButton({ link }: { link: TraderLinkDto }) {
  const { t } = useTranslation()
  const decline = useDeclineLink()
  return (
    <Button
      size="sm"
      variant="danger"
      busy={decline.isPending}
      aria-label={`${t('rfq.links.decline')} · ${link.trader.name}`}
      onClick={() =>
        decline.mutate(link.id, {
          onSuccess: () => toast.success(t('rfq.links.declined', { name: link.trader.name })),
          onError: (error) => toast.error(error.message),
        })
      }
    >
      {t('rfq.links.decline')}
    </Button>
  )
}

/** Removes a confirmed link (POST /svt/links/{id}/revoke; screen 22: "The SVT can remove the link at any time"). */
export function RevokeLinkButton({ link }: { link: TraderLinkDto }) {
  const { t } = useTranslation()
  const revoke = useRevokeLink()
  const [open, setOpen] = useState(false)
  const name = link.trader.name
  return (
    <>
      <Button size="sm" variant="danger" icon={Trash2} onClick={() => setOpen(true)}>
        {t('rfq.links.remove', { name })}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('rfq.links.removeTitle')}
        message={t('rfq.links.removeConfirm', { name })}
        confirmLabel={t('rfq.links.remove', { name })}
        tone="danger"
        busy={revoke.isPending}
        onConfirm={() =>
          revoke.mutate(link.id, {
            onSuccess: () => {
              toast.success(t('rfq.links.removed', { name }))
              setOpen(false)
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </>
  )
}
