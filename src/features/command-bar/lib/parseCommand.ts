export interface ParsedCommand {
  /** What precedes the function code: a security code or name, possibly with spaces. */
  securityQuery: string
  functionCode: string | null
}

/**
 * Terminal syntax (spec section 8): a security followed by a function code.
 * "SEMC DES", "ECMR 6.25 2029 YAS", "EQS", "PUB NEW", or a security alone ("SEMC").
 */
export function parseCommand(input: string, knownCodes: ReadonlySet<string>): ParsedCommand {
  const tokens = input.trim().toUpperCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return { securityQuery: '', functionCode: null }

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
