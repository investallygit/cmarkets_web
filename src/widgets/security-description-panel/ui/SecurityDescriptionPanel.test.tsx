import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { securityKeys } from '@/entities/security'
import type { SecurityDescriptionDto, SecurityProfileDto } from '@/shared/api/contracts'
import { SecurityDescriptionPanel } from './SecurityDescriptionPanel'

const written = (text: string, source: 'dataAdmin' | 'eodhd' = 'dataAdmin') => ({
  text,
  source,
  updatedAt: '2026-11-12T08:30:00Z',
})

function renderPanel(description: SecurityDescriptionDto, others: SecurityProfileDto[] = []) {
  // The profiles already in the cache, never stale: the panel renders without a request.
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  for (const profile of [
    { id: 'SEMC', code: 'SEMC', description } as SecurityProfileDto,
    ...others,
  ])
    client.setQueryData(securityKeys.profile(profile.id), profile)
  const panel = (id: string) => (
    <QueryClientProvider client={client}>
      <SecurityDescriptionPanel securityId={id} code={id} />
    </QueryClientProvider>
  )
  const { rerender } = render(panel('SEMC'))
  return { user: userEvent.setup(), select: (id: string) => rerender(panel(id)) }
}

describe('SecurityDescriptionPanel (screen 3)', () => {
  it("shows the screen's language, its source, and the other language on a click", async () => {
    const { user } = renderPanel({
      fr: written('Eaux minérales.\nCotée à la BVMAC.'),
      en: written('Mineral water.\nListed on BVMAC.'),
    })
    expect(screen.getByText('Source: Data admin')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '[EN]' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/Mineral water\./)).toHaveAttribute('lang', 'en')

    await user.click(screen.getByRole('tab', { name: 'FR' }))
    expect(screen.getByText(/Eaux minérales\./)).toHaveAttribute('lang', 'fr')
  })

  it('stands in the other language, marked, where the screen has none', () => {
    renderPanel({ fr: written('Eaux minérales.'), en: null })
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByText('FR')).toBeInTheDocument()
    expect(screen.getByText('Not written in English yet: the text in French.')).toBeInTheDocument()
  })

  it("keeps the reader's choice for the next security, without a note where the screen's language is written", async () => {
    const reinsurer = {
      id: 'SCG-RE',
      code: 'SCG-RE',
      description: { fr: null, en: written('Reinsures insurers.') },
    } as SecurityProfileDto
    const { user, select } = renderPanel(
      { fr: written('Eaux minérales.'), en: written('Mineral water.') },
      [reinsurer],
    )
    await user.click(screen.getByRole('tab', { name: 'FR' }))
    select('SCG-RE')
    expect(screen.getByText('Reinsures insurers.')).toHaveAttribute('lang', 'en')
    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.queryByText(/Not written in English yet/)).toBeNull()
  })

  it("says so when the security has no description, EODHD's English included", () => {
    renderPanel({ fr: null, en: null })
    expect(screen.getByText('No description of SEMC yet.')).toBeInTheDocument()
  })
})
