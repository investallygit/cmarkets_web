import type {
  AccountType,
  AdminDecisionDto,
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
  lastLoginAt: string | null
  /** The Admin who approved or rejected the Analyst status. */
  analystDecision: AdminDecisionDto | null
  /** Who suspended the account, when and why. */
  suspension: AdminDecisionDto | null
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
  // Opened by the sign-ups of two Analysts waiting for the approval of an Admin (screen 9).
  { id: 'org-brokerage-d', name: 'Brokerage firm D', createdAt: '2026-10-26T14:10:00Z' },
  { id: 'org-bank-e', name: 'Bank E', createdAt: '2026-10-22T16:05:00Z' },
]

type Seed = Pick<StoredAccount, 'id' | 'email' | 'displayName' | 'accountType'> &
  Partial<StoredAccount> & {
    /** The latest login, so many hours before the prototype starts. */
    loginHoursAgo?: number
  }

const ADMIN = 'L. Mvogo'

/** An Analyst approved two days after the sign-up. */
const approved = (createdAt: string): Partial<StoredAccount> => ({
  createdAt,
  analystStatus: 'approved',
  analystDecision: {
    at: new Date(Date.parse(createdAt) + 2 * 86_400_000).toISOString(),
    by: ADMIN,
    reason: null,
  },
})

const document = (kind: SignUpDocument, fileName: string, size: number) => ({
  kind,
  fileName,
  size,
})

const demo = (
  accountType: AccountType,
  seed: Omit<Seed, 'id' | 'email' | 'displayName' | 'accountType'>,
): Seed => {
  const { id, email, displayName, organization } = DEMO_USERS[accountType]
  return { id, email, displayName, accountType, organizationId: organization?.id ?? null, ...seed }
}

