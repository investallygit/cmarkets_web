import { describe, expect, it } from 'vitest'
import { SCREENS } from './screens'

/** The codes of the left menu, in order, before the account's permissions hide some. */
const menu = (audience: 'client' | 'backoffice') =>
  SCREENS.filter((screen) => screen.inMenu && screen.audience === audience).map(
    (screen) => screen.menuCode ?? screen.code,
  )

describe('the left menu (spec section 9)', () => {
  it('gives ETFS, BP, BS and FX entries of their own, after the screens their mockups light', () => {
    // FX (screen 26) after MKT, ROADMAP decision 15.
    expect(menu('client')).toEqual([
      'MKT',
      'FX',
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
