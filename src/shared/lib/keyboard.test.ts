import { describe, expect, it } from 'vitest'
import { historyShortcut, isTypingTarget, shortcutLabel } from './keyboard'

const press = (key: string, modifiers: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { key, ...modifiers })

describe('shortcutLabel', () => {
  it('writes a shortcut as the keyboard shows it', () => {
    expect(shortcutLabel('Control+Z', false)).toBe('Ctrl+Z')
    expect(shortcutLabel('Control+Y Control+Shift+Z', false)).toBe('Ctrl+Y')
    expect(shortcutLabel('Meta+Shift+Z', true)).toBe('⇧⌘Z')
    expect(shortcutLabel('Meta+Z', true)).toBe('⌘Z')
  })
})

describe('historyShortcut', () => {
  it('reads undo and redo with Ctrl or ⌘ alike', () => {
    expect(historyShortcut(press('z', { ctrlKey: true }))).toBe('undo')
    expect(historyShortcut(press('z', { metaKey: true }))).toBe('undo')
    expect(historyShortcut(press('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo')
    expect(historyShortcut(press('y', { ctrlKey: true }))).toBe('redo')
  })

  it('leaves other keys alone, and ⌘Y to the browser', () => {
    expect(historyShortcut(press('y', { metaKey: true }))).toBeNull()
    expect(historyShortcut(press('z'))).toBeNull()
    expect(historyShortcut(press('z', { ctrlKey: true, altKey: true }))).toBeNull()
    expect(historyShortcut(press('k', { ctrlKey: true }))).toBeNull()
  })
})

describe('isTypingTarget', () => {
  it('tells the fields and the editor, which keep their own Ctrl + Z, from the rest', () => {
    document.body.innerHTML = `
      <input id="field" />
      <div contenteditable="true"><p id="text">Text</p></div>
      <button id="button">Button</button>`
    expect(isTypingTarget(document.getElementById('field'))).toBe(true)
    expect(isTypingTarget(document.getElementById('text'))).toBe(true)
    expect(isTypingTarget(document.getElementById('button'))).toBe(false)
    expect(isTypingTarget(null)).toBe(false)
  })
})
