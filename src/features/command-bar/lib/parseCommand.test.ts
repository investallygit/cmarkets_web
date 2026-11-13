import { describe, expect, it } from 'vitest'
import { parseCommand } from './parseCommand'

const CODES = new Set(['DES', 'GP', 'YAS', 'EQS', 'N', 'PUB', 'PUB NEW', 'NET', 'NET ME'])

describe('parseCommand (spec section 8 examples)', () => {
  it('reads a security followed by a function code', () => {
    expect(parseCommand('SEMC DES', CODES)).toEqual({ securityQuery: 'SEMC', functionCode: 'DES' })
    expect(parseCommand('aapl.us des', CODES)).toEqual({
      securityQuery: 'AAPL.US',
      functionCode: 'DES',
    })
    expect(parseCommand('SIAT N', CODES)).toEqual({ securityQuery: 'SIAT', functionCode: 'N' })
  })

  it('keeps spaces inside bond names', () => {
    expect(parseCommand('ECMR 6.25 2029 YAS', CODES)).toEqual({
      securityQuery: 'ECMR 6.25 2029',
      functionCode: 'YAS',
    })
  })

  it('reads a function code alone, including two-word codes', () => {
    expect(parseCommand('eqs', CODES)).toEqual({ securityQuery: '', functionCode: 'EQS' })
    expect(parseCommand('PUB', CODES)).toEqual({ securityQuery: '', functionCode: 'PUB' })
    expect(parseCommand('PUB NEW', CODES)).toEqual({ securityQuery: '', functionCode: 'PUB NEW' })
    // The directory and the user's profile in it (screens 10 and 12).
    expect(parseCommand('net', CODES)).toEqual({ securityQuery: '', functionCode: 'NET' })
    expect(parseCommand('NET ME', CODES)).toEqual({ securityQuery: '', functionCode: 'NET ME' })
  })

  it('reads a code followed by its word, the economy of ECO (screen 25)', () => {
    const codes = new Set([...CODES, 'ECO'])
    const argumentCodes = new Set(['ECO'])
    expect(parseCommand('eco cmr', codes, argumentCodes)).toEqual({
      securityQuery: '',
      functionCode: 'ECO',
      argument: 'CMR',
    })
    expect(parseCommand('ECO', codes, argumentCodes)).toEqual({
      securityQuery: '',
      functionCode: 'ECO',
    })
    expect(parseCommand('CMR ECO', codes, argumentCodes)).toEqual({
      securityQuery: 'CMR',
      functionCode: 'ECO',
    })
    // Another code read last is that code's: "ECO DES" is no economy.
    expect(parseCommand('ECO DES', codes, argumentCodes)).toEqual({
      securityQuery: 'ECO',
      functionCode: 'DES',
    })
  })

  it('reads a security alone', () => {
    expect(parseCommand('  semc ', CODES)).toEqual({ securityQuery: 'SEMC', functionCode: null })
    expect(parseCommand('', CODES)).toEqual({ securityQuery: '', functionCode: null })
  })
})
