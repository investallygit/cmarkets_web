import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { VerifiedBadge } from '@/entities/account'
import {
  GROUP_MAX_MEMBERS,
  useConversation,
  useGroupMember,
  useMuteConversation,
} from '@/entities/conversation'
import {
  AccountTypeBadge,
  initialsOf,
  ProfileAvatar,
  useDirectory,
  useProfile,
} from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import { BlockButton } from '@/features/block-user'
import { ReportConversation } from '@/features/report-conversation'
import type { ConversationDto, ConversationMemberDto } from '@/shared/api/contracts'
import { analystPublicationsPath, directoryPath } from '@/shared/routes/paths'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Button, ButtonLink } from '@/shared/ui/form/Button'
import { TextInput } from '@/shared/ui/form/TextInput'
import { Panel } from '@/shared/ui/Panel'
import { PanelEmpty, PanelLoading } from '@/shared/ui/StatusViews'
import { toast } from '@/shared/ui/toast'
import { AttachmentLink } from './AttachmentLink'

const SECTION_TITLE =
  'font-sans text-title font-semibold tracking-title text-accent-amber uppercase'

type Person = Pick<
  ConversationMemberDto,
  | 'userId'
  | 'displayName'
  | 'accountType'
  | 'photoUrl'
  | 'verified'
  | 'jobTitle'
  | 'organization'
  | 'city'
  | 'country'
  | 'analystId'
>

