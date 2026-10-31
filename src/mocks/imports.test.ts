import { beforeAll, describe, expect, it, vi } from 'vitest'

// Friday 30 October 2026, 19:00 in Douala: the session's files are in, the auctions being checked.
const NOW = Date.parse('2026-10-30T18:00:00Z')

type Db = typeof import('./db')
type Store = typeof import('./imports')
type Bars = typeof import('./lib/bars')

describe('data import store', () => {
  let db: Db
  let store: Store
  let bars: Bars

  beforeAll(async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    db = await import('./db')
    store = await import('./imports')
    bars = await import('./lib/bars')
    db.setSessionUser('user-data-admin')
  })

  const later = (minutes: number) => vi.setSystemTime(Date.now() + minutes * 60_000)
  const pendingAuctions = () => {
    const pending = store.findImport('import-seed-auctions')
    if (!pending) throw new Error('No seeded auctions file')
    return pending
  }
  const close = (securityId: string, day: string) => {
    const security = db.securities.get(securityId)
    if (!security) throw new Error(securityId)
    return bars.priceHistory(security, day, day, '1d')[0]
  }

  it('seeds the uploads of the screen 6 mockup, the BEAC auctions waiting with one alert', () => {
    const dto = store.importDto(pendingAuctions())
    // Today's 26-week Cameroon BTA is already stored (screen 4 mockup): unchanged.
    expect(dto).toMatchObject({
      status: 'ready',
      sessionDate: '2026-10-30',
      counts: { read: 6, new: 5, unchanged: 1, alerts: 1, alertsChecked: 0, errors: 0 },
    })
    const gabon = pendingAuctions().rows.find((row) => row.values.country === 'GA')
    expect(gabon?.issues.map((issue) => issue.message)).toEqual([
      'Rate +1.40 pt vs previous (threshold 1.00)',
    ])
    const republished = store.importStore
      .read()
      .find((stored) => stored.type === 'daily-prices' && stored.rollback)
    expect(republished).toMatchObject({ status: 'published', uploadedBy: 'J. Ekane' })
  })

  it('reports the coverage of the session', () => {
    const items = Object.fromEntries(
      store.coverage('2026-10-30').items.map((item) => [item.type, item]),
    )
    expect(items['daily-prices']).toMatchObject({ status: 'published', published: 1 })
    expect(items.auctions.status).toBe('checking')
    // The weekly curves come on Fridays.
    expect(items.curves.status).toBe('published')
    expect(items['financial-statements'].status).toBe('none')
    expect(store.coverage('2026-10-28').items.find((item) => item.type === 'curves')).toMatchObject(
      {
        status: 'expected',
        dueOn: '2026-10-30',
      },
    )
  })

  it('publishes once the alert is checked, and a rollback takes the rows out', () => {
    const pending = pendingAuctions()
    const gabon = pending.rows.find((row) => row.values.country === 'GA')
    const published = () =>
      store
        .currentAuctions()
        .find(
          (auction) =>
            auction.country === 'GA' && auction.term === 13 && auction.date === '2026-10-30',
        )
    expect(published()).toBeUndefined()
    store.patchRow(pending, gabon?.id ?? '', { checked: true })
    expect(store.importDto(pending).counts.alertsChecked).toBe(1)
    store.publishImport(pending)
    expect(published()).toMatchObject({ averageRate: 7.45, coverRatio: 0.82 })
    store.rollBackImport(pending, 'Gabon rate to check with the BEAC.')
    expect(published()).toBeUndefined()
    expect(store.importDto(pending)).toMatchObject({
      status: 'rolledBack',
      rollback: { by: 'A. Mbarga', reason: 'Gabon rate to check with the BEAC.' },
    })
  })

  it('stores a published session in place of the generated one, then a correction over it', () => {
    const day = '2026-10-29'
    const generated = close('SEMC', day)
    const file = { ...generated, close: generated.close + 100, high: generated.high + 100 }
    const upload = store.startImport({
      type: 'daily-prices',
      fileName: 'cours_bvmac_20261029.csv',
      sessionDate: day,
      columns: ['date', 'code', 'open', 'high', 'low', 'close', 'volume'],
      rows: [{ line: 2, cells: { date: day, code: 'SEMC', ...file } }],
      replaces: undefined,
    })
    expect(store.importDto(upload).status).toBe('format')
    later(1)
    expect(store.importDto(upload)).toMatchObject({
      status: 'ready',
      counts: { read: 1, changed: 1, errors: 0 },
    })
    store.publishImport(upload)
    expect(close('SEMC', day).close).toBe(file.close)
    expect(store.storedPrices('SEMC', day, day)[0]).toMatchObject({
      source: 'file',
      importId: upload.id,
    })

    later(1)
    const correction = store.correctPrice('SEMC', day, {
      ...file,
      close: file.close + 50,
      high: file.high + 50,
      reason: 'Close of the BVMAC bulletin.',
    })
    expect(correction.before.close).toBe(file.close)
    expect(close('SEMC', day).close).toBe(file.close + 50)
    // A later correction outlives the rollback of the file.
    store.rollBackImport(upload, 'Wrong file.')
    expect(close('SEMC', day).close).toBe(file.close + 50)
    expect(store.storedPrices('SEMC', day, day)[0].source).toBe('correction')
  })
})