// The six demo users of the account switch, then colleagues in their organisations, who log in
// with the same password, and the accounts of the screen 9 mockup.
// prettier-ignore
const SEEDS: Seed[] = [
  demo('student', { organizationRole: 'member', phone: '+237 6 90 33 12 07', createdAt: '2025-09-15T09:12:00Z', loginHoursAgo: 26 }),
  demo('analyst', { phone: '+237 6 77 41 20 18', ...approved('2024-11-04T10:30:00Z'), loginHoursAgo: 2 }),
  demo('manager', { organizationRole: 'admin', phone: '+237 6 99 05 61 44', createdAt: '2025-05-12T08:05:00Z', loginHoursAgo: 3 }),
  demo('trader', { organizationRole: 'admin', phone: '+241 06 12 34 56', twoFactorChannel: 'sms', timeZone: 'Africa/Libreville', createdAt: '2026-03-01T08:10:00Z', loginHoursAgo: 4 }),
  demo('dataAdmin', { organizationRole: 'member', createdAt: '2025-01-02T08:00:00Z', loginHoursAgo: 1 }),
  demo('admin', { organizationRole: 'admin', createdAt: '2025-01-01T08:00:00Z', loginHoursAgo: 0.5 }),
  { id: 'user-nkoulou', email: 'e.nkoulou@university.example', displayName: 'E. Nkoulou', accountType: 'student', organizationId: 'org-university', organizationRole: 'admin', createdAt: '2025-09-01T08:30:00Z', loginHoursAgo: 50 },
  { id: 'user-fouda', email: 'a.fouda@university.example', displayName: 'A. Fouda', accountType: 'student', organizationId: 'org-university', organizationRole: 'member', createdAt: '2025-09-16T11:00:00Z', loginHoursAgo: 75 },
  { id: 'user-eyinga', email: 'b.eyinga@university.example', displayName: 'B. Eyinga', accountType: 'student', organizationId: 'org-university', organizationRole: 'member', createdAt: '2025-10-02T14:20:00Z', loginHoursAgo: 190 },
  { id: 'user-ngono', email: 'm.ngono@asset-manager.example', displayName: 'M. Ngono', accountType: 'manager', organizationId: 'org-am', organizationRole: 'member', createdAt: '2025-06-03T09:00:00Z', loginHoursAgo: 28 },
  { id: 'user-abena', email: 'c.abena@asset-manager.example', displayName: 'C. Abena', accountType: 'manager', organizationId: 'org-am', organizationRole: 'member', createdAt: '2026-02-09T09:00:00Z', loginHoursAgo: 52 },
  { id: 'user-ella', email: 'l.ella@bank.example', displayName: 'L. Ella', accountType: 'trader', organizationId: 'org-bank', organizationRole: 'member', timeZone: 'Africa/Libreville', createdAt: '2026-03-02T08:00:00Z', loginHoursAgo: 5 },
  // The mockup suspends T. Bekale, the demo Trader: his colleague is suspended instead.
  { id: 'user-mba', email: 'f.mba@bank.example', displayName: 'F. Mba', accountType: 'trader', organizationId: 'org-bank', organizationRole: 'member', timeZone: 'Africa/Libreville', createdAt: '2026-04-20T08:00:00Z', loginHoursAgo: 460,
    status: 'suspended', suspension: { at: '2026-10-12T10:20:00Z', by: ADMIN, reason: 'Login shared outside Bank C, reported by its administrator.' } },
  // The other Data admin of the screen 6 and 9 mockups.
  { id: 'user-ekane', email: 'j.ekane@cmarket.example', displayName: 'J. Ekane', accountType: 'dataAdmin', organizationId: 'org-cmarket', organizationRole: 'member', createdAt: '2026-01-12T08:00:00Z', loginHoursAgo: 22 },
  // The other analysts of the research library.
  { id: 'user-ndong', email: 'm.ndong@ndong-research.example', displayName: 'M. Ndong', accountType: 'analyst', timeZone: 'Africa/Libreville', ...approved('2022-01-10T09:00:00Z'), loginHoursAgo: 3.5 },
  { id: 'user-fotso', email: 'l.fotso@agri-research.example', displayName: 'L. Fotso', accountType: 'analyst', ...approved('2022-06-01T09:00:00Z'), loginHoursAgo: 30 },
  { id: 'user-cessomba', email: 'c.essomba@finance-research.example', displayName: 'C. Essomba', accountType: 'analyst', ...approved('2023-02-15T09:00:00Z'), loginHoursAgo: 98 },
  { id: 'user-ondo', email: 'r.ondo@sovereign-research.example', displayName: 'R. Ondo', accountType: 'analyst', timeZone: 'Africa/Malabo', ...approved('2023-09-01T09:00:00Z'), loginHoursAgo: 145 },
  // A new analyst, whose first publication waits for the moderators (screen 9 mockup).
  { id: 'user-nguema', email: 'c.nguema@chad-economics.example', displayName: 'C. Nguema', accountType: 'analyst', timeZone: 'Africa/Ndjamena', ...approved('2026-10-17T10:00:00Z'), loginHoursAgo: 40 },
  // Analyst status requests of the screen 9 mockup, waiting for an Admin.
  { id: 'user-ressomba', email: 'r.essomba@brokerage-d.example', displayName: 'R. Essomba', accountType: 'analyst', organizationId: 'org-brokerage-d', organizationRole: 'admin', analystStatus: 'pending', createdAt: '2026-10-26T14:10:00Z', loginHoursAgo: 115,
    documents: [document('cv', 'CV_R_Essomba.pdf', 182_400), document('identityDocument', 'ID_card_R_Essomba.pdf', 412_800), document('licence', 'COSUMAF_licence_R_Essomba.pdf', 96_300)] },
  { id: 'user-biyong', email: 'f.biyong@mail.example', displayName: 'F. Biyong', accountType: 'analyst', analystStatus: 'pending', createdAt: '2026-10-25T09:40:00Z', loginHoursAgo: 140,
    documents: [document('cv', 'Biyong_CV_2026.pdf', 141_200), document('identityDocument', 'Biyong_passport.pdf', 655_100)] },
  { id: 'user-moussavou', email: 'd.moussavou@bank-e.example', displayName: 'D. Moussavou', accountType: 'analyst', organizationId: 'org-bank-e', organizationRole: 'admin', timeZone: 'Africa/Libreville', analystStatus: 'pending', createdAt: '2026-10-22T16:05:00Z', loginHoursAgo: 200,
    documents: [document('cv', 'D_Moussavou_CV.pdf', 203_500), document('identityDocument', 'D_Moussavou_ID.pdf', 388_000), document('licence', 'CFA_level_2_certificate.pdf', 120_700)] },
]

export function createAccounts(now = Date.now()): StoredAccount[] {
  return SEEDS.map(({ loginHoursAgo, ...seed }) => ({
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
    lastLoginAt:
      loginHoursAgo === undefined
        ? null
        : new Date(now - Math.round(loginHoursAgo * 3_600_000)).toISOString(),
    analystDecision: null,
    suspension: null,
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