/** The person written to, as screen 11 sums them up, and the links to their profile and notes. */
function MiniProfile({ person }: { person: Person }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <ProfileAvatar
        name={person.displayName}
        type={person.accountType}
        photoUrl={person.photoUrl}
        size="lg"
      />
      <h3 className="font-sans text-figure font-semibold">{person.displayName}</h3>
      <span className="flex flex-wrap justify-center gap-1.5">
        <AccountTypeBadge type={person.accountType} />
        {person.verified && <VerifiedBadge />}
      </span>
      {person.jobTitle && <p className="font-sans text-label text-secondary">{person.jobTitle}</p>}
      <p className="font-sans text-data text-secondary">
        {[person.organization, [person.city, person.country].filter(Boolean).join(', ')]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="mt-2 flex w-full flex-col gap-2">
        <ButtonLink to={directoryPath(person.userId)} variant="secondary" size="lg">
          {t('messaging.participant.viewProfile')}
        </ButtonLink>
        {person.analystId && (
          <ButtonLink to={analystPublicationsPath(person.analystId)} variant="info" size="lg">
            {t('messaging.participant.publications')}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}

/** The files of the conversation, the newest first, then where the messages are kept. */
function Files({ conversation }: { conversation: ConversationDto }) {
  const { t } = useTranslation()
  return (
    <>
      <section className="flex flex-col gap-1.5">
        <h3 className={SECTION_TITLE}>{t('messaging.participant.files')}</h3>
        {conversation.files.length === 0 ? (
          <p className="font-sans text-data text-secondary">{t('messaging.participant.noFiles')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversation.files.map((file) => (
              <li key={file.id}>
                <AttachmentLink attachment={file} showDate />
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-auto font-sans text-title text-secondary">
        {t('messaging.participant.privacy')}
      </p>
    </>
  )
}

function MuteButton({ conversation }: { conversation: ConversationDto }) {
  const { t } = useTranslation()
  const mute = useMuteConversation(conversation.id)
  return (
    <Button
      size="lg"
      aria-pressed={conversation.muted}
      busy={mute.isPending}
      onClick={() =>
        mute.mutate(!conversation.muted, {
          onSuccess: () =>
            toast.info(
              conversation.muted
                ? t('messaging.participant.unmuted')
                : t('messaging.participant.muted'),
            ),
        })
      }
    >
      {conversation.muted ? t('messaging.participant.unmute') : t('messaging.participant.mute')}
    </Button>
  )
}

/** The creator adds the people they may write to at once, up to 50 members. */
function AddMember({ conversation }: { conversation: ConversationDto }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const found = useDirectory({ q: q.trim() || undefined, contactable: true, page: 1, pageSize: 6 })
  const member = useGroupMember(conversation.id)
  const members = new Set(conversation.members.map((person) => person.userId))
  const people = (found.data?.items ?? []).filter(
    (person) => !members.has(person.userId) && person.contactMode === 'direct',
  )
  return (
    <div className="flex flex-col gap-1.5">
      <TextInput
        type="search"
        icon={Search}
        value={q}
        onChange={setQ}
        placeholder={t('messaging.newConversation.search')}
        aria-label={t('messaging.participant.addMemberTitle', { name: conversation.title })}
      />
      <ul className="flex flex-col">
        {people.map((person) => (
          <li key={person.userId}>
            <button
              type="button"
              disabled={member.isPending || conversation.memberCount >= GROUP_MAX_MEMBERS}
              aria-label={t('messaging.newConversation.add', { name: person.displayName })}
              onClick={() =>
                member.mutate(
                  { userId: person.userId, add: true },
                  { onError: (error) => toast.error(error.message) },
                )
              }
              className="flex w-full items-center gap-2 px-1 py-1 text-left hover:bg-panel-header disabled:opacity-50"
            >
              <span className="min-w-0 flex-1 truncate font-sans text-label">
                {person.displayName}
              </span>
              <AccountTypeBadge type={person.accountType} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GroupDetails({
  conversation,
  onLeft,
}: {
  conversation: ConversationDto
  onLeft: () => void
}) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const member = useGroupMember(conversation.id)
  const [adding, setAdding] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const creator = conversation.createdBy === user.id
  const open = conversation.state !== 'closed'
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden
          className="flex size-20 items-center justify-center rounded-full border-[3px] border-info bg-app font-sans text-[28px] font-semibold text-info"
        >
          {initialsOf(conversation.title)}
        </span>
        <h3 className="font-sans text-figure font-semibold">{conversation.title}</h3>
        <p className="font-sans text-data text-secondary">
          {t('messaging.thread.members', { count: conversation.memberCount })}
        </p>
      </div>
      <section className="flex flex-col gap-1.5">
        <h3 className={SECTION_TITLE}>{t('messaging.participant.members')}</h3>
        <ul className="flex flex-col gap-1">
          {conversation.members.map((person) => (
            <li key={person.userId} className="flex items-center gap-2">
              <ProfileAvatar
                name={person.displayName}
                type={person.accountType}
                photoUrl={person.photoUrl}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate font-sans text-label">
                {person.displayName}
                {person.userId === conversation.createdBy && (
                  <span className="ml-1.5 text-data text-secondary">
                    {t('messaging.participant.creator')}
                  </span>
                )}
              </span>
              <AccountTypeBadge type={person.accountType} />
              {creator && open && person.userId !== user.id && (
                <button
                  type="button"
                  aria-label={t('messaging.participant.removeMember', { name: person.displayName })}
                  onClick={() =>
                    member.mutate(
                      { userId: person.userId, add: false },
                      { onError: (error) => toast.error(error.message) },
                    )
                  }
                  className="flex size-6 items-center justify-center text-secondary hover:text-down"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {creator && open && (
          <>
            <Button size="md" aria-expanded={adding} onClick={() => setAdding((value) => !value)}>
              {t('messaging.participant.addMember')}
            </Button>
            {adding && <AddMember conversation={conversation} />}
          </>
        )}
      </section>
      {open && (
        <div className="flex flex-col gap-2">
          <MuteButton conversation={conversation} />
          <Button variant="danger" size="lg" onClick={() => setLeaving(true)}>
            {t('messaging.participant.leave')}
          </Button>
          <ReportConversation conversationId={conversation.id} className="w-full" />
        </div>
      )}
      <Files conversation={conversation} />
      {leaving && (
        <ConfirmDialog
          open
          title={t('messaging.participant.leaveTitle', { name: conversation.title })}
          message={t('messaging.participant.leaveMessage')}
          confirmLabel={t('messaging.participant.leave')}
          tone="danger"
          busy={member.isPending}
          onConfirm={() =>
            member.mutate(
              { userId: user.id, add: false },
              {
                onSuccess: () => {
                  setLeaving(false)
                  onLeft()
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }
          onClose={() => setLeaving(false)}
        />
      )}
    </>
  )
}

function DirectDetails({ conversation }: { conversation: ConversationDto }) {
  const person = conversation.counterpart
  if (!person) return null
  return (
    <>
      <MiniProfile person={person} />
      <div className="flex flex-col gap-2">
        <MuteButton conversation={conversation} />
        <BlockButton
          userId={person.userId}
          displayName={person.displayName}
          blocked={conversation.blocked === 'byMe'}
          className="w-full"
        />
        <ReportConversation conversationId={conversation.id} className="w-full" />
      </div>
      <Files conversation={conversation} />
    </>
  )
}

/** The person a new conversation starts with, before its first message. */
function Recipient({ userId }: { userId: string }) {
  const profile = useProfile(userId)
  if (!profile.data) return <PanelLoading />
  return <MiniProfile person={{ ...profile.data, analystId: profile.data.analystId }} />
}

/**
 * MSG, right (spec section 9, screen 11): the person written to and the links to their profile
 * and notes, mute, block, report, the files shared; a group's members instead.
 */
export function ParticipantPanel({
  conversationId,
  to,
  onLeft,
}: {
  conversationId: string | null
  to: string | null
  onLeft: () => void
}) {
  const { t } = useTranslation()
  const details = useConversation(conversationId)
  const conversation = details.data
  return (
    <Panel title={t('panels.participant')} code="NET">
      <div className="flex min-h-full flex-col gap-4 p-3">
        {conversation ? (
          conversation.kind === 'group' ? (
            <GroupDetails conversation={conversation} onLeft={onLeft} />
          ) : (
            <DirectDetails conversation={conversation} />
          )
        ) : to && !conversationId ? (
          <Recipient userId={to} />
        ) : conversationId && details.isError ? (
          <PanelEmpty message={t('messaging.thread.notFound')} />
        ) : conversationId ? (
          <PanelLoading />
        ) : (
          <PanelEmpty message={t('messaging.thread.select')} />
        )}
      </div>
    </Panel>
  )
}
