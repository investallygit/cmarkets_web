import Image, { type ImageOptions } from '@tiptap/extension-image'
import { Plugin } from '@tiptap/pm/state'
import { resolveApiUrl, unresolveApiUrl } from '@/shared/config/env'

/**
 * What the API keeps in a studio's text: the studio's own images, or an image written in the text
 * itself (CMarket.Api's `RichText`).
 */
const STUDIO_IMAGE =
  /^(\/api\/v1\/(research-images|news-files)\/|data:image\/(png|jpeg|webp|gif);base64,)/i

/** Whether an image's source is one the API keeps in a text. */
export const isStudioImage = (src: string | null | undefined) =>
  Boolean(src && STUDIO_IMAGE.test(unresolveApiUrl(src)))

/** Whether pasted HTML holds a picture of another program (Word's file:///…). */
export function holdsForeignImage(html: string): boolean {
  if (!/<img/i.test(html)) return false
  const images = new DOMParser().parseFromString(html, 'text/html').images
  return [...images].some((image) => !isStudioImage(image.getAttribute('src')))
}

export interface ApiImageOptions extends ImageOptions {
  /** A paste brought pictures the text cannot keep, which were left out. */
  onForeignImage?: () => void
}

/**
 * An image of a studio's text: the text keeps the API's own path (/api/v1/research-images/…,
 * /api/v1/news-files/…), which the API checks on save; the page shows it from the API's origin
 * when the API sits on another one. A picture pasted or dropped from another program is left out,
 * and `onForeignImage` says so: the API would refuse the text, and every save after it (B77).
 */
export const ApiImage = Image.extend<ApiImageOptions>({
  addOptions() {
    return { ...(this.parent?.() as ImageOptions), onForeignImage: undefined }
  },
  parseHTML() {
    return [
      {
        tag: this.options.allowBase64 ? 'img[src]' : 'img[src]:not([src^="data:"])',
        getAttrs: (element: HTMLElement) =>
          isStudioImage(element.getAttribute('src')) ? null : false,
      },
    ]
  },
  addProseMirrorPlugins() {
    const notify = () => this.options.onForeignImage?.()
    return [
      new Plugin({
        props: {
          transformPastedHTML: (html) => {
            if (holdsForeignImage(html)) notify()
            return html
          },
        },
      }),
    ]
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const src = element.getAttribute('src')
          return src && unresolveApiUrl(src)
        },
        renderHTML: (attributes: { src?: string | null }) => ({
          src: attributes.src ? resolveApiUrl(attributes.src) : null,
        }),
      },
    }
  },
})
