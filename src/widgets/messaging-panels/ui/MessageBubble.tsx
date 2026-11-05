import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  MESSAGE_MAX_LENGTH,
  ReadReceipt,
  useDeleteMessage,
  useEditMessage,
} from '@/entities/conversation'
import type { MessageDto } from '@/shared/api/contracts'
import { useFormat } from '@/shared/i18n'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button } from '@/shared/ui/form/Button'
import { Textarea } from '@/shared/ui/form/Textarea'
import { toast } from '@/shared/ui/toast'
import { AttachmentLink } from './AttachmentLink'
import { SharedCard } from './SharedCard'

interface MessageBubbleProps {
  message: MessageDto
  own: boolean
  /** A group names the author of each message received. */
  showAuthor: boolean
  /** Found by a search: framed until another opens. */
  highlighted: boolean
}

/**
 * A message of the thread (spec section 9, screen 11): received on the left on #1A1A1A, sent
 * on the right on #1E3A5F with its read receipt; its author edits it within 15 minutes, or
 * deletes it for everyone.
 */
export function MessageBubble({ message, own, showAuthor, highlighted }: MessageBubbleProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text)
  const [deleting, setDeleting] = useState(false)
  const edit = useEditMessage(message.conversationId)
  const remove = useDeleteMessage(message.conversationId)
  const time = format.time(message.sentAt)

  return (
    <li
      id={`message-${message.id}`}
      className={clsx('group flex flex-col gap-1', own ? 'items-end' : 'items-start')}
    >
      <div
        className={clsx(
          'flex max-w-[min(36rem,85%)] flex-col gap-2 border px-3 py-2',
          own ? 'bg-selected' : 'bg-panel-header',
          highlighted ? 'border-accent-amber' : 'border-transparent',
        )}
      >
        {showAuthor && !own && (
          <span className="font-sans text-data font-semibold text-secondary">
            {message.author.displayName}
          </span>
        )}
        {message.deleted ? (
          <p className="font-sans text-label text-secondary italic">
            {t('messaging.thread.deleted')}
          </p>
        ) : editing ? (
          <form
            className="flex min-w-72 flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              edit.mutate(
                { messageId: message.id, text: draft.trim() },
                {
                  onSuccess: () => setEditing(false),
                  onError: (error) => toast.error(error.message),
                },
              )
            }}
          >
            <Textarea
              value={draft}
              onChange={setDraft}
              rows={3}
              maxLength={MESSAGE_MAX_LENGTH}
              aria-label={t('messaging.thread.editLabel')}
            />
            <span className="flex justify-end gap-2">
              <Button size="sm" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" type="submit" variant="primary" busy={edit.isPending}>
                {t('messaging.thread.save')}
              </Button>
            </span>
          </form>
        ) : (
          <>
            {message.text && (
              <p className="font-sans text-label break-words whitespace-pre-wrap">{message.text}</p>
            )}
            {message.shared && <SharedCard shared={message.shared} />}
            {message.attachments.length > 0 && (
              <ul className="flex flex-col gap-1">
                {message.attachments.map((attachment) => (
                  <li key={attachment.id}>
                    <AttachmentLink attachment={attachment} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <span className="flex items-center justify-end gap-1.5 font-mono text-title text-secondary">
          {message.editedAt && !message.deleted && <span>{t('messaging.thread.edited')}</span>}
          <time dateTime={message.sentAt}>{time}</time>
          {message.readByAll !== null && !message.deleted && (
            <ReadReceipt read={message.readByAll} />
          )}
        </span>
      </div>
      {own && !message.deleted && !editing && (
        <span
          role="group"
          aria-label={t('messaging.thread.actions', { time })}
          className="flex gap-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:transition-opacity"
        >
          {message.editable && (
            <Button
              variant="link"
              onClick={() => {
                setDraft(message.text)
                setEditing(true)
              }}
            >
              {t('messaging.thread.edit')}
            </Button>
          )}
          <Button variant="link" onClick={() => setDeleting(true)}>
            {t('messaging.thread.delete')}
          </Button>
        </span>
      )}
      {deleting && (
        <ConfirmDialog
          open
          title={t('messaging.thread.deleteTitle')}
          message={t('messaging.thread.deleteMessage')}
          confirmLabel={t('messaging.thread.delete')}
          tone="danger"
          busy={remove.isPending}
          onConfirm={() =>
            remove.mutate(message.id, {
              onSuccess: () => setDeleting(false),
              onError: (error) => toast.error(error.message),
            })
          }
          onClose={() => setDeleting(false)}
        />
      )}
    </li>
  )
}
