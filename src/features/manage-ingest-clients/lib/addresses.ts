/** The most addresses or ranges a client may call from (CMarket.Api's IngestClient.MaxAddresses). */
export const MAX_ADDRESSES = 20

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/

/** An IPv6 address: hexadecimal groups with at most one "::". */
function isIpv6(text: string): boolean {
  if (!/^[0-9a-f:]+$/i.test(text) || (text.match(/::/g)?.length ?? 0) > 1) return false
  const groups = text.split(':')
  const compressed = text.includes('::')
  return (
    groups.every((group) => group.length <= 4) &&
    (compressed ? groups.length <= 8 : groups.length === 8 && groups.every(Boolean))
  )
}

/** "203.0.113.7", "203.0.113.0/24", "::1", "2001:db8::/32": an address or a CIDR range. */
export function isAddressOrRange(text: string): boolean {
  const [address, prefix, ...rest] = text.trim().split('/')
  if (rest.length > 0 || !address) return false
  const v4 = IPV4.test(address)
  if (!v4 && !isIpv6(address)) return false
  if (prefix === undefined) return true
  if (!/^\d{1,3}$/.test(prefix)) return false
  return Number(prefix) <= (v4 ? 32 : 128)
}

/** The lines of the field, trimmed, without the empty ones or the repeats. */
export function addressLines(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,]+/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ]
}
