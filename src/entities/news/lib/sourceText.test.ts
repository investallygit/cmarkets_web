import { describe, expect, it } from 'vitest'
import { displayUrl, initials } from './sourceText'

describe('initials', () => {
  it('takes the first letters of the first two words', () => {
    expect(initials('Media I')).toBe('MI')
    expect(initials('Éco Hebdo')).toBe('ÉH')
    expect(initials('Tchad Matin Info')).toBe('TM')
  })

  it('takes the first two letters of a single word', () => {
    expect(initials('CMarket')).toBe('CM')
  })
})

describe('displayUrl', () => {
  it('drops the scheme and a trailing slash', () => {
    expect(displayUrl('https://daily-z.example/article/12345')).toBe(
      'daily-z.example/article/12345',
    )
    expect(displayUrl('http://agency-x.example/')).toBe('agency-x.example')
  })
})
