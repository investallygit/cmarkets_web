import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { resolveApiUrl, unresolveApiUrl } from '@/shared/config/env'
import { ChartBlock } from './chartBlock'

/**
 * The text keeps the API's own path of an image (/api/v1/research-images/…), which the API checks
 * on save; the page shows it from the API's origin when the API sits on another one.
 */
const ApiImage = Image.extend({
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

/** Links the reader follows: web pages and e-mail addresses. */
export const isLinkAllowed = (url: string) => /^(https?:\/\/|mailto:)/i.test(url.trim())

/**
 * The nodes of the studio's toolbar and nothing else (spec section 13: text, tables, images,
 * CMarket charts): what is pasted from elsewhere comes down to them, and the reader of the
 * library draws exactly these.
 */
export function editorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      blockquote: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        isAllowedUri: (url) => isLinkAllowed(url),
      },
    }),
    TableKit.configure({ table: { resizable: false } }),
    ApiImage.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder }),
    ChartBlock,
  ]
}
