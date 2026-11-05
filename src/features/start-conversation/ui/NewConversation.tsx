import { Plus, Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GROUP_MAX_MEMBERS,
  GROUP_TITLE_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  useStartConversation,
} from '@/entities/conversation'
import { AccountTypeBadge, useDirectory } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import type { DirectoryEntryDto } from '@/shared/api/contracts'
import { Dialog, DialogBody, DialogFooter } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/form/Button'
import { Field } from '@/shared/ui/form/Field'
import { Textarea } from '@/shared/ui/form/Textarea'
import { TextInput } from '@/shared/ui/form/TextInput'
import { toast } from '@/shared/ui/toast'

/** Where the dialog leads: a new direct conversation to write, or the group it created. */
export type NewConversationTarget = { to: string } | { conversationId: string }

/**
 * "+ NEW" of the conversations (screen 11): one person opens a conversation with them; several
 * make a group, named, of the people the user may write to at once (spec section 15).
 */
export function NewConversation({ onOpen }: { onOpen: (target: NewConversationTarget) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('messaging.conversations.newLabel')}
        className="panel-no-drag inline-flex items-center gap-1 uppercase hover:text-primary"
      >
        <Plus aria-hidden className="size-3" />
        {t('messaging.conversations.new')}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t('messaging.newConversation.title')}
        width={560}
      >
        {open && (
          <NewConversationForm
            onClose={() => setOpen(false)}
            onOpen={(target) => {
              setOpen(false)
              onOpen(target)
            }}
          />
        )}
      </Dialog>
    </>
  )
}

function NewConversationForm({
  onClose,
  onOpen,
}: {
  onClose: () => void
  onOpen: (target: NewConversationTarget) => void
}) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const [q, setQ] = useState('')
  const [chosen, setChosen] = useState<DirectoryEntryDto[]>([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const start = useStartConversation()
  const found = useDirectory({ q: q.trim() || undefined, contactable: true, page: 1, pageSize: 8 })
  const people = (found.data?.items ?? []).filter(
    (entry) => entry.userId !== user.id && !chosen.some((person) => person.userId === entry.userId),
  )
  const group = chosen.length > 1
  const needRequest = group && chosen.some((person) => person.contactMode !== 'direct')
  const titleError =
    submitted && group && !title.trim() ? t('network.profile.errors.required') : null

  const submit = () => {
    setSubmitted(true)
    if (chosen.length === 0) return
    if (!group) {
      onOpen({ to: chosen[0].userId })
      return
    }
    if (needRequest || !title.trim() || !text.trim()) return
    start.mutate(
      {
        participantIds: chosen.map((person) => person.userId),
        title: title.trim(),
        message: { text: text.trim() },
      },
      {
        onSuccess: (conversation) => {
          toast.success(t('messaging.newConversation.created'))
          onOpen({ conversationId: conversation.id })
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
        <TextInput
          type="search"
          icon={Search}
          value={q}
          onChange={setQ}
          placeholder={t('messaging.newConversation.search')}
          aria-label={t('messaging.newConversation.people')}
        />
        {chosen.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t('messaging.newConversation.people')}>
            {chosen.map((person) => (
              <li
                key={person.userId}
                className="inline-flex items-center gap-1.5 border px-2 py-0.5 font-sans text-data"
              >
                {person.displayName}
                <button
                  type="button"
                  aria-label={t('messaging.newConversation.remove', { name: person.displayName })}
                  onClick={() =>
                    setChosen((current) => current.filter((item) => item.userId !== person.userId))
                  }
                  className="flex size-5 items-center justify-center text-secondary hover:text-primary"
                >
                  <X aria-hidden className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <ul className="flex max-h-56 flex-col overflow-y-auto border">
          {people.length === 0 ? (
            <li className="px-2 py-2 font-sans text-data text-secondary">
              {t('messaging.newConversation.noPeople')}
            </li>
          ) : (
            people.map((person) => (
              <li key={person.userId}>
                <button
                  type="button"
                  aria-label={t('messaging.newConversation.add', { name: person.displayName })}
                  disabled={chosen.length + 1 >= GROUP_MAX_MEMBERS}
                  onClick={() => setChosen((current) => [...current, person])}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left hover:bg-panel-header disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate font-sans text-label">
                    {person.displayName}
                    <span className="ml-2 text-data text-secondary">{person.jobTitle}</span>
                  </span>
                  {person.contactMode === 'request' && (
                    <span className="font-sans text-title text-accent-amber">
                      {t('messaging.newConversation.requestFirst')}
                    </span>
                  )}
                  <AccountTypeBadge type={person.accountType} />
                </button>
              </li>
            ))
          )}
        </ul>
        {group && (
          <>
            <p className="font-sans text-data text-secondary">
              {t('messaging.newConversation.groupHint', { max: GROUP_MAX_MEMBERS })}
            </p>
            {needRequest && (
              <p role="alert" className="font-sans text-data text-down">
                {t('messaging.composer.errors.contactNotOpen')}
              </p>
            )}
            <Field label={t('messaging.newConversation.groupName')} error={titleError}>
              <TextInput value={title} onChange={setTitle} maxLength={GROUP_TITLE_MAX_LENGTH} />
            </Field>
            <Field label={t('messaging.newConversation.message')}>
              <Textarea value={text} onChange={setText} rows={3} maxLength={MESSAGE_MAX_LENGTH} />
            </Field>
          </>
        )}
        {start.error && (
          <p role="alert" className="font-sans text-data text-down">
            {start.error.message}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          type="submit"
          variant="primary"
          busy={start.isPending}
          disabled={chosen.length === 0 || needRequest || (group && !text.trim())}
        >
          {group ? t('messaging.newConversation.create') : t('messaging.newConversation.next')}
        </Button>
      </DialogFooter>
    </form>
  )
}
