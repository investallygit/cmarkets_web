import { describe, expect, it } from 'vitest'
import { loginPath, safeNextPath, signUpPath } from './paths'

describe('the way in and out of the login pages', () => {
  it('brings the user back to the page asked for, and to the home screen otherwise', () => {
    expect(loginPath('/port/portfolio-cemac/risk')).toBe(
      '/login?next=%2Fport%2Fportfolio-cemac%2Frisk',
    )
    // The home page and /app lead to the home screen anyway.
    expect(loginPath('/')).toBe('/login')
    expect(loginPath('/app')).toBe('/login')
    expect(loginPath()).toBe('/login')
  })

  it('goes back to a page of this site only', () => {
    expect(safeNextPath('/eqs')).toBe('/eqs')
    expect(safeNextPath(null)).toBe('/app')
    expect(safeNextPath('https://example.com')).toBe('/app')
    expect(safeNextPath('//example.com')).toBe('/app')
    expect(safeNextPath('/\\example.com')).toBe('/app')
    // The URL parser drops tabs and line breaks: these are "//example.com" too.
    expect(safeNextPath('/\t/example.com')).toBe('/app')
    expect(safeNextPath('/\n/example.com')).toBe('/app')
    expect(safeNextPath('/\r/example.com')).toBe('/app')
    expect(safeNextPath('/port/portfolio-cemac/risk?view=1#limits')).toBe(
      '/port/portfolio-cemac/risk?view=1#limits',
    )
  })

  it('opens the sign-up with the account type the home page offers', () => {
    expect(signUpPath('analyst')).toBe('/signup?type=analyst')
    expect(signUpPath()).toBe('/signup')
  })
})
