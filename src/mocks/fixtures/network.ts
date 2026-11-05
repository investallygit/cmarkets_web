import type {
  AccountType,
  ContactRules,
  ExperienceDto,
  ProfileContactDto,
  ProfilePrivacyDto,
  ProfileVisibility,
  SpecialtyDto,
} from '@/shared/api/contracts'
import { DEFAULT_CONTACT_RULES } from '../lib/contact'
import type { StoredAccount } from './accounts'

/**
 * The professional profiles of the directory (spec section 15): the specialties the Admin lists,
 * the profiles of the screen 10 to 12 mockups, and the one any other client starts with.
 */

/** The closed list of specialties, as the Admin would set it; the mockups' first. */
// prettier-ignore
export const SPECIALTIES: SpecialtyDto[] = [
  { id: 'sovereign-bonds', name: { en: 'Sovereign bonds', fr: 'Obligations souveraines' } },
  { id: 'cemac-equities', name: { en: 'CEMAC equities', fr: 'Actions CEMAC' } },
  { id: 'agribusiness', name: { en: 'Agribusiness', fr: 'Agro-industrie' } },
  { id: 'banks', name: { en: 'Banks', fr: 'Banques' } },
  { id: 'macro', name: { en: 'Macro', fr: 'Macroéconomie' } },
  { id: 'rates', name: { en: 'Rates', fr: 'Taux' } },
  { id: 'allocation', name: { en: 'Allocation', fr: "Allocation d'actifs" } },
  { id: 'bonds', name: { en: 'Bonds', fr: 'Obligations' } },
  { id: 'insurance', name: { en: 'Insurance', fr: 'Assurance' } },
  { id: 'energy', name: { en: 'Oil and energy', fr: 'Pétrole et énergie' } },
  { id: 'mining', name: { en: 'Mining', fr: 'Mines' } },
  { id: 'public-finance', name: { en: 'Public finance', fr: 'Finances publiques' } },
  { id: 'currencies', name: { en: 'Currencies', fr: 'Changes' } },
  { id: 'telecoms', name: { en: 'Telecoms', fr: 'Télécoms' } },
  { id: 'real-estate', name: { en: 'Real estate', fr: 'Immobilier' } },
  { id: 'private-equity', name: { en: 'Private equity', fr: 'Capital-investissement' } },
  { id: 'trading', name: { en: 'Trading', fr: 'Trading' } },
  { id: 'microfinance', name: { en: 'Microfinance', fr: 'Microfinance' } },
]

/** A profile as the server keeps it; the type, the badge and the statistics come from elsewhere. */
export interface StoredProfile {
  userId: string
  /** JPEG data URL of the cropped photo; null: the initials. */
  photo: string | null
  jobTitle: string
  organization: string
  city: string
  country: string
  languages: string[]
  about: string
  specialties: string[]
  experiences: ExperienceDto[]
  contact: ProfileContactDto
  privacy: ProfilePrivacyDto
  updatedAt: string | null
}

/** E-mail, phone and LinkedIn hidden by default (spec section 15); the online status shown. */
export const DEFAULT_PRIVACY: ProfilePrivacyDto = {
  visibility: 'members',
  contactRules: DEFAULT_CONTACT_RULES,
  show: { email: false, phone: false, onlineStatus: true, publicationStats: true },
}

export const privacy = (
  visibility: ProfileVisibility = 'members',
  rules: Partial<ContactRules> = {},
): ProfilePrivacyDto => ({
  ...DEFAULT_PRIVACY,
  visibility,
  contactRules: { ...DEFAULT_CONTACT_RULES, ...rules },
  show: { ...DEFAULT_PRIVACY.show },
})

type ProfileSeed = Omit<StoredProfile, 'photo' | 'privacy' | 'updatedAt'> & {
  /** CMarket members unless given. */
  visibility?: ProfileVisibility
  /** The rules that differ from the defaults. */
  rules?: Partial<ContactRules>
}

const position = (
  id: string,
  title: string,
  organization: string,
  from: number,
  to: number | null,
) => ({ id, kind: 'position', title, organization, from, to }) as const

/**
 * The demo clients' profiles, K. Atangana's that of the screen 12 mockup; then the other people of
 * the screen 10 mockup and the analysts of the library.
 */
