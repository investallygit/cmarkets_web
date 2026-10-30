import { describe, expect, it } from 'vitest'
import { cellDate, cellNumber, parseCsv, readTransactionFile } from './transactionFile'

describe('transaction import file', () => {
  it('splits semicolon or comma CSV, with quoted cells', () => {
    expect(parseCsv('﻿date;type;note\r\n2026-10-28;buy;"Lot; first"\r\n')).toEqual([
      ['date', 'type', 'note'],
      ['2026-10-28', 'buy', 'Lot; first'],
    ])
    expect(parseCsv('date,note\n2026-10-28,"He said ""hold"""')).toEqual([
      ['date', 'note'],
      ['2026-10-28', 'He said "hold"'],
    ])
  })

  it('reads dates and numbers as French or English Excel writes them', () => {
    expect(cellDate('2026-10-28')).toBe('2026-10-28')
    expect(cellDate('28/10/2026')).toBe('2026-10-28')
    expect(cellDate(46_323)).toBe('2026-10-28')
    expect(cellDate('31/02/2026')).toBeNull()
    expect(cellNumber('52 500,25')).toBe(52_500.25)
    expect(cellNumber('101.4')).toBe(101.4)
    expect(cellNumber('')).toBeNull()
    expect(Number.isNaN(cellNumber('abc'))).toBe(true)
  })

  it('matches the template columns by their header and skips empty rows', async () => {
    const file = new File(
      [
        'type;date;security;quantity;price;fees;amount;note\n',
        'buy;28/10/2026;SEMC;100;52500;500;;\n',
        ';;;;;;;\n',
        'deposit;2026-10-27;;;;;1000000;Top-up\n',
      ],
      'transactions.csv',
      { type: 'text/csv' },
    )
    const result = await readTransactionFile(file)
    expect(
      'rows' in result && result.rows.map((row) => [row.line, row.cells.type, row.cells.note]),
    ).toEqual([
      [2, 'buy', ''],
      [4, 'deposit', 'Top-up'],
    ])
    expect(await readTransactionFile(new File(['date;type\n'], 'short.csv'))).toEqual({
      error: 'Missing columns: security, quantity, price, fees, amount, note.',
    })
    expect(await readTransactionFile(new File([''], 'notes.txt'))).toEqual({
      error: 'A .csv or .xlsx file of the template.',
    })
  })
})
