import { describe, expect, it } from 'vitest'
import { toolName } from './toolName'

describe('toolName (B05)', () => {
  it('starts with what the button shows when the title does not hold it', () => {
    expect(toolName('H2', 'Heading 2')).toBe('H2 · Heading 2')
    expect(
      toolName('CMarket security', 'Insert the card of a security: the reader sees its live price'),
    ).toBe('CMarket security · Insert the card of a security: the reader sees its live price')
  })

  it('keeps the title when it holds the label, or when the label is signs only', () => {
    expect(toolName('• List', 'List')).toBe('List')
    expect(toolName('Table', 'Insert a table')).toBe('Insert a table')
    expect(toolName('+ ↓', 'Add a row below')).toBe('Add a row below')
  })
})
