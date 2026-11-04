import { beforeAll, describe, expect, it } from 'vitest'

type Db = typeof import('./db')
type Common = typeof import('./handlers/portfolios/common')

describe('portfolios shared with the organisation', () => {
  let db: Db
  let common: Common

  beforeAll(async () => {
    db = await import('./db')
    common = await import('./handlers/portfolios/common')
  })

  const shared = (userId: string) => {
    db.setSessionUser(userId)
    return db
      .sharedPortfolios()
      .map(({ portfolio, owner }) => [portfolio.id, portfolio.name, owner.displayName])
  }

  it('lets E. Fouda, CEO of Asset manager A, read the fund P. Owona shares', () => {
    expect(shared('user-ceo')).toEqual([['portfolio-cemac', 'CEMAC Equity Fund', 'P. Owona']])
    // A CEO holds none of its own.
    expect(db.portfolioStore.read()).toEqual([])
    // Nothing is shared in Bank C, and K. Atangana belongs to no organisation.
    expect(shared('user-trader')).toEqual([])
    expect(shared('user-analyst')).toEqual([])
  })

  it('leaves it to its owner: a colleague reads it, and changes nothing', () => {
    db.setSessionUser('user-ngono')
    const read = common.withPortfolio('portfolios:read', 'portfolio-cemac')
    expect('owner' in read && read.owner?.displayName).toBe('P. Owona')
    // M. Ngono's own sample portfolios carry the user's id, apart from the fund read.
    expect(db.portfolioStore.read().map((portfolio) => portfolio.id)).toEqual([
      'portfolio-cemac-user-ngono',
      'portfolio-banks-user-ngono',
    ])
    for (const permission of ['portfolios:write', 'portfolios:reports'] as const) {
      const write = common.withPortfolio(permission, 'portfolio-cemac')
      expect('response' in write && write.response.status).toBe(403)
    }
  })

  it('shows nothing to a CEO whose status waits for an Admin, or was declined', () => {
    const ceo = db.findAccount('user-ceo')!
    for (const status of ['pending', 'rejected'] as const) {
      ceo.verificationStatus = status
      expect(shared('user-ceo')).toEqual([])
    }
    ceo.verificationStatus = 'approved'
    expect(shared('user-ceo')).toHaveLength(1)
  })

  it('stops when the owner stops sharing or leaves the organisation', () => {
    db.setSessionUser('user-manager')
    const portfolios = db.portfolioStore.read()
    db.portfolioStore.write(
      portfolios.map((portfolio) => ({ ...portfolio, sharedWithOrganization: false })),
    )
    expect(shared('user-ceo')).toEqual([])
    db.portfolioStore.write(portfolios, 'user-manager')
    expect(shared('user-ceo')).toHaveLength(1)

    const owner = db.findAccount('user-manager')!
    owner.organizationId = null
    expect(shared('user-ceo')).toEqual([])
    owner.organizationId = 'org-am'
  })
})
