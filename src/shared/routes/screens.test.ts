import { describe, expect, it } from 'vitest'
import { SCREENS } from './screens'

/** The codes of the left menu, in order, before the account's permissions hide some. */
const menu = (audience: 'client' | 'backoffice') =>
  SCREENS.filter((screen) => screen.inMenu && screen.audience === audience).map(
    (screen) => screen.menuCode ?? screen.code,
  )

describe('the left menu (spec section 9)', () => {
  it('gives ETFS, BP, BS, CMDTY, ECO, FX, RFQ and OPT entries of their own, after the screens their mockups light', () => {
    // CMDTY (screen 21), ECO (screen 25) and FX (screen 26) after MKT, RFQ (screen 22) after BS,
    // OPT (screens 28 and 29) after PORT, ROADMAP decision 15; TRD, the SVT's trader links, in the
    // SVT's own menu (decision 16).
    expect(menu('client')).toEqual([
      'MKT',
      'CMDTY',
      'ECO',
      'FX',
      'EQS',
      'ETFS',
      'YCRV',
      'BP',
      'BS',
      'RFQ',
      'TRD',
      'PORT',
      'OPT',
      'PUB',
      'NET',
      'MSG',
      'N',
      'NEWS',
      'ALRT',
      'CFG',
    ])
  })

  it('gives the Admin an RFQ entry before its settings, RFQ REP its screen (ROADMAP decision 17)', () => {
    expect(menu('backoffice')).toEqual([
      'DATA',
      'IMP',
      'CORR',
      'NEWS',
      'EODH',
      'HIST',
      'USER',
      'SUBS',
      'MPAY',
      'SRC',
      'ANLY',
      'MOD',
      'PAY',
      'RFQ',
      'CFG',
      'AUDT',
    ])
  })

  it('keeps the screens opened from another one out of it', () => {
    const outside = SCREENS.filter((screen) => !screen.inMenu).map((screen) => screen.id)
    expect(outside).toEqual(['DES', 'PUBNEW', 'CAL', 'NETME', 'OPTRES'])
  })
})
