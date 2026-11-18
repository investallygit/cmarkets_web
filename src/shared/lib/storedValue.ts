/**
 * A small value this browser keeps for the user, such as the list a panel shows: read back after a
 * reload, never needed (a private window or a blocked storage starts from the default).
 */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked: the next load starts from the default.
  }
}
