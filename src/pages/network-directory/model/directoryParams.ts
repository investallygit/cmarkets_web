import { DIRECTORY_PAGE_SIZE, DIRECTORY_SORTS } from '@/entities/profile'
import {
  CLIENT_ACCOUNT_TYPES,
  type ClientAccountType,
  type DirectoryQuery,
} from '@/shared/api/contracts'

/**
 * The search of NET and the profile open, as the URL keeps them:
 * /net?types=analyst,manager&specialty=sovereign-bonds&contactable=1&profile=user-analyst.
 */
export interface DirectoryParams {
  query: DirectoryQuery
  /** Chosen among the results; none: the first one shows. */
  profileId: string | null
}

const isClientType = (value: string): value is ClientAccountType =>
  CLIENT_ACCOUNT_TYPES.some((type) => type === value)

const TEXT_PARAMS = ['q', 'country', 'specialty', 'org', 'language'] as const

export function readDirectoryParams(params: URLSearchParams): DirectoryParams {
  const text = (name: (typeof TEXT_PARAMS)[number]) => params.get(name)?.trim() || undefined
  return {
    query: {
      q: text('q'),
      types: (params.get('types') ?? '').split(',').filter(isClientType),
      country: text('country'),
      specialty: text('specialty'),
      org: text('org'),
      language: text('language'),
      contactable: params.get('contactable') === '1',
      recent: params.get('recent') === '1',
      sort: DIRECTORY_SORTS.find((sort) => sort === params.get('sort')) ?? 'relevance',
      page: Math.max(1, Math.floor(Number(params.get('page'))) || 1),
      pageSize: DIRECTORY_PAGE_SIZE,
    },
    profileId: params.get('profile') || null,
  }
}

/**
 * The URL parameters of a change of the search, for withParams: an empty one is removed, so the
 * defaults (every type, relevance, the first page) leave the address short.
 */
export function directoryParamsOf(change: Partial<DirectoryQuery>): Record<string, string> {
  const values: Record<string, string> = {}
  for (const name of TEXT_PARAMS) {
    if (name in change) values[name] = change[name] ?? ''
  }
  if ('types' in change) values.types = (change.types ?? []).join(',')
  if ('contactable' in change) values.contactable = change.contactable ? '1' : ''
  if ('recent' in change) values.recent = change.recent ? '1' : ''
  if ('sort' in change) values.sort = change.sort === 'relevance' ? '' : (change.sort ?? '')
  if ('page' in change) values.page = (change.page ?? 1) > 1 ? String(change.page) : ''
  return values
}
