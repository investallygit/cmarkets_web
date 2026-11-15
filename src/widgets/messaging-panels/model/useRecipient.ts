import { useMessagingContacts } from '@/entities/conversation'
import { useContactPermission, useProfile } from '@/entities/profile'
import { useCurrentUser } from '@/entities/session'
import type { ConversationMemberDto, ContactMode } from '@/shared/api/contracts'

/** The person as MSG's panels show them before the first message: a member's card, offline. */
export type RecipientCard = Omit<ConversationMemberDto, 'online'>

export type Recipient =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'unknown' }
  | { status: 'ready'; person: RecipientCard; mode: ContactMode }

/**
 * The person a new conversation starts with (?to=): a contact an SVT link gives (ROADMAP decision
 * 16), whom the directory does not list, with the bank or the trader's organisation; otherwise a
 * profile of the directory and the contact its owner allows, for a user who reads profiles. An SVT
 * reads none: anyone but its linked traders is unknown to it.
 */
export function useRecipient(to: string | null): Recipient {
  const user = useCurrentUser()
  const contacts = useMessagingContacts({ enabled: Boolean(to) })
  const contact = to ? contacts.data?.find((row) => row.userId === to) : undefined
  const readsProfiles = user.permissions.includes('directory:profile')
  const fromDirectory = Boolean(to) && contacts.isFetched && !contact && readsProfiles
  const profile = useProfile(fromDirectory ? to : null)
  const permission = useContactPermission(fromDirectory ? to : null)

  if (!to || !contacts.isFetched) return { status: 'loading' }
  if (contact) {
    return {
      status: 'ready',
      mode: contact.contactMode,
      person: {
        userId: contact.userId,
        displayName: contact.displayName,
        accountType: contact.accountType,
        photoUrl: null,
        verified: false,
        jobTitle: '',
        organization: contact.organization,
        city: '',
        country: '',
        analystId: null,
      },
    }
  }
  if (!readsProfiles) return { status: 'unknown' }
  if (profile.isError) return { status: 'error', error: profile.error }
  if (!profile.data || !permission.data) return { status: 'loading' }
  return {
    status: 'ready',
    mode: permission.data.mode,
    person: { ...profile.data, analystId: profile.data.analystId },
  }
}
