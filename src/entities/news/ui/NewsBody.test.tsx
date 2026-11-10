import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RichTextDoc } from '@/shared/api/contracts'
import { NewsBody } from './NewsBody'

const body: RichTextDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Inflation' }] },
    {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rates stay.' }] }],
    },
    { type: 'image', attrs: { src: '/api/v1/news-files/7', alt: 'BEAC', credit: '© Media I' } },
    { type: 'cmarketSecurity', attrs: { securityId: 'ECMR-6.25-2029', code: 'ECMR 6.25% 29' } },
    { type: 'cmarketSecurity', attrs: {} },
  ],
}

describe('NewsBody', () => {
  it('draws the quotes, the images with their credit and the security cards', () => {
    render(
      <NewsBody
        body={body}
        renderSecurity={(securityId, code) => <p>{`card ${securityId} ${code}`}</p>}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Inflation' })).toBeInTheDocument()
    expect(screen.getByText('Rates stay.').closest('blockquote')).not.toBeNull()
    const figure = screen.getByRole('figure')
    expect(figure).toHaveTextContent('© Media I')
    expect(screen.getByRole('img', { name: 'BEAC' })).toBeInTheDocument()
    // A card without its security draws nothing.
    expect(screen.getAllByText(/^card /).map((card) => card.textContent)).toEqual([
      'card ECMR-6.25-2029 ECMR 6.25% 29',
    ])
  })
})
