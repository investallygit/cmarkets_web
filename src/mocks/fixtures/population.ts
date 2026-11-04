import type { AccountType, ClientAccountType, SignUpDocument } from '@/shared/api/contracts'
import { addDays } from '@/shared/lib/isoDate'
import { createRandom, hashString } from '../lib/random'
import {
  DEMO_PASSWORD_HASH,
  DEMO_SALT,
  isVerifiedType,
  type StoredAccount,
  type StoredOrganization,
} from './accounts'

/** Active accounts by type on the screen 9 mockup: 2,041 in all, where its list says 1,946. */
export const ACTIVE_ACCOUNTS: Record<AccountType, number> = {
  student: 1_284,
  analyst: 96,
  manager: 212,
  trader: 348,
  journalist: 37,
  ceo: 58,
  dataAdmin: 4,
  admin: 2,
}

/** Suspended accounts, outside the counters. */
const SUSPENDED: Partial<Record<AccountType, number>> = { student: 9, manager: 1, trader: 2 }
/** Analysts whose status an Admin refused. */
const REJECTED_ANALYSTS = 3

const TIME_ZONES: Record<string, string> = {
  CM: 'Africa/Douala',
  GA: 'Africa/Libreville',
  CG: 'Africa/Brazzaville',
  TD: 'Africa/Ndjamena',
  CF: 'Africa/Bangui',
  GQ: 'Africa/Malabo',
}

const DIAL_CODES: Record<string, string> = {
  CM: '+237 6',
  GA: '+241 0',
  CG: '+242 0',
  TD: '+235 6',
  CF: '+236 7',
  GQ: '+240 2',
}

export interface PopulationOrganization extends StoredOrganization {
  domain: string
  country: string
}

/** Organisations of the generated accounts, named like those of the mockups. */
// prettier-ignore
const ORGANIZATIONS: Record<Exclude<ClientAccountType, 'ceo'>, PopulationOrganization[]> = {
  student: [
    { id: 'org-p-university-f', name: 'University F', domain: 'university-f.example', country: 'CM', createdAt: '2024-09-02T08:00:00Z' },
    { id: 'org-p-university-g', name: 'University G', domain: 'university-g.example', country: 'GA', createdAt: '2024-10-01T08:00:00Z' },
    { id: 'org-p-university-h', name: 'University H', domain: 'university-h.example', country: 'CG', createdAt: '2025-02-03T08:00:00Z' },
    { id: 'org-p-school-j', name: 'Business school J', domain: 'school-j.example', country: 'CM', createdAt: '2025-01-06T08:00:00Z' },
    { id: 'org-p-university-k', name: 'University K', domain: 'university-k.example', country: 'TD', createdAt: '2025-09-01T08:00:00Z' },
  ],
  analyst: [
    { id: 'org-p-brokerage-l', name: 'Brokerage firm L', domain: 'brokerage-l.example', country: 'CM', createdAt: '2024-11-12T08:00:00Z' },
    { id: 'org-p-research-m', name: 'Research house M', domain: 'research-m.example', country: 'GA', createdAt: '2025-03-10T08:00:00Z' },
  ],
  manager: [
    { id: 'org-p-am-n', name: 'Asset manager N', domain: 'am-n.example', country: 'CM', createdAt: '2024-07-01T08:00:00Z' },
    { id: 'org-p-pension-p', name: 'Pension fund P', domain: 'pension-p.example', country: 'GA', createdAt: '2024-09-16T08:00:00Z' },
    { id: 'org-p-bank-q', name: 'Private bank Q', domain: 'bank-q.example', country: 'CM', createdAt: '2025-01-20T08:00:00Z' },
    { id: 'org-p-am-r', name: 'Asset manager R', domain: 'am-r.example', country: 'CG', createdAt: '2025-06-02T08:00:00Z' },
  ],
  trader: [
    { id: 'org-p-bank-s', name: 'Bank S', domain: 'bank-s.example', country: 'CM', createdAt: '2024-06-17T08:00:00Z' },
    { id: 'org-p-brokerage-t', name: 'Brokerage firm T', domain: 'brokerage-t.example', country: 'GA', createdAt: '2024-08-05T08:00:00Z' },
    { id: 'org-p-bank-u', name: 'Bank U', domain: 'bank-u.example', country: 'GQ', createdAt: '2025-04-14T08:00:00Z' },
    { id: 'org-p-bank-v', name: 'Bank V', domain: 'bank-v.example', country: 'TD', createdAt: '2025-11-03T08:00:00Z' },
  ],
  journalist: [
    { id: 'org-p-daily-w', name: 'Business daily W', domain: 'daily-w.example', country: 'CM', createdAt: '2024-10-14T08:00:00Z' },
    { id: 'org-p-radio-x', name: 'Radio X', domain: 'radio-x.example', country: 'GA', createdAt: '2025-03-03T08:00:00Z' },
    { id: 'org-p-agency-y', name: 'News agency Y', domain: 'agency-y.example', country: 'CG', createdAt: '2025-07-07T08:00:00Z' },
  ],
}

