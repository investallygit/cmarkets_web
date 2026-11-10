import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { newsExtensions } from './newsExtensions'

// The card's live price is the reader's: the editor's node view is not drawn here.
vi.mock('@tiptap/react', async (original) => ({
  ...(await original<typeof import('@tiptap/react')>()),
  ReactNodeViewRenderer: () => () => ({ dom: document.createElement('aside') }),
}))

let editor: Editor | null = null
afterEach(() => editor?.destroy())

describe('the nodes of the news editor', () => {
  it('keeps an image with its credit and a security card with its code', () => {
    editor = new Editor({
      extensions: newsExtensions(''),
      content: {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: { src: '/api/v1/news-files/7', alt: 'BEAC', credit: '© Media I' },
          },
          { type: 'cmarketSecurity', attrs: { securityId: 'SEMC', code: 'SEMC' } },
          {
            type: 'blockquote',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Q' }] }],
          },
        ],
      },
    })
    const json = editor.getJSON()
    expect(json.content?.[0]).toMatchObject({
      type: 'image',
      attrs: { credit: '© Media I', src: '/api/v1/news-files/7' },
    })
    expect(json.content?.[1]).toMatchObject({
      type: 'cmarketSecurity',
      attrs: { securityId: 'SEMC', code: 'SEMC' },
    })
    expect(json.content?.[2]?.type).toBe('blockquote')
    expect(editor.view.dom.querySelector('figcaption')?.textContent).toBe('© Media I')
  })

  it('brings pasted HTML down to the nodes of spec section 16', () => {
    editor = new Editor({
      extensions: newsExtensions(''),
      content: '<h1>Title</h1><p><s>struck</s> <code>code</code></p><hr>',
    })
    const types = JSON.stringify(editor.getJSON())
    expect(types).not.toMatch(/"(strike|code|horizontalRule)"/)
    // Subheadings are H2 only: a pasted H1 keeps its text as a paragraph.
    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Title' }],
    })
  })
})
