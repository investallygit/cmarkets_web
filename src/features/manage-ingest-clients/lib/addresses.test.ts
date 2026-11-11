import { describe, expect, it } from 'vitest'
import { addressLines, isAddressOrRange } from './addresses'

describe('the addresses an ingestion client calls from', () => {
  it('takes single addresses and CIDR ranges, IPv4 and IPv6', () => {
    for (const text of [
      '203.0.113.7',
      '203.0.113.0/24',
      '10.0.0.0/8',
      '::1',
      '2001:db8::/32',
      'fe80::1:2:3:4',
    ])
      expect(isAddressOrRange(text), text).toBe(true)
  })

  it('refuses names, out-of-range parts and prefixes', () => {
    for (const text of [
      'example.com',
      '256.1.1.1',
      '203.0.113.0/33',
      '::1/129',
      '1.2.3',
      '2001:db8::1::2',
      '10.0.0.0/8/1',
      '',
    ])
      expect(isAddressOrRange(text), text).toBe(false)
  })

  it('reads one a line or a comma between, without the repeats', () => {
    expect(addressLines(' 203.0.113.7\n\n10.0.0.0/8, 203.0.113.7 ')).toEqual([
      '203.0.113.7',
      '10.0.0.0/8',
    ])
  })
})
