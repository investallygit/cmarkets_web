import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PublicationReader } from '@/entities/publication'
import { useCurrentUser } from '@/entities/session'
import type { PublicationDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Dialog, DialogBody } from '@/shared/ui/Dialog'
import { SegmentedControl } from '@/shared/ui/form/SegmentedControl'
import { readerPreview } from '../model/draftForm'
import { useDraftStore } from '../model/draftStore'

interface ReaderPreviewDialogProps {
  open: boolean
  onClose: () => void
  publication: PublicationDto
}

/**
 * "Reader preview" (spec section 13): the draft through the library's reader, before purchase
 * and after it, with the watermark a buyer gets.
 */
export function ReaderPreviewDialog({ open, onClose, publication }: ReaderPreviewDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('studio.preview.title')} width={760}>
      <PreviewBody publication={publication} />
    </Dialog>
  )
}

function PreviewBody({ publication }: { publication: PublicationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const draft = useDraftStore((state) => state.draft)
  const me = useCurrentUser()
  const paid = draft?.pricing.access === 'paid'
  const [view, setView] = useState<'before' | 'after'>(paid ? 'before' : 'after')
  if (!draft) return null
  const preview = readerPreview(
    publication,
    draft.form,
    draft.pricing,
    { id: me.id, displayName: me.displayName },
    !paid || view === 'after',
    draft.savedAt,
  )

  return (
    <DialogBody className="p-0">
      {paid && (
        <div className="sticky top-0 z-10 border-b bg-panel p-2">
          <SegmentedControl
            value={view}
            options={[
              { value: 'before', label: t('studio.preview.before') },
              { value: 'after', label: t('studio.preview.after') },
            ]}
            onChange={setView}
            aria-label={t('studio.preview.title')}
          />
        </div>
      )}
      <PublicationReader
        publication={preview}
        purchase={
          preview.priceToPay !== null && (
            <p className="border-t pt-3 font-mono text-figure font-semibold text-accent-amber">
              {t('publication.priceXaf', { price: format.number(preview.priceToPay, 0) })}
            </p>
          )
        }
      />
    </DialogBody>
  )
}
