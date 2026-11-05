import type { ClientAccountType, ContactRules, ExperienceDto } from '@/shared/api/contracts'
import { isClientType } from '../lib/contact'
import { createRandom, hashString } from '../lib/random'
import type { StoredAccount } from './accounts'
import { PLACES, privacy, SPECIALTIES, type StoredProfile } from './network'
import { POPULATION_ORGANIZATIONS } from './population'

/**
 * The professional profiles of the generated accounts (fixtures/population.ts), as the directory
 * of the screen 10 mockup counts them: every client is listed but most Students, who hide their
 * profile. Made the same way on every load and kept out of localStorage, as the accounts are.
 */

/** Students the directory lists on the screen 10 mockup, of the 1,284 active ones. */
export const LISTED_STUDENTS = 412

/**
 * Generated Analysts and Managers who follow sovereign bonds, all open to the other Analysts and
 * Managers: with the profiles seeded, the search of the screen 10 mockup finds 64 of them.
 */
const SOVEREIGN_BONDS: Partial<Record<ClientAccountType, number>> = { analyst: 23, manager: 37 }

// prettier-ignore
const JOB_TITLES: Record<ClientAccountType, string[]> = {
  student: ["Master's student in finance", 'Finance student', 'Economics student', 'MBA student', 'Accounting student', 'Banking and finance student'],
  analyst: ['Financial analyst', 'Equity analyst', 'Credit analyst', 'Economist', 'Research analyst', 'Sector analyst'],
  manager: ['Portfolio manager', 'Fund manager', 'Bond fund manager', 'Asset allocation manager', 'Wealth manager', 'Head of fixed income', 'Equity fund manager'],
  trader: ['Trader', 'Equity trader', 'Bond trader', 'Sales trader', 'Treasury dealer', 'Fixed income trader'],
  journalist: ['Business journalist', 'Economics editor', 'Financial reporter', 'Markets correspondent'],
  ceo: ['Chief executive officer', 'Managing director', 'Chief executive'],
}

/** The specialties each type picks from; sovereign bonds are given apart, by the counts above. */
// prettier-ignore
const TYPE_SPECIALTIES: Record<ClientAccountType, string[]> = {
  student: ['cemac-equities', 'macro', 'banks', 'trading', 'microfinance', 'public-finance', 'currencies'],
  analyst: ['cemac-equities', 'banks', 'macro', 'agribusiness', 'energy', 'mining', 'public-finance', 'telecoms', 'insurance', 'currencies', 'rates'],
  manager: ['bonds', 'allocation', 'rates', 'cemac-equities', 'private-equity', 'real-estate', 'insurance'],
  trader: ['trading', 'cemac-equities', 'currencies', 'rates', 'bonds'],
  journalist: ['macro', 'public-finance', 'banks', 'energy', 'mining', 'telecoms', 'cemac-equities'],
  ceo: ['allocation', 'banks', 'insurance', 'private-equity', 'microfinance', 'real-estate'],
}

/** Fewest and most specialties of a profile, besides sovereign bonds. */
const SPECIALTY_COUNTS: Record<ClientAccountType, [number, number]> = {
  student: [0, 2],
  analyst: [1, 3],
  manager: [1, 3],
  trader: [1, 3],
  journalist: [1, 3],
  ceo: [1, 2],
}

/** The cities of each country, the business centre more often. */
const CITIES: Record<string, string[]> = {
  CM: ['Douala', 'Douala', 'Yaoundé'],
  GA: ['Libreville', 'Libreville', 'Port-Gentil'],
  CG: ['Brazzaville', 'Pointe-Noire'],
  TD: ["N'Djamena"],
  CF: ['Bangui'],
  GQ: ['Malabo', 'Bata'],
}

/** A third language spoken in some countries: Arabic in Chad, Spanish in Equatorial Guinea... */
const LOCAL_LANGUAGES: Record<string, string> = { TD: 'ar', GQ: 'es', CG: 'ln' }

/** Where a Student without an organisation says they study. */
const SCHOOLS = POPULATION_ORGANIZATIONS.filter((organization) =>
  /university|school/i.test(organization.name),
).map((organization) => organization.name)

const INTERNSHIPS = ['Bank S', 'Brokerage firm T', 'Asset manager N', 'Bank U']

const ABOUTS: Record<ClientAccountType, (topic: string, organization: string) => string> = {
  student: (topic) => `Studies finance and follows the CEMAC markets, ${topic} first.`,
  analyst: (topic) => `Covers ${topic} for the investors of the region.`,
  manager: (topic, organization) => `Invests in ${topic} for the clients of ${organization}.`,
  trader: (topic) => `Trades ${topic} on the regional market.`,
  journalist: (topic) => `Writes on ${topic} for the business press of Central Africa.`,
  ceo: (_topic, organization) => `Heads ${organization} and its teams.`,
}

const pick = <T>(random: () => number, values: readonly T[]): T =>
  values[Math.floor(random() * values.length)]