// prettier-ignore
const PROFILE_SEEDS: ProfileSeed[] = [
  {
    userId: 'user-analyst', jobTitle: 'CEMAC equity & sovereign analyst', organization: 'Independent', city: 'Douala', country: 'CM', languages: ['fr', 'en'],
    about: 'Twelve years of analysis on Central African markets. Covers CEMAC sovereign issuers and BVMAC agribusiness stocks.',
    specialties: ['sovereign-bonds', 'cemac-equities', 'agribusiness'],
    experiences: [
      position('experience-atangana-1', 'Independent analyst', '', 2020, null),
      position('experience-atangana-2', 'Credit analyst', 'Bank H', 2014, 2020),
      { id: 'experience-atangana-3', kind: 'certification', title: 'CFA Charterholder', organization: 'CFA Institute', from: 2017, to: null },
    ],
    contact: { workEmail: 'k.atangana@analyst.example', phone: '+237 6 77 41 20 18', linkedIn: 'linkedin.com/in/k-atangana' },
  },
  {
    userId: 'user-manager', jobTitle: 'Bond fund manager', organization: 'Asset manager A', city: 'Douala', country: 'CM', languages: ['fr', 'en'],
    about: 'Manages the bond funds of Asset manager A: CEMAC sovereign issues and the BEAC auctions.',
    specialties: ['sovereign-bonds', 'rates'],
    experiences: [
      position('experience-owona-1', 'Bond fund manager', 'Asset manager A', 2019, null),
      position('experience-owona-2', 'Fixed income analyst', 'Bank C', 2013, 2019),
    ],
    contact: { workEmail: 'p.owona@asset-manager.example', phone: '+237 6 99 05 61 44', linkedIn: null },
  },
  {
    userId: 'user-student', jobTitle: "Master's student in finance", organization: 'University B', city: 'Yaoundé', country: 'CM', languages: ['fr', 'en'],
    about: "Master's thesis on the listings of the BVMAC and the liquidity of its equities.",
    specialties: ['cemac-equities'],
    experiences: [position('experience-mvondo-1', 'Intern, market research', 'Bank C', 2025, 2025)],
    contact: { workEmail: null, phone: null, linkedIn: null },
  },
  {
    userId: 'user-trader', jobTitle: 'Equity and bond trader', organization: 'Bank C', city: 'Libreville', country: 'GA', languages: ['fr'],
    about: 'Trades CEMAC equities and government securities for the bank and its clients.',
    specialties: ['cemac-equities', 'trading', 'sovereign-bonds'],
    experiences: [position('experience-bekale-1', 'Trader', 'Bank C', 2018, null)],
    contact: { workEmail: 't.bekale@bank.example', phone: null, linkedIn: null },
  },
  {
    userId: 'user-journalist', jobTitle: 'Business journalist', organization: 'Freelance', city: 'Douala', country: 'CM', languages: ['fr', 'en'],
    about: 'Covers public finance, banks and the BVMAC for economic dailies of the region.',
    specialties: ['macro', 'public-finance', 'banks'],
    experiences: [position('experience-tamba-1', 'Business journalist', 'Freelance', 2016, null)],
    contact: { workEmail: 'r.tamba@press.example', phone: null, linkedIn: null },
  },
  {
    userId: 'user-ceo', jobTitle: 'Chief executive officer', organization: 'Asset manager A', city: 'Douala', country: 'CM', languages: ['fr', 'en'],
    about: 'Heads Asset manager A, its funds and mandates for institutions of the region.',
    specialties: ['allocation'],
    experiences: [position('experience-fouda-1', 'Chief executive officer', 'Asset manager A', 2021, null)],
    contact: { workEmail: 'e.fouda@asset-manager.example', phone: null, linkedIn: null },
  },
  {
    userId: 'user-ndong', jobTitle: 'Economist, public debt', organization: 'Independent', city: 'Libreville', country: 'GA', languages: ['fr', 'en'],
    about: 'Economist of the public debt of the CEMAC states: their budgets, the BEAC auctions and the oil revenue behind them.',
    specialties: ['sovereign-bonds', 'macro'],
    experiences: [
      position('experience-ndong-1', 'Independent economist', '', 2021, null),
      position('experience-ndong-2', 'Economist', 'Ministry of the Economy, Gabon', 2014, 2021),
    ],
    contact: { workEmail: 'm.ndong@ndong-research.example', phone: null, linkedIn: 'linkedin.com/in/m-ndong' },
    visibility: 'public',
  },
  {
    userId: 'user-tchakounte', jobTitle: 'Chief investment officer', organization: 'Insurer F', city: 'Yaoundé', country: 'CM', languages: ['fr', 'en'],
    about: 'Invests the reserves of Insurer F in the government securities of the CEMAC states and in listed equities.',
    specialties: ['allocation', 'bonds'],
    experiences: [position('experience-tchakounte-1', 'Chief investment officer', 'Insurer F', 2018, null)],
    contact: { workEmail: 'a.tchakounte@insurer-f.example', phone: null, linkedIn: null },
    rules: { student: 'none', analyst: 'request', manager: 'none', trader: 'none', journalist: 'request' },
  },
  {
    userId: 'user-moussavou', jobTitle: 'Bank credit analyst', organization: 'Bank E', city: 'Libreville', country: 'GA', languages: ['fr'],
    about: 'Credit analyst of the banks of the region and of the sovereign paper they hold.',
    specialties: ['banks', 'sovereign-bonds'],
    experiences: [position('experience-moussavou-1', 'Credit analyst', 'Bank E', 2019, null)],
    contact: { workEmail: 'd.moussavou@bank-e.example', phone: null, linkedIn: null },
  },
  {
    userId: 'user-ngoma', jobTitle: 'Pension fund manager', organization: 'Pension fund G', city: 'Brazzaville', country: 'CG', languages: ['fr', 'ln'],
    about: 'Manages the bond portfolio of Pension fund G, invested in the sovereign debt of the CEMAC states.',
    specialties: ['sovereign-bonds'],
    experiences: [position('experience-ngoma-1', 'Pension fund manager', 'Pension fund G', 2020, null)],
    contact: { workEmail: 'b.ngoma@pension-g.example', phone: null, linkedIn: null },
  },
  {
    userId: 'user-fotso', jobTitle: 'Agribusiness equity analyst', organization: 'Independent', city: 'Douala', country: 'CM', languages: ['fr', 'en'],
    about: 'Covers the agribusiness and consumer stocks of the BVMAC: palm oil, rubber, mineral water.',
    specialties: ['agribusiness', 'cemac-equities'],
    experiences: [position('experience-fotso-1', 'Independent analyst', '', 2022, null)],
    contact: { workEmail: null, phone: null, linkedIn: null },
    visibility: 'public',
  },
  {
    userId: 'user-cessomba', jobTitle: 'Banks and insurance analyst', organization: 'Independent', city: 'Yaoundé', country: 'CM', languages: ['fr'],
    about: 'Banks and insurers of Central Africa: their margins, their capital and the sovereign risk they carry.',
    specialties: ['banks', 'insurance'],
    experiences: [position('experience-essomba-1', 'Independent analyst', '', 2023, null)],
    contact: { workEmail: null, phone: null, linkedIn: null },
  },
  {
    userId: 'user-ondo', jobTitle: 'Sovereign debt analyst', organization: 'Independent', city: 'Malabo', country: 'GQ', languages: ['es', 'fr', 'en'],
    about: 'Sovereign debt of the CEMAC states and the BEAC auctions.',
    specialties: ['sovereign-bonds', 'public-finance'],
    experiences: [position('experience-ondo-1', 'Independent analyst', '', 2023, null)],
    contact: { workEmail: null, phone: null, linkedIn: null },
  },
  {
    userId: 'user-nguema', jobTitle: 'Economist, Chad', organization: 'Independent', city: "N'Djamena", country: 'TD', languages: ['fr', 'ar'],
    about: 'The budgets of Chad and of the CEMAC states, and the oil revenue that funds them.',
    specialties: ['public-finance', 'macro', 'energy'],
    experiences: [],
    contact: { workEmail: null, phone: null, linkedIn: null },
  },
]

