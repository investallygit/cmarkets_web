import { describe, expect, it } from 'vitest'
import { storedArray, storedArrays } from './db/storage'

describe('the stores of the mock', () => {
  it('builds an array without arguments, as createAccounts(now = Date.now()) expects', () => {
    const store = storedArray(
      () => 'cmarket.prototype.test-array',
      (...args: unknown[]) => [{ args: args.length }],
    )
    expect(store.read()).toEqual([{ args: 0 }])
  })

  it('keeps one array per owner, built for that owner, and remembers it on reload', () => {
    const keyOf = (owner: string) => `cmarket.prototype.test-arrays.${owner}`
    const arrays = storedArrays(keyOf, (owner) => [{ owner }])
    expect(arrays.read('user-a')).toEqual([{ owner: 'user-a' }])
    arrays.write('user-b', [{ owner: 'changed' }])
    expect(arrays.read('user-a')).toEqual([{ owner: 'user-a' }])
    // A new store, as after a reload, reads what was written.
    const reloaded = storedArrays(keyOf, (owner) => [{ owner }])
    expect(reloaded.read('user-b')).toEqual([{ owner: 'changed' }])
  })
})
