import { describe, expect, it } from 'vitest'
import {
  CHANGE_FIELDS,
  IMPORT_TYPES,
  isChangeField,
  isImportType,
  RETIRED_IMPORT_TYPES,
} from './importTypes'

describe('the file types', () => {
  it('offer the CEMAC sovereign yields where the weekly curves file stood, after the auctions', () => {
    expect(IMPORT_TYPES.slice(0, 5)).toEqual([
      'daily-prices',
      'indices',
      'corporate-actions',
      'auctions',
      'cemac-sov-yields',
    ])
    expect(IMPORT_TYPES).not.toContain('curves')
  })

  it('keep the retired curves file a type of the history', () => {
    expect(RETIRED_IMPORT_TYPES).toEqual(['curves'])
    expect(isImportType('curves')).toBe(true)
    expect(isImportType('cemac-sov-yields')).toBe(true)
    expect(isImportType('prices')).toBe(false)
  })

  it('measure a yield move against the point before', () => {
    expect(CHANGE_FIELDS).toContain('yield')
    expect(isChangeField('yield')).toBe(true)
  })
})
