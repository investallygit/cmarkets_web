import { describe, expect, it } from 'vitest'
import { SCREENS } from './screens'

/** The codes of the left menu, in order, before the account's permissions hide some. */
const menu = (audience: 'client' | 'backoffice') =>
  SCREENS.filter((screen) => screen.inMenu && screen.audience === audience).map(
    (screen) => screen.menuCode ?? screen.code,
  )

describe('the left menu (spec section 9)', () => {
  it('gives ETFS, BP and BS entries of their own, after EQS and YCRV, which their mockups light', () => {
    expect(menu('client')).toEqual([
      'MKT',
      'EQS',
      'ETFS',
      'YCRV',
      'BP',
      'BS',
      'PORT',
      'PUB',
      'NET',
      'MSG',
      'N',
      'NEWS',
      'ALRT',
      'CFG',
    ])
  })

  it('keeps the screens opened from another one out of it', () => {
    const outside = SCREENS.filter((screen) => !screen.inMenu).map((screen) => screen.id)
    expect(outside).toEqual(['DES', 'PUBNEW', 'CAL', 'NETME'])
  })
})
