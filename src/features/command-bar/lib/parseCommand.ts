export interface ParsedCommand {
  /** What precedes the function code: a security code or name, possibly with spaces. */
  securityQuery: string
  functionCode: string | null
  /** What follows a code that takes a word after it: the economy of "ECO CMR". */
  argument?: string
}

/**
 * Terminal syntax (spec section 8): a security followed by a function code.
 * "SEMC DES", "ECMR 6.25 2029 YAS", "EQS", "PUB NEW", or a security alone ("SEMC"); a code of
 * `argumentCodes` followed by its word: "ECO CMR" (spec section 9, screen 25).
 */
export function parseCommand(
  input: string,
  knownCodes: ReadonlySet<string>,
  argumentCodes: ReadonlySet<string> = new Set(),
): ParsedCommand {
  const tokens = input.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { securityQuery: '', functionCode: null }

  // A code that takes a word after it, such as ECO: "ECO CMR" opens Cameroon.
  if (tokens.length >= 2 && argumentCodes.has(tokens[0]) && !knownCodes.has(tokens.at(-1) ?? '')) {
    return { securityQuery: '', functionCode: tokens[0], argument: tokens.slice(1).join(' ') }
  }

  // Two-word codes such as "PUB NEW" take precedence over one-word codes.
  if (tokens.length >= 2) {
    const lastTwo = tokens.slice(-2).join(' ')
    if (knownCodes.has(lastTwo)) {
      return { securityQuery: tokens.slice(0, -2).join(' '), functionCode: lastTwo }
    }
  }
  const last = tokens[tokens.length - 1]
  if (knownCodes.has(last)) {
    return { securityQuery: tokens.slice(0, -1).join(' '), functionCode: last }
  }
  return { securityQuery: tokens.join(' '), functionCode: null }
}
