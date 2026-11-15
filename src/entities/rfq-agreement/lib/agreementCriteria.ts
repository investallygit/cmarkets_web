import type {
  RfqAgreementCriteria,
  RfqAgreementRole,
  RfqAgreementSortKey,
  RfqAgreementStatus,
  RfqEmailStatus,
  RfqInstrument,
  RfqSide,
} from '@/shared/api/contracts'
import type { BadgeTone } from '@/shared/ui/Badge'

/** Spec, screen 23: "Awaiting SVT, Concluded, Rejected by an SVT, Expired, Cancelled". */
export const AGREEMENT_STATUSES: readonly RfqAgreementStatus[] = [
  'awaitingSvt',
  'concluded',
  'rejected',
  'expired',
  'cancelled',
]

/** "Agreement e-mail: Sent, Failed, Resent". */
export const EMAIL_STATUSES: readonly RfqEmailStatus[] = ['sent', 'failed', 'resent']

/** An e-mail's status as the mockup colours it: "E-MAIL SENT" green, a failure red. */
export const EMAIL_TONES: Readonly<Record<RfqEmailStatus, BadgeTone>> = {
  sent: 'up',
  failed: 'down',
  resent: 'info',
}

/** "First 15 of 42 · page 1 / 3". */
export const AGREEMENTS_PAGE_SIZE = 15

/** "sort: newest first". */
export const DEFAULT_AGREEMENT_SORT: AgreementSort = { id: 'createdAt', desc: true }

export interface AgreementSort {
  id: RfqAgreementSortKey
  desc: boolean
}

const SORT_KEYS: ReadonlySet<string> = new Set<RfqAgreementSortKey>([
  'number',
  'createdAt',
  'side',
  'security',
  'counterparty',
  'counterpartySvt',
  'buyer',
  'seller',
  'faceAmount',
  'price',
  'settlementAmount',
  'settlementDate',
  'status',
  'emailStatus',
])

/** The face amounts are entered in millions (the mockup's "Face (XAF M)"), sent in francs. */
export const FACE_UNIT = 1_000_000

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The address's parameters of the filters, as the API names them. */
const CRITERIA_KEYS = [
  'from',
  'to',
  'status',
  'emailStatus',
  'side',
  'type',
  'country',
  'securityId',
  'svtId',
  'role',
  'traderId',
  'minFace',
  'maxFace',
  'q',
] as const satisfies readonly (keyof RfqAgreementCriteria)[]

function oneOf<T extends string>(value: string | null, values: readonly T[]): T | undefined {
  return values.find((candidate) => candidate === value)
}

function amount(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : undefined
}

/**
 * The filters the address holds, as the API takes them (`?status=concluded&status=cancelled&
 * minFace=200000000`): applied, so that a reload or a shared link shows the same list. Unknown
 * values are dropped.
 */
export function criteriaFromParams(params: URLSearchParams): RfqAgreementCriteria {
  const text = (key: string) => params.get(key)?.trim() || undefined
  const date = (key: string) => {
    const value = params.get(key)
    return value && ISO_DATE.test(value) ? value : undefined
  }
  const status = params.getAll('status').flatMap((value) => oneOf(value, AGREEMENT_STATUSES) ?? [])
  const emailStatus = params
    .getAll('emailStatus')
    .flatMap((value) => oneOf(value, EMAIL_STATUSES) ?? [])
  const criteria: RfqAgreementCriteria = {
    from: date('from'),
    to: date('to'),
    status: status.length > 0 ? status : undefined,
    emailStatus: emailStatus.length > 0 ? emailStatus : undefined,
    side: oneOf<RfqSide>(params.get('side'), ['buy', 'sell']),
    type: oneOf<RfqInstrument>(params.get('type'), ['BTA', 'OTA']),
    country: text('country'),
    securityId: text('securityId'),
    svtId: text('svtId'),
    role: oneOf<RfqAgreementRole>(params.get('role'), ['requester', 'responder']),
    traderId: text('traderId'),
    minFace: amount(params.get('minFace')),
    maxFace: amount(params.get('maxFace')),
    q: text('q'),
  }
  return withoutBlanks(criteria)
}

/** The criteria without their empty entries: what a query, a key and a saved filter hold. */
export function withoutBlanks(criteria: RfqAgreementCriteria): RfqAgreementCriteria {
  return Object.fromEntries(
    Object.entries(criteria).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0),
    ),
  ) as RfqAgreementCriteria
}

/**
 * The address's parameters for applied criteria, the other parameters kept (the agreement shown,
 * the sort): the criteria's own replaced, a page back to the first.
 */
export function paramsWithCriteria(
  current: URLSearchParams,
  criteria: RfqAgreementCriteria,
): URLSearchParams {
  const next = new URLSearchParams()
  const own = new Set([...CRITERIA_KEYS, 'page'])
  for (const [key, value] of current) if (!own.has(key)) next.append(key, value)
  for (const [key, value] of Object.entries(withoutBlanks(criteria))) {
    for (const item of Array.isArray(value) ? value : [value]) next.append(key, String(item))
  }
  return next
}

/** The order the address holds (`?sort=-faceAmount`), newest first by default. */
export function sortFromParams(params: URLSearchParams): AgreementSort {
  const value = params.get('sort') ?? ''
  const desc = value.startsWith('-')
  const id = desc ? value.slice(1) : value
  return SORT_KEYS.has(id) ? { id: id as RfqAgreementSortKey, desc } : DEFAULT_AGREEMENT_SORT
}

/** The API's spelling of an order: "-faceAmount". */
export function sortParam(sort: AgreementSort): string {
  return `${sort.desc ? '-' : ''}${sort.id}`
}

/** The page the address holds, the first by default. */
export function pageFromParams(params: URLSearchParams): number {
  const page = Number(params.get('page'))
  return Number.isInteger(page) && page > 1 ? page : 1
}

/** How many filters are applied: the period counts once. */
export function appliedCount(criteria: RfqAgreementCriteria): number {
  const keys = Object.keys(withoutBlanks(criteria))
  return keys.length - (keys.includes('from') && keys.includes('to') ? 1 : 0)
}
