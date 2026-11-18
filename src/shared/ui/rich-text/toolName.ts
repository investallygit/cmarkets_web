import type { ReactNode } from 'react'

/** The words of a text, without its signs: "• List" → "list". */
const wordsOf = (text: string) =>
  text
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()

/**
 * What screen readers and voice control hear: the title, after the label when the title does not
 * hold the label's words ("H2 · Heading 2"), so that saying what shows reaches the button (WCAG
 * 2.5.3; B05). A label of signs only ("+ ↓") is left to the title.
 */
export function toolName(label: ReactNode, title: string): string {
  if (typeof label !== 'string') return title
  const words = wordsOf(label)
  return words && !wordsOf(title).includes(words) ? `${label} · ${title}` : title
}