/** The demo users saved their profile a little before the prototype started. */
const SAVED_MINUTES_AGO = 75

export function createProfiles(now = Date.now()): StoredProfile[] {
  return PROFILE_SEEDS.map(({ visibility, rules, ...seed }) => ({
    ...seed,
    photo: null,
    languages: [...seed.languages],
    specialties: [...seed.specialties],
    experiences: seed.experiences.map((experience) => ({ ...experience })),
    contact: { ...seed.contact },
    privacy: privacy(visibility, rules),
    updatedAt: new Date(now - SAVED_MINUTES_AGO * 60_000).toISOString(),
  }))
}

/** The job a client of each type starts with, until they write their own. */
const DEFAULT_JOB_TITLES: Partial<Record<AccountType, string>> = {
  student: 'Finance student',
  analyst: 'Financial analyst',
  manager: 'Portfolio manager',
  trader: 'Trader',
  journalist: 'Business journalist',
  ceo: 'Chief executive officer',
}

/** The city and country of the time zones of the accounts. */
export const PLACES: Record<string, [city: string, country: string]> = {
  'Africa/Douala': ['Douala', 'CM'],
  'Africa/Libreville': ['Libreville', 'GA'],
  'Africa/Brazzaville': ['Brazzaville', 'CG'],
  'Africa/Ndjamena': ["N'Djamena", 'TD'],
  'Africa/Bangui': ['Bangui', 'CF'],
  'Africa/Malabo': ['Malabo', 'GQ'],
}

/** The profile of a client who never wrote theirs: their account says what it can. */
export function defaultProfile(account: StoredAccount, organization: string | null): StoredProfile {
  const [city, country] = PLACES[account.timeZone] ?? PLACES['Africa/Douala']
  return {
    userId: account.id,
    photo: null,
    jobTitle: DEFAULT_JOB_TITLES[account.accountType] ?? '',
    organization: organization ?? 'Independent',
    city,
    country,
    languages: [account.language],
    about: '',
    specialties: [],
    experiences: [],
    contact: { workEmail: null, phone: null, linkedIn: null },
    privacy: privacy(),
    updatedAt: null,
  }
}
