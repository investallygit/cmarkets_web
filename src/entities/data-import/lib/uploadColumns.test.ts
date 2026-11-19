import { describe, expect, it } from 'vitest'
import type { ImportTypeDto } from '@/shared/api/contracts'
import { uploadColumns } from './uploadColumns'

const dailyPrices: ImportTypeDto = {
  type: 'daily-prices',
  frequency: 'session',
  columns: [
    { name: 'date', kind: 'date', required: true },
    { name: 'code', kind: 'code', required: true },
    { name: 'close', kind: 'number', required: true },
    { name: 'volume', kind: 'integer', required: false },
  ],
  checks: [],
  changeThreshold: null,
}

describe('uploadColumns', () => {
  it("takes today's template, in its order, with the columns the file has", () => {
    const columns = uploadColumns({ type: 'daily-prices', columns: ['close', 'code', 'date'] }, [
      dailyPrices,
    ])
    expect(columns.map((column) => column.name)).toEqual(['date', 'code', 'close'])
  })

  it('reads a retired file with the template it had, which the API no longer lists', () => {
    const columns = uploadColumns(
      { type: 'curves', columns: ['date', 'country', 'maturity', 'rate'] },
      [dailyPrices],
    )
    expect(columns.map(({ name, kind }) => `${name}:${kind}`)).toEqual([
      'date:date',
      'country:text',
      'maturity:text',
      'rate:rate',
    ])
  })

  it('reads the columns of a file no template describes as text', () => {
    const columns = uploadColumns({ type: 'macro', columns: ['indicator', 'year'] }, [])
    expect(columns).toEqual([
      { name: 'indicator', kind: 'text', required: false },
      { name: 'year', kind: 'text', required: false },
    ])
  })
})