/** A few values drawn without repeat. */
function pickSome<T>(random: () => number, values: readonly T[], count: number): T[] {
  const left = [...values]
  const picked: T[] = []
  while (picked.length < count && left.length > 0) {
    picked.push(left.splice(Math.floor(random() * left.length), 1)[0])
  }
  return picked
}

/** Most keep the defaults; some close the door to Students, ask the press for a request... */
function rulesOf(random: () => number, sovereign: boolean): Partial<ContactRules> {
  const rules: Partial<ContactRules> = {}
  const students = random()
  if (students < 0.2) rules.student = 'none'
  else if (students < 0.3) rules.student = 'direct'
  if (random() < 0.12) rules.trader = 'request'
  const press = random()
  if (press < 0.2) rules.journalist = 'request'
  else if (press < 0.25) rules.journalist = 'none'
  // Those who follow sovereign bonds stay open to Analysts and Managers.
  if (!sovereign && random() < 0.08) rules.analyst = 'request'
  return rules
}

const englishName = (id: string) =>
  SPECIALTIES.find((specialty) => specialty.id === id)?.name.en ?? id

function generatedProfile(
  account: StoredAccount,
  type: ClientAccountType,
  organization: string | null,
  { listed, sovereign }: { listed: boolean; sovereign: boolean },
): StoredProfile {
  const random = createRandom(hashString(`profile|${account.id}`))
  const country = (PLACES[account.timeZone] ?? PLACES['Africa/Douala'])[1]
  const jobTitle = pick(random, JOB_TITLES[type])
  const place =
    organization ??
    (type === 'student'
      ? pick(random, SCHOOLS)
      : type === 'journalist'
        ? 'Freelance'
        : 'Independent')
  const [fewest, most] = SPECIALTY_COUNTS[type]
  const specialties = [
    ...(sovereign ? ['sovereign-bonds'] : []),
    ...pickSome(
      random,
      TYPE_SPECIALTIES[type],
      fewest + Math.floor(random() * (most - fewest + 1)),
    ),
  ]
  const other = account.language === 'fr' ? 'en' : 'fr'
  const local = LOCAL_LANGUAGES[country]
  const languages = [
    account.language,
    ...(random() < 0.45 ? [other] : []),
    ...(local && random() < 0.4 ? [local] : []),
  ]
  const since = Number(account.createdAt.slice(0, 4))
  const experiences: ExperienceDto[] = []
  if (type === 'student') {
    if (random() < 0.25) {
      const organizationName = pick(random, INTERNSHIPS)
      experiences.push({
        id: `experience-${account.id}-1`,
        kind: 'position',
        title: 'Intern, market research',
        organization: organizationName,
        from: since,
        to: since,
      })
    }
  } else if (random() < 0.55) {
    experiences.push({
      id: `experience-${account.id}-1`,
      kind: 'position',
      title: jobTitle,
      organization: place,
      from: since - Math.floor(random() * 9),
      to: null,
    })
  }
  const topic = englishName(specialties[0] ?? TYPE_SPECIALTIES[type][0])
  const visibility = !listed ? 'hidden' : random() < 0.12 ? 'public' : 'members'
  const profilePrivacy = privacy(visibility, rulesOf(random, sovereign))
  profilePrivacy.show.onlineStatus = random() < 0.85
  return {
    userId: account.id,
    photo: null,
    jobTitle,
    organization: place,
    city: pick(random, CITIES[country] ?? ['Douala']),
    country,
    languages,
    about: random() < 0.35 ? ABOUTS[type](topic, place) : '',
    specialties,
    experiences,
    contact: { workEmail: null, phone: null, linkedIn: null },
    privacy: profilePrivacy,
    updatedAt: account.createdAt,
  }
}

/** An Analyst, a Journalist or a CEO whose status an Admin did not approve writes to nobody. */
const mayWrite = (account: StoredAccount) =>
  account.status === 'active' &&
  (account.verificationStatus === null || account.verificationStatus === 'approved')

/**
 * The profiles of the generated clients, by user id: the first Students listed, up to the
 * mockup's count with the seeded ones, the others hidden; sovereign bonds for the first
 * Analysts and Managers who may write.
 */
export function generateProfiles(
  accounts: readonly StoredAccount[],
  fixed: readonly StoredAccount[],
  organizationName: (id: string | null) => string | null,
): Map<string, StoredProfile> {
  const fixedStudents = fixed.filter(
    (account) => account.accountType === 'student' && account.status === 'active',
  ).length
  let studentsLeft = LISTED_STUDENTS - fixedStudents
  const sovereignLeft = { ...SOVEREIGN_BONDS }
  const profiles = new Map<string, StoredProfile>()
  for (const account of accounts) {
    const type = account.accountType
    if (!isClientType(type)) continue
    let listed = true
    if (type === 'student' && account.status === 'active') {
      listed = studentsLeft > 0
      studentsLeft -= 1
    }
    const sovereign = (sovereignLeft[type] ?? 0) > 0 && mayWrite(account)
    if (sovereign) sovereignLeft[type] = (sovereignLeft[type] ?? 0) - 1
    const organization = organizationName(account.organizationId)
    profiles.set(account.id, generatedProfile(account, type, organization, { listed, sovereign }))
  }
  return profiles
}
