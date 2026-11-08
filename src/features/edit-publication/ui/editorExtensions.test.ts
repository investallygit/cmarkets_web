import { Editor } from '@tiptap/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { editorExtensions } from './editorExtensions'

// The API on another origin than the site, as VITE_API_URL sets it.
vi.mock('@/shared/config/env', async () => {
  const { resolveApiPath, toApiPath } = await import('@/shared/config/readEnv')
  const origin = 'https://api.cmarket.example'
  return {
    resolveApiUrl: (url: string) => resolveApiPath(url, origin),
    unresolveApiUrl: (url: string) => toApiPath(url, origin),
  }
})

const IMAGE = '/api/v1/research-images/7'

let editor: Editor | null = null
afterEach(() => editor?.destroy())

const imageSrc = (doc: ReturnType<Editor['getJSON']>) =>
  doc.content?.find((node) => node.type === 'image')?.attrs?.src

describe('images of the studio', () => {
  it("shows an image from the API's origin and keeps its path in the text", () => {
    editor = new Editor({
      extensions: editorExtensions(''),
      content: { type: 'doc', content: [{ type: 'image', attrs: { src: IMAGE } }] },
    })
    expect(editor.view.dom.querySelector('img')?.getAttribute('src')).toBe(
      'https://api.cmarket.example/api/v1/research-images/7',
    )
    expect(imageSrc(editor.getJSON())).toBe(IMAGE)
  })

  it('takes a pasted image back to the path the API checks on save', () => {
    editor = new Editor({
      extensions: editorExtensions(''),
      content: '<img src="https://api.cmarket.example/api/v1/research-images/7">',
    })
    expect(imageSrc(editor.getJSON())).toBe(IMAGE)
  })
})
