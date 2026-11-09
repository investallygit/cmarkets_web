import { describe, expect, it } from 'vitest'
import { splitSiteLinks } from './siteLinks'

const ORIGIN = 'https://cmarket.example'

describe('splitSiteLinks', () => {
  it('opens the addresses of this site in the app, the sentence around them kept', () => {
    expect(splitSiteLinks(`Read this: ${ORIGIN}/n?article=0f8f-a165. Worth it.`, ORIGIN)).toEqual([
      { text: 'Read this: ' },
      { text: `${ORIGIN}/n?article=0f8f-a165`, path: '/n?article=0f8f-a165' },
      { text: '. Worth it.' },
    ])
  })

  it('finds several, and keeps the path, the query and the hash', () => {
    expect(
      splitSiteLinks(`${ORIGIN}/mkt and ${ORIGIN}/port/p1/risk?view=1#limits`, ORIGIN),
    ).toEqual([
      { text: `${ORIGIN}/mkt`, path: '/mkt' },
      { text: ' and ' },
      { text: `${ORIGIN}/port/p1/risk?view=1#limits`, path: '/port/p1/risk?view=1#limits' },
    ])
  })

  it('leaves the addresses of other sites as plain text', () => {
    const text = `See https://example.com/n?article=1 and http://cmarket.example/mkt (${ORIGIN}.evil.example/x)`
    expect(splitSiteLinks(text, ORIGIN)).toEqual([{ text }])
  })

  it('returns a text without addresses whole, and nothing for an empty one', () => {
    expect(splitSiteLinks('No link here.', ORIGIN)).toEqual([{ text: 'No link here.' }])
    expect(splitSiteLinks('', ORIGIN)).toEqual([])
  })
})
