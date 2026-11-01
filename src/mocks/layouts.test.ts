import { beforeAll, describe, expect, it } from 'vitest'
import type { LayoutItemDto } from '@/shared/api/contracts'
import { layoutError } from './lib/layouts'

type Db = typeof import('./db')

const ITEMS: LayoutItemDto[] = [{ i: 'rates', x: 0, y: 0, w: 4, h: 6 }]

describe('the screen layouts of the mock', () => {
  let db: Db

  beforeAll(async () => {
    db = await import('./db')
  })

  it('reads a layout saved before panels could be hidden: the positions alone', () => {
    db.setSessionUser('user-analyst')
    localStorage.setItem('cmarket.prototype.layout.user-analyst.MKT', JSON.stringify(ITEMS))
    expect(db.readLayout('MKT')).toEqual({ items: ITEMS })
    db.writeLayout('MKT', { items: ITEMS, hidden: ['news'], locked: true })
    expect(db.readLayout('MKT')).toEqual({ items: ITEMS, hidden: ['news'], locked: true })
  })

  it('checks a layout as the server would before saving it', () => {
    expect(layoutError({ items: ITEMS })).toBeNull()
    expect(
      layoutError({
        items: ITEMS,
        hidden: ['news'],
        stacked: ['rates', 'news'],
        locked: true,
        saved: [{ name: 'Morning', items: ITEMS, hidden: [] }],
      }),
    ).toBeNull()
    expect(layoutError({})).toMatch(/^items/)
    expect(layoutError({ items: [{ ...ITEMS[0]!, w: 0 }] })).toMatch(/^items/)
    expect(layoutError({ items: ITEMS, hidden: [1] as unknown as string[] })).toMatch(/hidden/)
    expect(layoutError({ items: ITEMS, locked: 'yes' as unknown as boolean })).toMatch(/locked/)
  })

  it('takes up to ten saved layouts, each with its own name', () => {
    const named = (name: string) => ({ name, items: ITEMS })
    expect(layoutError({ items: ITEMS, saved: [named('  ')] })).toMatch(/name of 1 to 40/)
    expect(layoutError({ items: ITEMS, saved: [named('Morning'), named('morning ')] })).toMatch(
      /Two saved layouts/,
    )
    const eleven = Array.from({ length: 11 }, (_, index) => named(`Layout ${index}`))
    expect(layoutError({ items: ITEMS, saved: eleven })).toMatch(/up to 10/)
  })
})
