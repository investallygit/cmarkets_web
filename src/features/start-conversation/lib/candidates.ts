import type {
  AccountType,
  ContactMode,
  DirectoryEntryDto,
  MessagingContactDto,
} from '@/shared/api/contracts'

/** Someone "+ NEW" offers: a card of the directory, or a contact an SVT link gives. */
export interface Candidate {
  userId: string
  displayName: string
  /** A card's job title; a contact's organisation (an SVT's bank). */
  detail: string
  accountType: AccountType
  contactMode: ContactMode
}

/** Without accents nor case: "Tchakounté" is found by "tchakounte". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en')

/**
 * The people "+ NEW" offers for a search (ROADMAP decision 16): first the contacts an SVT link
 * gives, whom the directory does not list, those the user still reaches whose name or organisation
 * holds the search; then the directory's cards, which the API searched, each person once.
 */
export function candidatesOf(
  contacts: readonly MessagingContactDto[],
  cards: readonly DirectoryEntryDto[],
  q: string,
): Candidate[] {
  const search = fold(q.trim())
  const linked: Candidate[] = contacts
    .filter((contact) => contact.contactMode !== 'none')
    .filter(
      (contact) =>
        !search ||
        fold(contact.displayName).includes(search) ||
        fold(contact.organization).includes(search),
    )
    .map((contact) => ({
      userId: contact.userId,
      displayName: contact.displayName,
      detail: contact.organization,
      accountType: contact.accountType,
      contactMode: contact.contactMode,
    }))
  const seen = new Set(linked.map((person) => person.userId))
  return [
    ...linked,
    ...cards
      .filter((card) => !seen.has(card.userId))
      .map((card) => ({
        userId: card.userId,
        displayName: card.displayName,
        detail: card.jobTitle,
        accountType: card.accountType,
        contactMode: card.contactMode,
      })),
  ]
}

/**
 * Whether one more person may join those chosen: up to a group's members, and an SVT one to one
 * (it writes to each linked trader on their own): with an SVT chosen, or for an SVT, nobody more.
 */
export function mayAdd(
  chosen: readonly Pick<Candidate, 'accountType'>[],
  person: Pick<Candidate, 'accountType'>,
  user: { accountType: AccountType },
  maxMembers: number,
): boolean {
  if (chosen.length + 1 >= maxMembers) return false
  if (chosen.length === 0) return true
  return (
    user.accountType !== 'svt' &&
    person.accountType !== 'svt' &&
    !chosen.some((one) => one.accountType === 'svt')
  )
}
