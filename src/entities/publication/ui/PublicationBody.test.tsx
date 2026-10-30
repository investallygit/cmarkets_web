import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RichTextDoc } from '@/shared/api/contracts'
import { PublicationBody } from './PublicationBody'

const link = (text: string, href: string) => ({
  type: 'text',
  text,
  marks: [{ type: 'link', attrs: { href } }],
})

const body: RichTextDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '1. Valuation' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Target ', marks: [{ type: 'bold' }] },
        link('BVMAC', 'https://www.bvm-ac.org'),
        { type: 'text', text: ' and ' },
        link('a trap', 'javascript:alert(1)'),
      ],
    },
    { type: 'image', attrs: { src: 'javascript:alert(2)', alt: 'trap' } },
    { type: 'image', attrs: { src: 'data:image/png;base64,iVBORw0KGgo=', alt: 'Volumes' } },
    { type: 'cmarketChart', attrs: { chartId: 'missing' } },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'XAF M' }] }],
            },
          ],
        },
      ],
    },
  ],
}

describe('PublicationBody', () => {
  it('draws the editor nodes, following safe links and images only', () => {
    render(<PublicationBody body={body} charts={[]} />)
    expect(screen.getByRole('heading', { level: 2, name: '1. Valuation' })).toBeInTheDocument()
    expect(screen.getByText('Target').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'BVMAC' })).toHaveAttribute(
      'rel',
      'noopener noreferrer nofollow',
    )
    // A script address stays plain text.
    expect(screen.queryByRole('link', { name: 'a trap' })).toBeNull()
    expect(screen.getByText(/and a trap$/)).toBeInTheDocument()
    expect(screen.getAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual([
      'Volumes',
    ])
    expect(screen.getByRole('columnheader', { name: 'XAF M' })).toBeInTheDocument()
  })
})
