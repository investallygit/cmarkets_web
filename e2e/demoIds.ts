import { createHash } from 'node:crypto'

/**
 * The id of a demo record: the GUID CMarket.Api's seed derives from a key (`user-ndong`), or from
 * `apiKey` when it names another.
 */
export function demoId(key: string, apiKey = key): string {
  return deterministicGuid(apiKey)
}

/** An analyst: CMarket.Api names them by their account (`analystId('analyst-ndong', 'user-ndong')`). */
export const analystId = (key: string, userKey: string) => demoId(key, userKey)

/** A demo user's CEMAC portfolio: one id per owner. */
export const cemacPortfolioId = (ownerKey: string) =>
  demoId('portfolio-cemac', `portfolio-cemac:${deterministicGuid(ownerKey)}`)

/**
 * CMarket.Api's DeterministicGuid: the SHA-256 of "cmarket-demo:{key}", whose first 16 bytes make
 * the GUID as .NET's Guid(byte[]) reads them, the first three groups little-endian.
 */
function deterministicGuid(key: string): string {
  const bytes = createHash('sha256').update(`cmarket-demo:${key}`).digest()
  const hex = (from: number, to: number, littleEndian = false) => {
    const group = [...bytes.subarray(from, to)]
    if (littleEndian) group.reverse()
    return group.map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return [hex(0, 4, true), hex(4, 6, true), hex(6, 8, true), hex(8, 10), hex(10, 16)].join('-')
}