/** A CEO heads one of the asset managers, pension funds, banks or brokerage firms. */
const CEO_ORGANIZATIONS = [...ORGANIZATIONS.manager, ...ORGANIZATIONS.trader]

export const POPULATION_ORGANIZATIONS: PopulationOrganization[] =
  Object.values(ORGANIZATIONS).flat()

const INITIALS = 'ABCDEFGHJKLMNOPRSTVYZ'
// prettier-ignore
const SURNAMES = [
  'Abena', 'Abessolo', 'Akono', 'Ango', 'Assoumou', 'Ayissi', 'Bekale', 'Belinga', 'Biloa', 'Boukaka',
  'Ebang', 'Edou', 'Ekotto', 'Elong', 'Emane', 'Essono', 'Etoundi', 'Eyenga', 'Kamga', 'Kemajou',
  'Mabiala', 'Makaya', 'Mbida', 'Mbouma', 'Mengue', 'Messi', 'Milandou', 'Minko', 'Mintsa', 'Moubamba',
  'Moukoko', 'Ndjock', 'Ngoma', 'Ngoua', 'Njoya', 'Nkodo', 'Nsang', 'Ntoutoume', 'Obame', 'Onana',
  'Oyono', 'Tchakounte', 'Wandji', 'Zang', 'Mboumba', 'Nzue', 'Okemba', 'Ibinga', 'Djimadoum', 'Mahamat',
]
const COUNTRIES = ['CM', 'CM', 'CM', 'GA', 'GA', 'CG', 'TD', 'CF', 'GQ']
const SUSPENSION_REASONS = [
  'Payment refused by the bank twice.',
  'Login shared between several people.',
  'Abusive messages to an analyst.',
]

const HOUR = 3_600_000
const pick = <T>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)]

