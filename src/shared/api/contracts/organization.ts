import type { IsoDateTime } from './common'
import type { AccountType } from './me'

/** Administrators invite and remove members and manage the organisation's subscription. */
export type OrganizationRole = 'admin' | 'member'

/** GET /organization: 404 for an individual account. */
export interface OrganizationDto {
  id: string
  name: string
  createdAt: IsoDateTime
  memberCount: number
  myRole: OrganizationRole
}

export type MemberStatus = 'active' | 'invited'

/** GET /organization/members: the members, then the invitations not yet accepted. */
export interface OrganizationMemberDto {
  /** The user's id, or the invitation's while it waits. */
  id: string
  displayName: string | null
  email: string
  accountType: AccountType | null
  role: OrganizationRole
  status: MemberStatus
  /** Joined, or invited, at. */
  since: IsoDateTime
  isSelf: boolean
}

/** POST /organization/members: an invitation sent by e-mail. */
export interface MemberInviteDto {
  email: string
  role: OrganizationRole
}

/** PUT /organization/members/{userId} */
export interface MemberUpdateDto {
  role: OrganizationRole
}
