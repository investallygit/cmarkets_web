import { describe, expect, it } from 'vitest'
import { withParams } from '@/shared/routes/useSearchParamsUpdate'
import { directoryParamsOf, readDirectoryParams } from './directoryParams'

// The search of NET in the URL, screen 10.
describe('directory parameters', () => {
  it('read the search of the screen 10 mockup and the profile open', () => {
    const params = new URLSearchParams(
      'types=analyst,manager,admin&specialty=sovereign-bonds&contactable=1&profile=user-analyst',
    )
    expect(readDirectoryParams(params)).toEqual({
      query: {
        q: undefined,
        types: ['analyst', 'manager'],
        country: undefined,
        specialty: 'sovereign-bonds',
        org: undefined,
        language: undefined,
        contactable: true,
        recent: false,
        sort: 'relevance',
        page: 1,
        pageSize: 20,
      },
      profileId: 'user-analyst',
    })
  })

  it('fall back to the defaults on what they do not know', () => {
    const { query, profileId } = readDirectoryParams(new URLSearchParams('sort=age&page=-3&q=%20'))
    expect(query).toMatchObject({ sort: 'relevance', page: 1, q: undefined, types: [] })
    expect(profileId).toBeNull()
  })

  it('leave the defaults out of the address, and keep what does not change', () => {
    const current = new URLSearchParams('q=bonds&types=trader&profile=user-trader')
    const next = withParams(
      current,
      directoryParamsOf({ types: [], sort: 'relevance', page: 1, contactable: true }),
    )
    expect(next.toString()).toBe('q=bonds&profile=user-trader&contactable=1')
    expect(directoryParamsOf({ sort: 'name', page: 3, country: 'GA' })).toEqual({
      sort: 'name',
      page: '3',
      country: 'GA',
    })
  })
})
