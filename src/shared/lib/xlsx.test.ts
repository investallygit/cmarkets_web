import { describe, expect, it } from 'vitest'
import { toXlsxSheet } from './xlsx'

describe('toXlsxSheet', () => {
  it('puts the header in bold and keeps numbers as numbers', () => {
    const { data } = toXlsxSheet([
      ['Security', 'Last'],
      ['SEMC', 52500],
      ['BANGE', null],
    ])
    expect(data).toEqual([
      [
        { value: 'Security', fontWeight: 'bold' },
        { value: 'Last', fontWeight: 'bold' },
      ],
      ['SEMC', 52500],
      ['BANGE', null],
    ])
  })

  it('sizes each column on its longest value, within limits', () => {
    const { columns } = toXlsxSheet([
      ['Code', 'Name'],
      ['SEMC', 'Société des Eaux Minérales du Cameroun'],
      ['X', 'A'.repeat(80)],
    ])
    expect(columns).toEqual([{ width: 8 }, { width: 50 }])
  })
})
