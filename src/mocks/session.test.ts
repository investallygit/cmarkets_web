import { beforeAll, describe, expect, it } from 'vitest'

type Db = typeof import('./db')

describe('the session of the mock', () => {
  let db: Db

  beforeAll(async () => {
    db = await import('./db')
  })

  it('answers a request already let through for its user, after a logout', () => {
    db.setSessionUser('user-analyst')
    // The auth gate lets a request through, which then waits for its latency; the user logs out.
    db.setRequestUser('user-analyst')
    db.endSession()
    expect(db.currentAccount().id).toBe('user-analyst')
    // Nobody's alerts are watched until the next login.
    expect(db.hasSession()).toBe(false)
    db.setSessionUser('user-student')
    expect(db.hasSession()).toBe(true)
    expect(db.currentAccount().id).toBe('user-student')
  })
})
