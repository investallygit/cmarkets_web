import { clsx } from 'clsx'
import { Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDownloadAttachment } from '@/entities/conversation'
import type { MessageAttachmentDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { saveBlob } from '@/shared/lib/download'
import { toast } from '@/shared/ui/toast'

interface AttachmentLinkProps {
  attachment: MessageAttachmentDto
  /** The date it was sent, as the shared files list it. */
  showDate?: boolean
}

/** A file of the conversation: downloaded once scanned, blocked if the scan found a virus. */
export function AttachmentLink({ attachment, showDate = false }: AttachmentLinkProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const download = useDownloadAttachment()
  const available = attachment.status === 'available'
  return (
    <span className="flex min-w-0 items-baseline gap-2">
      <button
        type="button"
        disabled={!available || download.isPending}
        aria-label={t('messaging.participant.download', { name: attachment.fileName })}
        onClick={() =>
          download.mutate(attachment, {
            onSuccess: (blob) => saveBlob(blob, attachment.fileName),
            onError: (error) => toast.error(error.message),
          })
        }
        className={clsx(
          'inline-flex min-w-0 items-center gap-1.5 font-mono text-data',
          available ? 'text-info hover:underline' : 'text-secondary',
          attachment.status === 'infected' && 'text-down line-through',
        )}
      >
        <Paperclip aria-hidden className="size-3 shrink-0" />
        <span className="truncate">{attachment.fileName}</span>
      </button>
      <span className="ml-auto shrink-0 font-mono text-data text-secondary">
        {attachment.status === 'scanning'
          ? t('messaging.composer.scanning')
          : attachment.status === 'infected'
            ? t('messaging.composer.infected')
            : showDate
              ? format.dayMonth(attachment.uploadedAt)
              : format.fileSize(attachment.size)}
      </span>
    </span>
  )
}
