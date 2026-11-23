import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reloadForNewBuild } from './newBuild'

const html = (entry: string) =>
  `<!doctype html><html><head><script type="module" crossorigin src="${entry}"></script></head></html>`

const serves = (body: string, init?: ResponseInit) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, init))),
  )

describe('reloadForNewBuild', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.head.innerHTML = '<script type="module" src="/assets/index-old.js"></script>'
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    document.head.innerHTML = ''
  })

  it('reloads a tab the site was released under, once a build', async () => {
    const reload = vi.fn()
    serves(html('/assets/index-new.js'))
    expect(await reloadForNewBuild(reload)).toBe(true)
    // The reload brought the old build again (a cache in between): no loop.
    expect(await reloadForNewBuild(reload)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
    serves(html('/assets/index-newer.js'))
    expect(await reloadForNewBuild(reload)).toBe(true)
  })

  it('asks the server, not the browser cache', async () => {
    serves(html('/assets/index-new.js'))
    await reloadForNewBuild(vi.fn())
    expect(fetch).toHaveBeenCalledWith('/', { cache: 'no-store' })
  })

  it.each([
    ['the same build', html('/assets/index-old.js'), undefined],
    ['a page that is not the site', '<html><body>Sign in to the Wi-Fi</body></html>', undefined],
    ['an error', html('/assets/index-new.js'), { status: 503 }],
  ])('stays on %s', async (_, body, init) => {
    const reload = vi.fn()
    serves(body, init)
    expect(await reloadForNewBuild(reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })

  it('stays when the site is out of reach', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    const reload = vi.fn()
    expect(await reloadForNewBuild(reload)).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
