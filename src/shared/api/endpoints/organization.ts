import type {
  MemberInviteDto,
  MemberUpdateDto,
  OrganizationDto,
  OrganizationMemberDto,
} from '../contracts'
import { answer, route, send } from './define'

/** CMarket.Api/Controllers/Organization: the user's organisation and its members. */
export const organizationRoutes = {
  current: route('GET', '/organization', answer<OrganizationDto>()),
  members: route('GET', '/organization/members', answer<OrganizationMemberDto[]>()),
  invite: route('POST', '/organization/members', answer<OrganizationMemberDto>()),
  updateMember: route('PUT', '/organization/members/{id}', answer<OrganizationMemberDto>()),
  removeMember: route('DELETE', '/organization/members/{id}'),
}

export const organizationApi = {
  /** 404 for an individual account. */
  current: (signal?: AbortSignal) => send(organizationRoutes.current, { signal }),
  /** The members, then the invitations not yet accepted. */
  members: (signal?: AbortSignal) => send(organizationRoutes.members, { signal }),
  /** An invitation by e-mail. */
  invite: (invite: MemberInviteDto) => send(organizationRoutes.invite, { body: invite }),
  /** Administrator or member. */
  updateMember: (id: string, update: MemberUpdateDto) =>
    send(organizationRoutes.updateMember, { params: { id }, body: update }),
  /** A member leaves, or an invitation is withdrawn. */
  removeMember: (id: string) => send(organizationRoutes.removeMember, { params: { id } }),
}
