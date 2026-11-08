import { describe, expect, it } from 'vitest'
import { ROUTE_TABLES } from '@/shared/api/endpoints'
import { env } from '@/shared/config/env'
import { handlers } from '.'

/** 'PUT /watchlists/{}': MSW names a parameter ':id', the API module '{id}'. */
const key = (method: string, path: string) =>
  `${method.toUpperCase()} ${path.replace(/\{[^}]+\}/g, '{}').replace(/:[A-Za-z_]\w*/g, '{}')}`

const handled = new Set(
  handlers.flatMap((handler) => {
    const { method, path } = handler.info as { method?: unknown; path?: unknown }
    if (typeof method !== 'string' || typeof path !== 'string') return []
    return path.startsWith(env.apiBaseUrl) ? [key(method, path.slice(env.apiBaseUrl.length))] : []
  }),
)

describe('the mock back end', () => {
  it('answers every route of the API module', () => {
    const missing = Object.entries(ROUTE_TABLES).flatMap(([area, table]) =>
      Object.entries(table)
        .filter(([, endpoint]) => !handled.has(key(endpoint.method, endpoint.path)))
        .map(([name, endpoint]) => `${area}.${name}: ${endpoint.method} ${endpoint.path}`),
    )
    expect(missing).toEqual([])
  })
})
