import { describe, expect, it } from 'vitest'
import { isEmailAddress, passwordIssues } from './password'

describe('passwordIssues', () => {
  it('asks for 8 characters with a letter and a digit', () => {
    expect(passwordIssues('cmarket2026')).toEqual([])
    expect(passwordIssues('short1')).toEqual(['length'])
    expect(passwordIssues('12345678')).toEqual(['letter'])
    expect(passwordIssues('motdepasse')).toEqual(['digit'])
    expect(passwordIssues('')).toEqual(['length', 'letter', 'digit'])
  })

  it('takes accented letters as letters', () => {
    expect(passwordIssues('élève2026')).toEqual([])
  })
})

describe('isEmailAddress', () => {
  it('needs a name, a domain and a dot', () => {
    expect(isEmailAddress(' k.atangana@analyst.example ')).toBe(true)
    expect(isEmailAddress('k.atangana@analyst')).toBe(false)
    expect(isEmailAddress('k atangana@analyst.example')).toBe(false)
  })
})