const slug = (text: string) => text.normalize('NFD').replace(/[̀-ͯ']/g, '').toLowerCase()

/** A day between two others, with an hour of the working day in UTC. */
function dayBetween(random: () => number, from: string, days: number): string {
  const day = addDays(from, Math.floor(random() * days))
  const hours = String(7 + Math.floor(random() * 10)).padStart(2, '0')
  const minutes = String(Math.floor(random() * 60)).padStart(2, '0')
  return `${day}T${hours}:${minutes}:00Z`
}

/**
 * Accounts of the users the screen 9 mockup counts beyond the seeded ones: generated the same way
 * on every load, kept out of localStorage, and copied into the stored accounts once an Admin
 * changes one. They do not log in.
 */
export function generatePopulation(fixed: readonly StoredAccount[], now: number): StoredAccount[] {
  const accounts: StoredAccount[] = []
  const types = Object.keys(ACTIVE_ACCOUNTS) as AccountType[]
  for (const accountType of types) {
    const fixedActive = fixed.filter(
      (account) => account.accountType === accountType && account.status === 'active',
    ).length
    const active = Math.max(0, ACTIVE_ACCOUNTS[accountType] - fixedActive)
    const suspended = SUSPENDED[accountType] ?? 0
    for (let index = 0; index < active + suspended; index++) {
      accounts.push(generatedAccount(accountType, accounts.length + 1, index >= active, index, now))
    }
  }
  return accounts
}

function generatedAccount(
  accountType: AccountType,
  number: number,
  suspended: boolean,
  index: number,
  now: number,
): StoredAccount {
  const random = createRandom(hashString(`population|${accountType}|${index}`))
  const employee = accountType === 'dataAdmin' || accountType === 'admin'
  const surname = pick(random, SURNAMES)
  const initial = pick(random, [...INITIALS])
  const organizations = employee
    ? []
    : accountType === 'ceo'
      ? CEO_ORGANIZATIONS
      : ORGANIZATIONS[accountType]
  const inOrganization =
    !employee &&
    random() <
      { student: 0.85, analyst: 0.25, manager: 1, trader: 1, journalist: 0.7, ceo: 1 }[accountType]
  const organization = inOrganization ? pick(random, organizations) : undefined
  const country = organization?.country ?? (employee ? 'CM' : pick(random, COUNTRIES))
  const domain = employee ? 'cmarket.example' : (organization?.domain ?? 'mail.example')
  const createdAt =
    accountType === 'student'
      ? dayBetween(random, '2025-01-06', 650)
      : dayBetween(random, '2024-06-03', 875)
  // Logged in during the last two months, none of them today; a few never did.
  const lastLoginAt =
    random() < 0.06
      ? null
      : new Date(
          Math.max(Date.parse(createdAt), now - (24 + random() * 60 * 24) * HOUR),
        ).toISOString()
  const phone =
    random() < 0.55
      ? `${DIAL_CODES[country]} ${String(Math.floor(random() * 1e8))
          .padStart(8, '0')
          .replace(/(\d{2})(?=\d)/g, '$1 ')}`
      : null
  const rejected = accountType === 'analyst' && index < REJECTED_ANALYSTS
  const decidedAt = new Date(Date.parse(createdAt) + 2 * 24 * HOUR).toISOString()
  const documents: { kind: SignUpDocument; fileName: string; size: number }[] =
    accountType === 'journalist'
      ? [{ kind: 'pressCredential', fileName: `Press_card_${surname}.pdf`, size: 180_000 }]
      : accountType === 'ceo'
        ? [{ kind: 'proofOfPosition', fileName: `Appointment_${surname}.pdf`, size: 140_000 }]
        : accountType === 'analyst'
          ? [
              {
                kind: 'cv',
                fileName: `CV_${surname}.pdf`,
                size: 120_000 + Math.floor(random() * 90_000),
              },
              {
                kind: 'identityDocument',
                fileName: `ID_${surname}.pdf`,
                size: 300_000 + Math.floor(random() * 300_000),
              },
            ]
          : []
  return {
    id: `user-p${String(number).padStart(4, '0')}`,
    email: `${initial.toLowerCase()}.${slug(surname)}${number}@${domain}`,
    salt: DEMO_SALT,
    passwordHash: DEMO_PASSWORD_HASH,
    displayName: `${initial}. ${surname}`,
    accountType,
    organizationId: employee ? 'org-cmarket' : (organization?.id ?? null),
    organizationRole: employee || organization ? 'member' : null,
    language: random() < 0.7 ? 'fr' : 'en',
    timeZone: TIME_ZONES[country],
    phone,
    twoFactorChannel: phone && !employee && random() < 0.3 ? 'sms' : 'email',
    verificationStatus: isVerifiedType(accountType) ? (rejected ? 'rejected' : 'approved') : null,
    status: suspended ? 'suspended' : 'active',
    createdAt,
    documents,
    failedLogins: 0,
    lockedUntil: null,
    lastLoginAt,
    verificationDecision: isVerifiedType(accountType)
      ? {
          at: decidedAt,
          by: 'L. Mvogo',
          reason: rejected ? 'No licence and no published research to judge the background.' : null,
        }
      : null,
    suspension: suspended
      ? {
          at: new Date(
            Math.min(now - HOUR, Date.parse(lastLoginAt ?? createdAt) + 30 * HOUR),
          ).toISOString(),
          by: 'L. Mvogo',
          reason: pick(random, SUSPENSION_REASONS),
        }
      : null,
  }
}
