import Image from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { ChartBlock } from './chartBlock'

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
    Image.configure({ inline: false, allowBase64: true }),
    Placeholder.configure({ placeholder }),
    ChartBlock,
  ]
}
