import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeletePublicOffer, usePublicOffers } from '@/entities/auction'
import { PublicOfferDialog } from '@/features/edit-public-offer'
import type { PublicOfferDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/**
 * CORR's public bond issues (APE, screen 33, sixth version; ROADMAP decision 58): the issues APE
 * lists, each changed or deleted, a new one entered; each save in AUDT.
 */
export function PublicOfferEditorPanel() {
  const { t } = useTranslation()
  const format = useFormat()
  const offers = usePublicOffers()
  const remove = useDeletePublicOffer()
  const [editing, setEditing] = useState<PublicOfferDto | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PublicOfferDto | null>(null)

  return (
    <Panel
      title={t('auctionMarket.corr.title')}
      code="CORR"
      options={
        <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
          {t('auctionMarket.corr.add')}
        </Button>
      }
    >
      <QueryView
        query={offers}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage={t('auctionMarket.corr.empty')}
      >
        {(rows) => (
          <ul className="divide-y">
            {rows.map((offer) => (
              <li
                key={offer.id}
                className="flex items-center gap-2 px-2 py-1.5 font-sans text-data"
              >
                <span className="min-w-0 flex-1 truncate">
                  {offer.issuer}{' '}
                  <span className="text-secondary">
                    · {format.country(offer.country)} ·{' '}
                    {t(`auctionMarket.offers.statuses.${offer.status}`)} ·{' '}
                    {t('auctionMarket.offers.period', {
                      from: format.isoDate(offer.subscriptionStart),
                      to: format.isoDate(offer.subscriptionEnd),
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={t('auctionMarket.corr.edit', { issuer: offer.issuer })}
                  onClick={() => setEditing(offer)}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-primary"
                >
                  <Pencil size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={t('auctionMarket.corr.delete', { issuer: offer.issuer })}
                  onClick={() => setDeleting(offer)}
                  className="inline-flex size-6 items-center justify-center text-secondary hover:text-down"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
      <PublicOfferDialog
        open={editing !== null}
        offer={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t('auctionMarket.corr.confirmTitle', { issuer: deleting?.issuer ?? '' })}
        message={t('auctionMarket.corr.confirmMessage')}
        confirmLabel={t('auctionMarket.corr.delete', { issuer: deleting?.issuer ?? '' })}
        tone="danger"
        busy={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          const issuer = deleting.issuer
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t('auctionMarket.corr.deleted', { issuer }))
              setDeleting(null)
            },
          })
        }}
      />
    </Panel>
  )
}
