import { Download, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  PublicationReader,
  useLibraryPublication,
  usePublicationAttachment,
  usePublicationPdf,
} from '@/entities/publication'
import { BuyPublication } from '@/features/buy-publication'
import { RatePublication } from '@/features/rate-publication'
import { ReportPublication } from '@/features/report-publication'
import type { LibraryPublicationDto } from '@/shared/api/contracts'
import { useFormat, useLocale } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { Button } from '@/shared/ui/form/Button'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty } from '@/shared/ui/StatusViews'
import { QueryView } from '@/shared/ui/QueryView'
import { toast } from '@/shared/ui/toast'

/** Before purchase, bought, free, or the user's own. */
function accessLabel(publication: LibraryPublicationDto) {
  if (publication.isAuthor) return 'own'
  if (publication.purchasedAt) return 'bought'
  return publication.access === 'free' ? 'free' : 'locked'
}

/**
 * Screen 8, preview: the summary and the locked contents with the price and the payment choice;
 * once bought (or free), the full content, the watermarked PDF, the rating and the report link.
 * API GET /library/{id}.
 */
export function PublicationPreviewPanel({ publicationId }: { publicationId: string | null }) {
  const { t } = useTranslation()
  const publication = useLibraryPublication(publicationId)
  const data = publication.data

  return (
    <Panel
      title={t('panels.preview')}
      code="PUB"
      options={data && <span>{t(`library.access.${accessLabel(data)}`)}</span>}
    >
      {publicationId === null ? (
        <PanelEmpty message={t('library.choose')} />
      ) : (
        <QueryView query={publication}>
          {(item) => (
            <PublicationReader
              publication={item}
              purchase={<BuyPublication publication={item} />}
              actions={<ReaderActions publication={item} />}
            />
          )}
        </QueryView>
      )}
    </Panel>
  )
}

function ReaderActions({ publication }: { publication: LibraryPublicationDto }) {
  const { t } = useTranslation()
  const format = useFormat()
  const locale = useLocale()
  const pdf = usePublicationPdf(publication.id)
  const attachment = usePublicationAttachment(publication.id)
  const onError = (error: Error) => toast.error(error.message)

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          icon={Download}
          busy={pdf.isPending}
          onClick={() =>
            pdf.mutate(locale, {
              onSuccess: (blob) => saveBlob(blob, `${publication.id}.pdf`),
              onError,
            })
          }
        >
          {t('library.downloadPdf')}
        </Button>
        {publication.attachment && (
          <Button
            size="sm"
            icon={Paperclip}
            busy={attachment.isPending}
            onClick={() =>
              attachment.mutate(undefined, {
                onSuccess: (blob) =>
                  saveBlob(blob, publication.attachment?.fileName ?? 'attachment.pdf'),
                onError,
              })
            }
          >
            {t('library.attachment', {
              name: publication.attachment.fileName,
              size: format.fileSize(publication.attachment.size),
            })}
          </Button>
        )}
        {!publication.isAuthor && (
          <span className="ml-auto">
            <ReportPublication publicationId={publication.id} />
          </span>
        )}
      </div>
      <RatePublication publication={publication} />
    </div>
  )
}
