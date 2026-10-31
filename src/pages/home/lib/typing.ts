/** The command bar of the picture types a command, holds it, erases it, then types the next. */
export interface Typing {
  command: number
  /** Characters of the command on screen. */
  length: number
  erasing: boolean
}

export const TYPING_START: Typing = { command: 0, length: 0, erasing: false }

const TYPE_MS = 90
const HOLD_MS = 2800
const ERASE_MS = 40
const GAP_MS = 500

/** The state that follows, and how long the current one stays on screen. */
export function nextTyping(state: Typing, commands: readonly string[]): [Typing, number] {
  if (!state.erasing) {
    return state.length < commands[state.command].length
      ? [{ ...state, length: state.length + 1 }, TYPE_MS]
      : [{ ...state, erasing: true }, HOLD_MS]
  }
  return state.length > 0
    ? [{ ...state, length: state.length - 1 }, ERASE_MS]
    : [{ command: (state.command + 1) % commands.length, length: 0, erasing: false }, GAP_MS]
}
