import { describe, expect, it } from 'vitest'
import type { ExportCatalogDto, ExportDatasetDto } from '@/shared/api/contracts'
import {
  defaultSettings,
  downloadSearch,
  isComplete,
  selectionOf,
  settingsFromSearch,
  withSelection,
  withTable,
} from './settings'

const limits: ExportCatalogDto['limits'] = {
  profile: 'manager',
  perDay: 50,
  usedToday: 4,
  rowsPerFile: 1_000_000,
  historyYears: null,
  earliest: null,
  csvOnly: false,
  schedules: 10,
  schedulesUsed: 1,
  immediateRows: 50_000,
}
const prices: ExportDatasetDto = {
  dataset: 'prices',
  screens: ['DES'],
  fields: ['date', 'open', 'close', 'valueTraded'],
  defaultFields: ['date', 'open', 'close'],
}
const today = new Date('2026-11-12T10:00:00Z')

describe('DL settings', () => {
  it('opens a dataset with the mockup items, the last year, daily, XLSX one sheet per security', () => {
    const settings = defaultSettings(prices, limits, today, 'en', 'Africa/Douala')

    expect(settings).toMatchObject({
      dataset: 'prices',
      securities: ['SEMC', 'BANGE', 'IWDA'],
      from: '2025-11-12',
      to: '2026-11-12',
      frequency: 'day',
      fields: ['date', 'open', 'close'],
      format: 'xlsx',
      layout: 'sheets',
      decimal: 'point',
      adjusted: false,
    })
    expect(isComplete(settings)).toBe(true)
  })

  it('holds a Student to CSV, a comma in French, and the history the profile reaches', () => {
    const student = { ...limits, csvOnly: true, earliest: '2025-11-20' }
    const settings = defaultSettings(prices, student, today, 'fr', 'Africa/Douala')

    expect(settings).toMatchObject({ format: 'csv', decimal: 'comma', from: '2025-11-20' })
  })

  it('keeps the items of a dataset the catalogue knows, and edits the selection of each kind', () => {
    const fx: ExportDatasetDto = {
      dataset: 'fx',
      screens: ['FX'],
      fields: ['date'],
      defaultFields: ['date'],
      choices: [{ code: 'GBP', nameEn: 'GBP', nameFr: 'GBP' }],
    }
    const settings = defaultSettings(fx, limits, today, 'en', 'UTC')

    expect(selectionOf(settings)).toEqual(['GBP'])
    expect(selectionOf(withSelection(settings, []))).toEqual([])
    expect(isComplete(withSelection(settings, []))).toBe(false)
  })

  it('opens a portfolio on its first table, and the RFQ without a selection', () => {
    const portfolios: ExportDatasetDto = {
      dataset: 'portfolios',
      screens: ['PORT'],
      fields: ['date', 'value'],
      defaultFields: ['date', 'value'],
      choices: [{ code: 'p-1', nameEn: 'Fund A', nameFr: 'Fund A' }],
      tables: [
        { table: 'performance', fields: ['date', 'value'], defaultFields: ['date', 'value'] },
        { table: 'positions', fields: ['code', 'value'], defaultFields: ['code'] },
      ],
    }
    const settings = defaultSettings(portfolios, limits, today, 'en', 'UTC')
    expect(settings).toMatchObject({ portfolios: ['p-1'], table: 'performance' })
    expect(withTable(settings, portfolios, 'positions')).toMatchObject({
      table: 'positions',
      fields: ['code'],
    })
    const rfq: ExportDatasetDto = {
      dataset: 'rfq',
      screens: ['RFQ'],
      fields: ['date'],
      defaultFields: ['date'],
    }
    expect(isComplete(defaultSettings(rfq, limits, today, 'en', 'UTC'))).toBe(true)
  })

  it("fills DL in from a Download button's address", () => {
    const search = new URLSearchParams(
      downloadSearch('prices', { items: ['BANGE'], from: '2026-01-01' }).slice(1),
    )
    const settings = settingsFromSearch(
      defaultSettings(prices, limits, today, 'en', 'UTC'),
      prices,
      search,
    )

    expect(search.get('dataset')).toBe('prices')
    expect(settings).toMatchObject({ securities: ['BANGE'], from: '2026-01-01', to: '2026-11-12' })
  })
})
