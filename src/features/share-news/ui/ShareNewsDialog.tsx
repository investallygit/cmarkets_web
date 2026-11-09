import { clsx } from 'clsx'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { MESSAGE_MAX_LENGTH, useConversations, useSendMessage } from '@/entities/conversation'
import { isApiError } from '@/shared/api'
import type { ConversationSummaryDto } from '@/shared/api/contracts'
import { routes } from '@/shared/routes/paths'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { openConversations } from '../lib/conversations'
import type { SharedArticle } from '../model/types'

interface ShareNewsDialogProps {
  article: SharedArticle
  open: boolean
  onClose: () => void
}

/**
 * "Share this news item": the article sent as a card to one of the member's open conversations,
 * with a few words if they like. The card opens the article at its address (spec section 9,
 * screen 11, where CMarket objects are shared).
 */
export function ShareNewsDialog({ article, open, onClose }: ShareNewsDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onClose={onClose} title={t('news.share.title')} width={520}>
      {open && <ShareNewsForm article={article} onClose={onClose} />}
    </Dialog>
  )
}

function ShareNewsForm({ article, onClose }: Omit<ShareNewsDialogProps, 'open'>) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<ConversationSummaryDto | null>(null)
  const [note, setNote] = useState('')
  const conversations = useConversations('all')
  const send = useSendMessage(chosen?.id ?? '')
  const writable = openConversations(conversations.data ?? [], '')
  const shown = openConversations(conversations.data ?? [], q)

  const submit = () => {
    if (!chosen || send.isPending) return
    send.mutate(
      { text: note.trim(), shared: { type: 'news', newsId: article.id } },
      {
        onSuccess: () => {
          toast.success(t('news.share.sent', { name: chosen.title }))
          onClose()
        },
      },
    )
  }

  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <DialogBody>
        <p className="border-l-2 border-accent-amber pl-2 font-sans text-label font-semibold">
          {article.headline}
        </p>
        <TextInput
          type="search"
          icon={Search}
          value={q}
          onChange={setQ}
          placeholder={t('news.share.search')}
          aria-label={t('news.share.search')}
        />
        {conversations.isPending ? (
          <PanelLoading />
        ) : writable.length === 0 ? (
          <p className="font-sans text-data text-secondary">
            {t('news.share.none')}{' '}
            <Link to={routes.messages} onClick={onClose} className="text-info underline">
              {t('news.share.openMsg')}
            </Link>
          </p>
        ) : shown.length === 0 ? (
          <p className="font-sans text-data text-secondary">{t('news.share.noMatch')}</p>
        ) : (
          <ul
            aria-label={t('news.share.conversations')}
            className="flex max-h-56 flex-col overflow-y-auto border"
          >
            {shown.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  aria-pressed={chosen?.id === conversation.id}
                  onClick={() => setChosen(conversation)}
                  className={clsx(
                    'flex w-full items-baseline gap-3 border-l-2 px-2 py-1.5 text-left',
                    chosen?.id === conversation.id
                      ? 'border-accent-amber bg-selected'
                      : 'border-transparent hover:bg-panel-header',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-sans text-label">
                    {conversation.title}
                  </span>
                  {conversation.counterpart && (
                    <span className="shrink-0 font-sans text-data text-secondary">
                      {t(`accountTypes.${conversation.counterpart.accountType}`)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Field label={t('news.share.note')}>
          <Textarea value={note} onChange={setNote} rows={3} maxLength={MESSAGE_MAX_LENGTH} />
        </Field>
        {send.error && (
          <p role="alert" className="font-sans text-data text-down">
            {isApiError(send.error, 403) ? t('news.share.closed') : send.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" busy={send.isPending} disabled={!chosen}>
          {t('news.share.send')}
        </Button>
      </DialogFooter>
    </form>
  )
}
