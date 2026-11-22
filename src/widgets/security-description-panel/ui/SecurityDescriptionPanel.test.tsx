import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { descriptionKeys } from '@/entities/security'
import { sessionKeys } from '@/entities/session'
import type { DescriptionDto, MeDto } from '@/shared/api/contracts'
import { SecurityDescriptionPanel } from './SecurityDescriptionPanel'

const me = (permissions: MeDto['permissions']) =>
  ({
    id: 'user',
    accountType: 'analyst',
    permissions,
    modules: [],
    language: 'en',
  }) as unknown as MeDto

const text = (
  language: 'fr' | 'en',
  body: string,
  over: Partial<DescriptionDto> = {},
): DescriptionDto => ({
  language,
  text: body,
  origin: 'cmarket',
  source: language === 'fr' ? "Rapport annuel 2025 de l'émetteur" : "Issuer's 2025 annual report",
  updatedAt: '2026-06-15T08:30:00Z',
  languages: ['fr', 'en'],
  ...over,
})

function renderPanel(
  descriptions: Record<string, Partial<Record<'fr' | 'en', DescriptionDto | null>>>,
  permissions: MeDto['permissions'] = ['market:read'],
) {
  // The texts already in the cache, never stale: the panel renders without a request.
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } })
  client.setQueryData(sessionKeys.me, me(permissions))
  for (const [id, languages] of Object.entries(descriptions))
    for (const [language, value] of Object.entries(languages))
      client.setQueryData(descriptionKeys.shown('security', id, language as 'fr' | 'en'), value)
  const panel = (id: string) => (
    <QueryClientProvider client={client}>
      <SecurityDescriptionPanel id={id} code={id} screen="DES" />
    </QueryClientProvider>
  )
  const { rerender } = render(panel('SEMC'))
  return { user: userEvent.setup(), select: (id: string) => rerender(panel(id)) }
}

describe('SecurityDescriptionPanel (screens 2 and 3)', () => {
  it("shows the screen's language with its source and date, and the other language on a click", async () => {
    const { user } = renderPanel({
      SEMC: {
        en: text('en', 'Mineral water.\nListed on BVMAC.'),
        fr: text('fr', 'Eaux minérales.'),
      },
    })
    expect(screen.getByRole('tab', { name: '[EN]' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/Mineral water\./)).toHaveAttribute('lang', 'en')
    expect(
      screen.getByText(
        "Source: Issuer's 2025 annual report · written by CMarket · updated 15/06/2026",
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'FR' }))
    expect(screen.getByText('Eaux minérales.')).toHaveAttribute('lang', 'fr')
  })

  it('stands in the other language, marked, where the screen has none', () => {
    const french = text('fr', 'Eaux minérales.', { languages: ['fr'] })
    renderPanel({ SEMC: { en: french } })
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByText('FR')).toBeInTheDocument()
    expect(screen.getByText('Not written in English yet: the text in French.')).toBeInTheDocument()
  })

  it("says EODHD's English is EODHD's, and that a security has none", () => {
    const eodhd = text('en', 'Apple designs phones.', {
      origin: 'eodhd',
      source: null,
      languages: ['en'],
    })
    const { select } = renderPanel({ AAPL: { en: eodhd }, NONE: { en: null } })
    select('AAPL')
    expect(
      screen.getByText('Description in English, source EODHD · updated 15/06/2026'),
    ).toBeInTheDocument()
    select('NONE')
    expect(screen.getByText('No description of NONE yet.')).toBeInTheDocument()
  })

  it('offers Edit only to those who write descriptions', () => {
    const { select } = renderPanel(
      { SEMC: { en: text('en', 'Mineral water.') }, OTHER: { en: null } },
      ['market:read', 'descriptions:write'],
    )
    expect(screen.getByRole('button', { name: 'Edit the description of SEMC' })).toBeInTheDocument()
    select('OTHER')
    expect(
      screen.getByRole('button', { name: 'Edit the description of OTHER' }),
    ).toBeInTheDocument()
  })

  it('offers no Edit to a reader', () => {
    renderPanel({ SEMC: { en: text('en', 'Mineral water.') } })
    expect(screen.queryByRole('button', { name: /Edit the description/ })).toBeNull()
  })
})
