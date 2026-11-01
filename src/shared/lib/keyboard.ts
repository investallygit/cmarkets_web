/** Apple keyboards: shortcuts take ⌘ where others take Ctrl. */
export const IS_APPLE =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** Apple's modifier symbols, in the order Apple writes them: ⌃⌥⇧⌘. */
const APPLE_MODIFIERS: [string, string][] = [
  ['Control', '⌃'],
  ['Alt', '⌥'],
  ['Shift', '⇧'],
  ['Meta', '⌘'],
]

/**
 * A shortcut written as aria-keyshortcuts takes it ("Control+Shift+Z"), the way the keyboard
 * shows it: "Ctrl+Shift+Z", or "⇧⌘Z" on an Apple keyboard. Of several, the first.
 */
export function shortcutLabel(keys: string, apple = IS_APPLE): string {
  const parts = keys.split(' ')[0]?.split('+') ?? []
  const key = parts.at(-1) ?? ''
  if (!apple) return parts.map((part) => (part === 'Control' ? 'Ctrl' : part)).join('+')
  const modifiers = APPLE_MODIFIERS.filter(([name]) => parts.includes(name))
  return `${modifiers.map(([, symbol]) => symbol).join('')}${key}`
}

/** Undo: Ctrl + Z, or ⌘Z on an Apple keyboard. */
export const UNDO_SHORTCUT = IS_APPLE ? 'Meta+Z' : 'Control+Z'
/** Redo: Ctrl + Y or Ctrl + Shift + Z, or ⇧⌘Z on an Apple keyboard. */
export const REDO_SHORTCUT = IS_APPLE ? 'Meta+Shift+Z' : 'Control+Y Control+Shift+Z'

/**
 * Whether a key press asks to undo or to redo: Z with Ctrl or ⌘ alike, Y with Ctrl only, as ⌘Y
 * is the browser's own on a Mac (its history).
 */
export function historyShortcut(event: KeyboardEvent): 'undo' | 'redo' | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return null
  const key = event.key.toLowerCase()
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  return key === 'y' && event.ctrlKey && !event.metaKey && !event.shiftKey ? 'redo' : null
}

/**
 * Whether a key pressed there belongs to what has the focus: text fields, lists and the
 * publication editor keep their own Ctrl + Z, and a dialog its own keys.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"], dialog[open]') !== null
  )
}
