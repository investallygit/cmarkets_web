import { clsx } from 'clsx'
import { BarChart3, FileText, LineChart, Paperclip, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ATTACHMENT_EXTENSIONS,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENTS_MAX,
  MESSAGE_MAX_LENGTH,
  useSendMessage,
  useStartConversation,
  useUploadAttachment,
} from '@/entities/conversation'
import { isApiError } from '@/shared/api'
import type { MessageAttachmentDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { Button } from '@/shared/ui/form/Button'
import { ShareDialog, type PendingShare, type ShareKind } from './ShareDialog'

interface ComposerProps {
  /** The conversation written to; null for a new one. */
  conversationId: string | null
  /** The person a new conversation starts with. */
  to?: string | null
  /** Closed, or a request waiting: the composer shows and takes nothing. */
  disabled?: boolean
  /** A new conversation, created by its first message. */
  onStarted?: (conversationId: string) => void
}

interface PendingFile {
  key: string
  fileName: string
  attachment: MessageAttachmentDto | null
  error: string | null
}

/** The counter shows once the text nears the limit. */
const COUNT_FROM = MESSAGE_MAX_LENGTH - 400

/**
 * The composer of screen 11: the text (Enter sends, Shift + Enter adds a line, 4,000
 * characters), files (PDF, XLSX, CSV, PNG, JPEG, 10 MB, scanned before use) and one security,
 * chart or publication shared as a card.
 */
export function Composer({
  conversationId,
  to = null,
  disabled = false,
  onStarted,
}: ComposerProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const inputId = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [shared, setShared] = useState<PendingShare | null>(null)
  const [sharing, setSharing] = useState<ShareKind | null>(null)
  const send = useSendMessage(conversationId ?? '')
  const start = useStartConversation()
  const upload = useUploadAttachment()
  const sending = send.isPending || start.isPending
  const error = send.error ?? start.error
  const uploading = files.some((file) => !file.attachment && !file.error)
  const attachmentIds = files.flatMap((file) =>
    file.attachment && file.attachment.status !== 'infected' ? [file.attachment.id] : [],
  )
  const tooLong = text.length > MESSAGE_MAX_LENGTH
  const empty = !text.trim() && attachmentIds.length === 0 && !shared
  const blocked = disabled || sending || uploading || tooLong || empty

  const addFiles = (chosen: FileList | null) => {
    for (const file of Array.from(chosen ?? [])) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`
      const extension = file.name.split('.').at(-1)?.toLowerCase() ?? ''
      const problem = !ATTACHMENT_EXTENSIONS.includes(extension)
        ? t('messaging.composer.errors.type')
        : file.size > ATTACHMENT_MAX_BYTES
          ? t('messaging.composer.errors.size')
          : null
      setFiles((current) => {
        if (current.length >= ATTACHMENTS_MAX) return current
        return [...current, { key, fileName: file.name, attachment: null, error: problem }]
      })
      if (problem) continue
      // One promise per file: the callbacks of mutate() only follow the latest call.
      upload
        .mutateAsync(file)
        .then((attachment) =>
          setFiles((current) =>
            current.map((item) => (item.key === key ? { ...item, attachment } : item)),
          ),
        )
        .catch((failure: Error) =>
          setFiles((current) =>
            current.map((item) => (item.key === key ? { ...item, error: failure.message } : item)),
          ),
        )
    }
  }

  const reset = () => {
    setText('')
    setFiles([])
    setShared(null)
  }

  const submit = () => {
    if (blocked) return
    const message = { text: text.trim(), attachmentIds, shared: shared?.input ?? null }
    if (conversationId) {
      send.mutate(message, { onSuccess: reset })
    } else if (to) {
      start.mutate(
        { participantIds: [to], message },
        {
          onSuccess: (conversation) => {
            reset()
            onStarted?.(conversation.id)
          },
        },
      )
    }
  }

  const failure =
    error &&
    (isApiError(error, 403)
      ? t('messaging.composer.errors.contactNotOpen')
      : isApiError(error, 409)
        ? t('messaging.composer.errors.waiting')
        : isApiError(error, 429)
          ? t('messaging.composer.errors.limit')
          : error.message)

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t p-2">
      {(files.length > 0 || shared) && (
        <ul className="flex flex-wrap gap-1.5">
          {shared && (
            <li className="inline-flex items-center gap-1.5 border border-accent-amber/60 px-2 py-0.5 font-sans text-data">
              {shared.label}
              <button
                type="button"
                aria-label={t('messaging.composer.removeShared')}
                onClick={() => setShared(null)}
                className="flex size-5 items-center justify-center text-secondary hover:text-primary"
              >
                <X aria-hidden className="size-3" />
              </button>
            </li>
          )}
          {files.map((file) => (
            <li
              key={file.key}
              className={clsx(
                'inline-flex items-center gap-1.5 border px-2 py-0.5 font-sans text-data',
                (file.error || file.attachment?.status === 'infected') && 'border-down text-down',
              )}
            >
              <Paperclip aria-hidden className="size-3" />
              <span className="max-w-48 truncate">{file.fileName}</span>
              <span className="text-secondary">
                {file.error ??
                  (file.attachment
                    ? file.attachment.status === 'infected'
                      ? t('messaging.composer.infected')
                      : format.fileSize(file.attachment.size)
                    : t('messaging.composer.scanning'))}
              </span>
              <button
                type="button"
                aria-label={t('messaging.composer.removeFile', { name: file.fileName })}
                onClick={() =>
                  setFiles((current) => current.filter((item) => item.key !== file.key))
                }
                className="flex size-5 items-center justify-center text-secondary hover:text-primary"
              >
                <X aria-hidden className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={inputId} className="sr-only">
        {t('messaging.composer.label')}
      </label>
      <textarea
        id={inputId}
        value={text}
        disabled={disabled}
        rows={2}
        maxLength={MESSAGE_MAX_LENGTH + 100}
        placeholder={t('messaging.composer.placeholder')}
        aria-describedby={`${inputId}-hint`}
        aria-invalid={tooLong || undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            submit()
          }
        }}
        className={clsx(
          'block min-h-12 w-full resize-y border bg-app px-3 py-2 font-sans text-label text-primary outline-none placeholder:text-secondary disabled:opacity-50',
          tooLong ? 'border-down' : 'border-accent-amber/60 focus-visible:border-accent-amber',
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          accept={ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          icon={Paperclip}
          disabled={disabled || files.length >= ATTACHMENTS_MAX}
          onClick={() => fileInput.current?.click()}
        >
          {t('messaging.composer.file')}
        </Button>
        <Button
          icon={LineChart}
          variant="info"
          disabled={disabled}
          onClick={() => setSharing('security')}
        >
          {t('messaging.composer.shareSecurity')}
        </Button>
        <Button
          icon={BarChart3}
          variant="info"
          disabled={disabled}
          onClick={() => setSharing('chart')}
        >
          {t('messaging.composer.shareChart')}
        </Button>
        <Button
          icon={FileText}
          variant="info"
          disabled={disabled}
          onClick={() => setSharing('publication')}
        >
          {t('messaging.composer.sharePublication')}
        </Button>
        <span id={`${inputId}-hint`} className="sr-only">
          {t('messaging.composer.hint')}
        </span>
        {text.length >= COUNT_FROM && (
          <span className="font-mono text-title text-secondary" aria-live="polite">
            {t('messaging.composer.count', { count: text.length, max: MESSAGE_MAX_LENGTH })}
          </span>
        )}
        <Button
          variant="primary"
          size="lg"
          busy={sending}
          disabled={blocked}
          onClick={submit}
          className="ml-auto"
        >
          {t('messaging.composer.send')}
        </Button>
      </div>
      {(failure || tooLong) && (
        <p role="alert" className="font-sans text-data text-down">
          {tooLong ? t('messaging.composer.errors.tooLong', { max: MESSAGE_MAX_LENGTH }) : failure}
        </p>
      )}
      <ShareDialog kind={sharing} onClose={() => setSharing(null)} onShare={setShared} />
    </div>
  )
}
