import { describe, expect, it } from 'vitest'
import { nextTyping, TYPING_START, type Typing } from './typing'

describe('the command bar of the picture', () => {
  it('types a command, holds it, erases it, then types the next one', () => {
    const commands = ['YCRV', 'EQS']
    const seen: string[] = []
    let state: Typing = TYPING_START
    let held = 0
    for (let step = 0; step < 12; step++) {
      const [next, delay] = nextTyping(state, commands)
      if (delay > 1000) held = state.length
      state = next
      seen.push(commands[state.command].slice(0, state.length))
    }
    expect(seen.slice(0, 4)).toEqual(['Y', 'YC', 'YCR', 'YCRV'])
    expect(held).toBe(4)
    expect(seen.slice(5, 9)).toEqual(['YCR', 'YC', 'Y', ''])
    expect(seen[9]).toBe('')
    expect(state.command).toBe(1)
    expect(seen[10]).toBe('E')
  })
})
