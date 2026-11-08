/**
 * npm run test:api: the API module's reads against a running CMarket.Api (development tools on,
 * demo data), for each demo account, as the front end calls them. Each read the account may make
 * (its permissions and plan modules, from /me) must answer without an error and in the shape of
 * its contract. Not part of npm run test:run: see vitest.api.config.ts.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { isApiError, startSession } from '../..'
import { env } from '@/shared/config/env'
import { authApi } from '../auth'
import { bondsApi } from '../bonds'
import { devToolsApi } from '../devTools'
import { meApi } from '../me'
import { securitiesApi } from '../securities'
import { PROBES, type ProbeContext } from './probes'

const { password, accounts } = await devToolsApi.accounts().catch((error: unknown) => {
  throw new Error(
    `No CMarket.Api with its development tools at ${env.apiBaseUrl} (CMARKET_API_URL): ${String(error)}`,
  )
})

/** Logs in as the front end does, with the code the development tools give. */
async function logIn(email: string) {
  const challenge = await authApi.login({ email, password })
  const { code } = await devToolsApi.sentCode({ challengeId: challenge.challengeId })
  startSession(await authApi.verifyOtp({ challengeId: challenge.challengeId, code }))
}

/** The first item's id of a list the account may not read: '' then. */
async function firstId(read: () => Promise<{ id: string }[]>) {
  try {
    return (await read()).at(0)?.id ?? ''
  } catch {
    return ''
  }
}

describe.each(accounts)('$accountType ($email)', ({ email }) => {
  const context = {} as ProbeContext

  beforeAll(async () => {
    await logIn(email)
    context.me = await meApi.get()
    context.equityId = await firstId(() => securitiesApi.list({ type: 'equity' }))
    context.bondId = await firstId(() => bondsApi.list())
  })

  it.for(PROBES)('$name', async (probe, { skip }) => {
    const { me } = context
    if (probe.permission && !me.permissions.includes(probe.permission)) return skip()
    if (probe.module && !me.modules.includes(probe.module)) return skip()

    let answer: unknown
    try {
      answer = await probe.call(context)
    } catch (error) {
      if (probe.mayBeMissing && isApiError(error, 404)) return
      throw error
    }
    expect(answer).toBeDefined()
    probe.check?.(answer as never, context)
  })
})
