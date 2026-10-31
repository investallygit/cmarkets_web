import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  it("names the page, then the product unless the page's title says it", () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'Market dashboard' as string | null },
    })
    expect(document.title).toBe('Market dashboard · CMarket')
    rerender({ title: 'Log in to CMarket' })
    expect(document.title).toBe('Log in to CMarket')
    // Null leaves the title to another component.
    rerender({ title: null })
    expect(document.title).toBe('Log in to CMarket')
  })
})
