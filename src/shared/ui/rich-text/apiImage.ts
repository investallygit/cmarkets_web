import Image from '@tiptap/extension-image'
import { resolveApiUrl, unresolveApiUrl } from '@/shared/config/env'

/**
 * An image of a studio's text: the text keeps the API's own path (/api/v1/research-images/…,
 * /api/v1/news-files/…), which the API checks on save; the page shows it from the API's origin
 * when the API sits on another one.
 */
export const ApiImage = Image.extend({
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
