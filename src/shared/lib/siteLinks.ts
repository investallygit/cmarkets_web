/** A run of a text: plain, or an address of this site, opened in the app at `path`. */
export interface TextPart {
  text: string
  path?: string
}

const ADDRESS = /https?:\/\/[^\s<>"]+/g
/** Punctuation that ends a sentence rather than the address: "see https://…/n?article=1." */
const TRAILING = /[.,;:!?)\]'"]+$/

/**
 * Splits a text at the addresses of this site (`origin`), so that a link a member pasted, the
 * address of a news item for one, opens in the app. Other sites' addresses stay plain text.
 */
export function splitSiteLinks(text: string, origin: string): TextPart[] {
  const parts: TextPart[] = []
  let plain = ''
  let last = 0
  for (const match of text.matchAll(ADDRESS)) {
    const address = match[0].replace(TRAILING, '')
    const url = parse(address)
    if (url?.origin !== origin) continue
    plain += text.slice(last, match.index)
    if (plain) parts.push({ text: plain })
    plain = ''
    parts.push({ text: address, path: `${url.pathname}${url.search}${url.hash}` })
    last = match.index + address.length
  }
  plain += text.slice(last)
  if (plain) parts.push({ text: plain })
  return parts
}

function parse(address: string): URL | null {
  try {
    return new URL(address)
  } catch {
    return null
  }
}
