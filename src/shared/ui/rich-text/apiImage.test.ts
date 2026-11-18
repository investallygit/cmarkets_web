import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { ApiImage, holdsForeignImage, isStudioImage } from './apiImage'

const WORD = `<p class="MsoNormal">Volumes <b>up</b></p>
<p><img width="200" src="file:///C:/Users/k/AppData/Local/Temp/msohtmlclip1/01/clip_image001.png"></p>
<p><img src="/api/v1/research-images/3f9a/chart.png"></p>`

describe('ApiImage (B77)', () => {
  it("keeps the studio's images and leaves out a picture of another program", () => {
    const editor = new Editor({
      extensions: [StarterKit, ApiImage.configure({ inline: false, allowBase64: true })],
      content: WORD,
    })
    const images = editor.getJSON().content?.filter((node) => node.type === 'image') ?? []
    expect(images.map((image) => image.attrs?.src)).toEqual([
      '/api/v1/research-images/3f9a/chart.png',
    ])
    expect(editor.getText()).toContain('Volumes up')
    editor.destroy()
  })

  it('tells which sources the API keeps', () => {
    expect(isStudioImage('/api/v1/news-files/5d1e/photo.jpg')).toBe(true)
    expect(isStudioImage('data:image/png;base64,iVBORw0KGgo=')).toBe(true)
    expect(isStudioImage('file:///C:/clip_image001.png')).toBe(false)
    expect(isStudioImage('https://example.com/a.png')).toBe(false)
    expect(holdsForeignImage(WORD)).toBe(true)
    expect(holdsForeignImage('<p><img src="/api/v1/research-images/x.png"></p>')).toBe(false)
  })
})
