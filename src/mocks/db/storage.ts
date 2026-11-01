/**
 * The browser's localStorage, where the mock keeps its data so that the prototype remembers it on
 * reload, and the stores built on it.
 */

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private browsing or storage disabled: the prototype just forgets on reload.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage disabled: nothing was kept.
  }
}

/**
 * Raised when the sample data changes: the browser's copy of the mock's data is dropped and
 * seeded again, which also ends the session of the prototype.
 */
const SEED_VERSION = '9'
const SEED_VERSION_KEY = 'cmarket.prototype.seedVersion'

function dropOutdatedSeeds(): void {
  try {
    const storage = window.localStorage
    if (storage.getItem(SEED_VERSION_KEY) === SEED_VERSION) return
    Object.keys(storage)
      .filter((key) => key.startsWith('cmarket.prototype.'))
      .forEach((key) => storage.removeItem(key))
    storage.setItem(SEED_VERSION_KEY, SEED_VERSION)
  } catch {
    // Storage disabled: there is no older copy.
  }
}

dropOutdatedSeeds()

/** An array kept in localStorage, so that the prototype remembers it on reload. */
export function storedArray<T extends object[]>(keyOf: () => string, initial: () => T) {
  const cache = new Map<string, T>()
  return {
    read(): T {
      const key = keyOf()
      let value = cache.get(key)
      if (!value) {
        value = parseArray<T>(readStorage(key)) ?? initial()
        cache.set(key, value)
      }
      return value
    },
    write(value: T): void {
      const key = keyOf()
      cache.set(key, value)
      writeStorage(key, JSON.stringify(value))
    },
  }
}

/** Data every account sees, such as the research library. */
export function sharedStore<T extends object[]>(name: string, initial: () => T) {
  return storedArray(() => `cmarket.prototype.${name}`, initial)
}

/** One object every account sees, such as the platform settings. */
export function sharedValue<T extends object>(name: string, initial: () => T) {
  const store = sharedStore<T[]>(name, () => [initial()])
  return {
    read: (): T => store.read()[0] ?? initial(),
    write: (value: T) => store.write([value]),
  }
}

/** Another user's data, read by an Admin; empty if that user never had any. */
export function userArray<T extends object>(name: string, userId: string): T[] {
  return parseArray<T[]>(readStorage(`cmarket.prototype.${name}.${userId}`)) ?? []
}

function parseArray<T extends object[]>(stored: string | null): T | undefined {
  if (!stored) return undefined
  try {
    const value: unknown = JSON.parse(stored)
    return Array.isArray(value) ? (value as T) : undefined
  } catch {
    return undefined
  }
}
