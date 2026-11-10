import { useEffect, type RefObject } from 'react'

/**
 * What the keyboard reaches by itself in a box: not a link taken out of the tab order, as the news
 * tags of a list (their filters are in the screen's bar), nor a hidden file input a button opens.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[contenteditable="true"]',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"]):not([hidden])`)
  .join(', ')

/**
 * A box that scrolls with nothing in it to focus (a note, figures) takes the focus itself, so the
 * keyboard can scroll it too (WCAG 2.1.1). Checked again when the box or its content changes
 * size, as when a panel is resized or its data arrives: not on each tick of the prices.
 */
export function useKeyboardScrolling(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const box = ref.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const update = () => {
      const scrolls = box.scrollHeight > box.clientHeight || box.scrollWidth > box.clientWidth
      if (scrolls && !box.querySelector(FOCUSABLE)) box.tabIndex = 0
      else box.removeAttribute('tabindex')
    }
    const sizes = new ResizeObserver(update)
    const observe = () => {
      sizes.disconnect()
      sizes.observe(box)
      for (const child of box.children) sizes.observe(child)
    }
    observe()
    // The content once loaded replaces the loading state: its size is watched in turn.
    const children = new MutationObserver(() => {
      observe()
      update()
    })
    children.observe(box, { childList: true })
    return () => {
      sizes.disconnect()
      children.disconnect()
    }
  }, [ref])
}
