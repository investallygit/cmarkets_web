import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StoredDescriptionDto } from '@/shared/api/contracts'
import { dataAdminApi } from '@/shared/api/endpoints'
import { DescriptionForm } from './DescriptionForm'

// SCG-RE as the demo has it: the Data admin's English only.
const stored: StoredDescriptionDto = {
  securityId: 'SCG-RE',
  fr: null,
  en: { text: 'Reinsures insurers.', updatedAt: '2026-11-03T07:30:00Z', updatedBy: 'A. Mbarga' },
  eodhd: null,
}

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <DescriptionForm stored={stored} code="SCG-RE" />
    </QueryClientProvider>,
  )
  return userEvent.setup()
}

const save = () => screen.getByRole('button', { name: 'Save the description' })

afterEach(() => vi.restoreAllMocks())

describe('DescriptionForm (CORR)', () => {
  it('says what EQS shows of each language and saves the texts trimmed, an empty one removed', async () => {
    const describeSecurity = vi.spyOn(dataAdminApi, 'describe').mockResolvedValue(stored)
    const user = renderForm()
    expect(save()).toBeDisabled()
    expect(
      screen.getByText('0 / 2,000 characters · empty: EQS shows the English text, marked'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/^19 \/ 2,000 characters · written by A\. Mbarga on /),
    ).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'French' }), '  Réassure les assureurs.  ')
    await user.clear(screen.getByRole('textbox', { name: 'English' }))
    expect(
      screen.getByText('0 / 2,000 characters · written by A. Mbarga on', { exact: false }),
    ).toBeInTheDocument()
    await user.click(save())

    expect(describeSecurity).toHaveBeenCalledWith('SCG-RE', {
      fr: 'Réassure les assureurs.',
      en: null,
    })
  })

  it('refuses a text over 2,000 characters before asking the server', async () => {
    const describeSecurity = vi.spyOn(dataAdminApi, 'describe')
    const user = renderForm()
    await user.click(screen.getByRole('textbox', { name: 'French' }))
    await user.paste('a'.repeat(2_001))
    await user.click(save())

    expect(screen.getByText('2,000 characters at most.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'French' })).toHaveAttribute('aria-invalid', 'true')
    expect(describeSecurity).not.toHaveBeenCalled()
  })
})
