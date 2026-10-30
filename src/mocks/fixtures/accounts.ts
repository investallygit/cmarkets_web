import type {
  AccountType,
  AnalystStatus,
  OrganizationRole,
  OtpChannel,
  SignUpDocument,
  UserLanguage,
} from '@/shared/api/contracts'
import { DEMO_USERS } from './users'

/** Password of every demo account, shown on the login page of the prototype. */
export const DEMO_PASSWORD = 'cmarket2026'
export const DEMO_SALT = 'demo'
/** SHA-256 of the demo salt and password (checked by fixtures/accounts.test.ts). */
export const DEMO_PASSWORD_HASH = '872440e201a0c656f4d351f70e57a37ebb58205d50cd20e24c511360abecf8fc'

export interface StoredAccount {
  id: string
  email: string
  salt: string
  passwordHash: string
  displayName: string
  accountType: AccountType
  organizationId: string | null
  organizationRole: OrganizationRole | null
  language: UserLanguage
  timeZone: string
  phone: string | null
  twoFactorChannel: OtpChannel
  analystStatus: AnalystStatus | null
  status: 'active' | 'suspended'
  createdAt: string
  /** What a sign-up sent: proof of enrolment, identity document, CV, licence. */
  documents: { kind: SignUpDocument; fileName: string; size: number }[]
  failedLogins: number
  /** Time (ms) until which a login is refused after too many wrong passwords. */
  lockedUntil: number | null
}

export interface StoredOrganization {
  id: string
  name: string
  createdAt: string
}

export interface StoredInvitation {
  id: string
  organizationId: string
  email: string
  role: OrganizationRole
  invitedAt: string
}

export const ORGANIZATION_FIXTURES: StoredOrganization[] = [
  { id: 'org-university', name: 'University B', createdAt: '2025-09-01T08:00:00Z' },
  { id: 'org-am', name: 'Asset manager A', createdAt: '2025-05-12T08:00:00Z' },
  { id: 'org-bank', name: 'Bank C', createdAt: '2026-03-01T08:00:00Z' },
  { id: 'org-cmarket', name: 'CMarket', createdAt: '2025-01-01T08:00:00Z' },
]

type Seed = Pick<StoredAccount, 'id' | 'email' | 'displayName' | 'accountType'> &
  Partial<StoredAccount>

const demo = (accountType: AccountType, seed: Partial<StoredAccount>): Seed => {
  const { id, email, displayName, organization } = DEMO_USERS[accountType]
  return { id, email, displayName, accountType, organizationId: organization?.id ?? null, ...seed }
}

// The six demo users of the account switch, then colleagues in their organisations, who log in
// with the same password.
// prettier-ignore
const SEEDS: Seed[] = [
  demo('student', { organizationRole: 'member', phone: '+237 6 90 33 12 07', createdAt: '2025-09-15T09:12:00Z' }),
  demo('analyst', { phone: '+237 6 77 41 20 18', createdAt: '2024-11-04T10:30:00Z' }),
  demo('manager', { organizationRole: 'admin', phone: '+237 6 99 05 61 44', createdAt: '2025-05-12T08:05:00Z' }),
  demo('trader', { organizationRole: 'admin', phone: '+241 06 12 34 56', twoFactorChannel: 'sms', createdAt: '2026-03-01T08:10:00Z' }),
  demo('dataAdmin', { organizationRole: 'member', createdAt: '2025-01-02T08:00:00Z' }),
  demo('admin', { organizationRole: 'admin', createdAt: '2025-01-01T08:00:00Z' }),
  { id: 'user-nkoulou', email: 'e.nkoulou@university.example', displayName: 'E. Nkoulou', accountType: 'student', organizationId: 'org-university', organizationRole: 'admin', createdAt: '2025-09-01T08:30:00Z' },
  { id: 'user-fouda', email: 'a.fouda@university.example', displayName: 'A. Fouda', accountType: 'student', organizationId: 'org-university', organizationRole: 'member', createdAt: '2025-09-16T11:00:00Z' },
  { id: 'user-eyinga', email: 'b.eyinga@university.example', displayName: 'B. Eyinga', accountType: 'student', organizationId: 'org-university', organizationRole: 'member', createdAt: '2025-10-02T14:20:00Z' },
  { id: 'user-ngono', email: 'm.ngono@asset-manager.example', displayName: 'M. Ngono', accountType: 'manager', organizationId: 'org-am', organizationRole: 'member', createdAt: '2025-06-03T09:00:00Z' },
  { id: 'user-abena', email: 'c.abena@asset-manager.example', displayName: 'C. Abena', accountType: 'manager', organizationId: 'org-am', organizationRole: 'member', createdAt: '2026-02-09T09:00:00Z' },
  { id: 'user-ella', email: 'l.ella@bank.example', displayName: 'L. Ella', accountType: 'trader', organizationId: 'org-bank', organizationRole: 'member', createdAt: '2026-03-02T08:00:00Z' },
  { id: 'user-mba', email: 'f.mba@bank.example', displayName: 'F. Mba', accountType: 'trader', organizationId: 'org-bank', organizationRole: 'member', createdAt: '2026-04-20T08:00:00Z' },
]

export function createAccounts(): StoredAccount[] {
  return SEEDS.map((seed) => ({
    salt: DEMO_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    organizationId: null,
    organizationRole: null,
    language: 'en',
    timeZone: 'Africa/Douala',
    phone: null,
    twoFactorChannel: 'email',
    analystStatus: seed.accountType === 'analyst' ? 'approved' : null,
    status: 'active',
    createdAt: '2025-01-01T08:00:00Z',
    documents: [],
    failedLogins: 0,
    lockedUntil: null,
    ...seed,
  }))
}

export const INVITATION_FIXTURES: StoredInvitation[] = [
  {
    id: 'invitation-tchoua',
    organizationId: 'org-am',
    email: 'r.tchoua@asset-manager.example',
    role: 'member',
    invitedAt: '2026-10-27T15:40:00Z',
  },
  {
    id: 'invitation-biyong',
    organizationId: 'org-university',
    email: 'j.biyong@university.example',
    role: 'member',
    invitedAt: '2026-10-21T10:05:00Z',
  },
]
