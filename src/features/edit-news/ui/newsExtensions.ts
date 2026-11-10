import { mergeAttributes, Node } from '@tiptap/core'
import { TableKit } from '@tiptap/extension-table'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { SECURITY_CARD_NODE } from '@/shared/api/contracts'
import { ApiImage } from '@/shared/ui/rich-text/apiImage'
import { isLinkAllowed } from '@/shared/ui/rich-text/links'
import { SecurityCardView } from './SecurityCardView'

/** An image of the body with its credit (spec section 16: "JPEG or PNG 2 MB with credit"), shown under it. */
export const NewsImage = ApiImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      credit: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-credit'),
        renderHTML: (attributes: { credit?: string | null }) =>
          attributes.credit ? { 'data-credit': attributes.credit } : {},
      },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    const credit = typeof node.attrs.credit === 'string' ? node.attrs.credit : ''
    const image = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)] as const
    return credit ? ['figure', {}, image, ['figcaption', {}, credit]] : image
  },
})

/** "CMarket security": a card holding a security's id and code; the reader sees its live price. */
export const SecurityCard = Node.create({
  name: SECURITY_CARD_NODE,
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      securityId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-security-id'),
        renderHTML: (attributes) => ({ 'data-security-id': attributes.securityId as string }),
      },
      code: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-code'),
        renderHTML: (attributes) =>
          attributes.code ? { 'data-code': attributes.code as string } : {},
      },
    }
  },
  parseHTML() {
    return [{ tag: 'aside[data-cmarket-security]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes({ 'data-cmarket-security': '' }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(SecurityCardView)
  },
})

/**
 * The nodes of spec section 16's toolbar and nothing else: bold, italic, subheadings, lists,
 * quotes, tables, images with their credit, links and CMarket security cards. What is pasted from
 * elsewhere comes down to them, and the reader of N draws exactly these.
 */
export function newsExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [2] },
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
    NewsImage.configure({ inline: false, allowBase64: false }),
    Placeholder.configure({ placeholder }),
    SecurityCard,
  ]
}
