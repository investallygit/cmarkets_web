/**
 * The user's last action (pointer, key, wheel, touch), shared by the tabs of the browser through
 * localStorage, so that working in one tab keeps the others open.
 */
const STORAGE_KEY = 'cmarket.lastActivity'
/** Written at most this often: moving the mouse must not hammer the storage. */
const WRITE_EVERY_MS = 5_000
const EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

let lastActivity = Date.now()
let lastWrite = 0

function readStored(): number {
  try {
    return Number(window.localStorage.getItem(STORAGE_KEY)) || 0
  } catch {
    return 0
  }
}

export function recordActivity(now = Date.now()): void {
  lastActivity = now
  if (now - lastWrite < WRITE_EVERY_MS) return
  lastWrite = now
  try {
    window.localStorage.setItem(STORAGE_KEY, String(now))
  } catch {
    // Storage disabled: each tab counts its own activity.
  }
}

/** The last action in any tab. */
export function lastActivityAt(): number {
  return Math.max(lastActivity, readStored())
}

/** Records the user's actions until the returned function is called. */
export function trackActivity(): () => void {
  // A session starts active, in every tab.
  lastWrite = 0
  recordActivity()
  const listener = () => recordActivity()
  const options = { capture: true, passive: true }
  EVENTS.forEach((event) => window.addEventListener(event, listener, options))
  return () => EVENTS.forEach((event) => window.removeEventListener(event, listener, options))
}
