import {
  CLIENT_ACCOUNT_TYPES,
  type AccountType,
  type ClientAccountType,
  type ContactMode,
  type ContactRules,
  type ProfileVisibility,
} from '@/shared/api/contracts'

/**
 * Who may write to whom in the messaging (spec section 15): the rules each user sets for the six
 * client types, and what overrides them.
 */

/** Direct for every type but the Student, whose first message is a request; the Admin's to set. */
export const DEFAULT_CONTACT_RULES: ContactRules = {
  student: 'request',
  analyst: 'direct',
  manager: 'direct',
  trader: 'direct',
  journalist: 'direct',
  ceo: 'direct',
}

export const isClientType = (type: AccountType): type is ClientAccountType =>
  CLIENT_ACCOUNT_TYPES.some((client) => client === type)

export interface ContactParty {
  userId: string
  accountType: AccountType
  /**
   * May use the messaging: the type has messages:write and, for an Analyst, a Journalist or a
   * CEO, an Admin approved the status.
   */
  messaging: boolean
}

export interface ContactSituation {
  sender: ContactParty
  recipient: ContactParty & { visibility: ProfileVisibility; contactRules: ContactRules }
  /** One of the two blocked the other. */
  blocked: boolean
  /** The two already have a conversation. */
  conversationOpen: boolean
}

/**
 * How the sender may reach the recipient: a block overrides every rule; CMarket employees write
 * to nobody and nobody writes to them, nor does a client still waiting for an Admin's approval;
 * a conversation already open stays open whatever the rules became; a hidden profile is reached
 * through such a conversation only; otherwise the rule the recipient set for the sender's type.
 */
export function contactMode({
  sender,
  recipient,
  blocked,
  conversationOpen,
}: ContactSituation): ContactMode {
  if (sender.userId === recipient.userId || blocked) return 'none'
  if (!isClientType(sender.accountType) || !isClientType(recipient.accountType)) return 'none'
  if (!sender.messaging || !recipient.messaging) return 'none'
  if (conversationOpen) return 'direct'
  if (recipient.visibility === 'hidden') return 'none'
  return recipient.contactRules[sender.accountType]
}
